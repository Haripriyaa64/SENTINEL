import hashlib
import json
import os
import socket
import time
from datetime import datetime, timezone
from pathlib import Path

import httpx


EVE_PATH = Path(
    os.getenv("EVE_PATH", "/var/log/suricata/eve.json")
)

API_URL = os.environ["IDS_API_URL"].rstrip("/")
SENSOR_API_KEY = os.environ["SENSOR_API_KEY"]
SENSOR_NAME = os.getenv("SENSOR_NAME", socket.gethostname())

STATE_DIR = Path(
    os.getenv("SENSOR_STATE_DIR", "/var/lib/ids-sensor")
)
SPOOL_PATH = STATE_DIR / "spool.jsonl"
STATE_PATH = STATE_DIR / "offset.json"

BATCH_SIZE = int(os.getenv("BATCH_SIZE", "50"))
POLL_INTERVAL = float(os.getenv("POLL_INTERVAL", "1.0"))


def utc_timestamp(value: str | None) -> str:
    if not value:
        return datetime.now(timezone.utc).isoformat()

    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc).isoformat()


def fingerprint_for(event: dict) -> str:
    payload = {
        "sensor": SENSOR_NAME,
        "timestamp": utc_timestamp(event.get("timestamp")),
        "flow_id": event.get("flow_id"),
        "signature_id": event.get("alert", {}).get("signature_id"),
        "src_ip": event.get("src_ip", ""),
        "dest_ip": event.get("dest_ip", ""),
        "signature": event.get("alert", {}).get("signature", ""),
    }

    encoded = json.dumps(
        payload,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")

    return hashlib.sha256(encoded).hexdigest()


def normalize_event(event: dict) -> dict | None:
    if event.get("event_type") != "alert":
        return None

    alert = event.get("alert") or {}
    severity_number = int(alert.get("severity", 3))

    if severity_number <= 1:
        severity = "Critical"
    elif severity_number == 2:
        severity = "High"
    elif severity_number == 3:
        severity = "Medium"
    else:
        severity = "Low"

    return {
        "timestamp": utc_timestamp(event.get("timestamp")),
        "source_type": "ids",
        "severity": severity,
        "category": str(alert.get("category") or "Suricata alert")[:100],
        "src_ip": str(event.get("src_ip") or ""),
        "dst_ip": str(event.get("dest_ip") or ""),
        "description": str(alert.get("signature") or "Suricata alert"),
        "evidence": {
            "signature_id": alert.get("signature_id"),
            "signature": alert.get("signature"),
            "category": alert.get("category"),
            "suricata_severity": severity_number,
            "proto": event.get("proto"),
            "dest_port": event.get("dest_port"),
            "flow_id": event.get("flow_id"),
            "in_iface": event.get("in_iface"),
        },
        "mitre_id": "",
        "fingerprint": fingerprint_for(event),
        "sensor_name": SENSOR_NAME,
    }


def load_offset() -> dict:
    try:
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return {"inode": None, "offset": 0}


def save_offset(inode: int, offset: int) -> None:
    temporary = STATE_PATH.with_suffix(".tmp")
    temporary.write_text(
        json.dumps({"inode": inode, "offset": offset}),
        encoding="utf-8",
    )
    temporary.replace(STATE_PATH)


def append_spool(items: list[dict]) -> None:
    if not items:
        return

    with SPOOL_PATH.open("a", encoding="utf-8") as handle:
        for item in items:
            handle.write(json.dumps(item) + "\n")


def send_batch(client: httpx.Client, items: list[dict]) -> bool:
    if not items:
        return True

    try:
        response = client.post(
            f"{API_URL}/api/alerts/ingest",
            json=items,
            headers={"X-Sensor-Key": SENSOR_API_KEY},
            timeout=15,
        )
        response.raise_for_status()
        return True
    except (httpx.HTTPError, ValueError) as exc:
        print(f"Alert delivery failed: {exc}", flush=True)
        return False


def flush_spool(client: httpx.Client) -> None:
    if not SPOOL_PATH.exists():
        return

    temporary = SPOOL_PATH.with_suffix(".sending")
    SPOOL_PATH.replace(temporary)

    try:
        batch = []

        with temporary.open("r", encoding="utf-8") as handle:
            for line in handle:
                try:
                    batch.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

                if len(batch) >= BATCH_SIZE:
                    if not send_batch(client, batch):
                        append_spool(batch)
                        remaining = handle.read()
                        with SPOOL_PATH.open("a", encoding="utf-8") as out:
                            out.write(remaining)
                        return
                    batch.clear()

        if batch and not send_batch(client, batch):
            append_spool(batch)

    finally:
        temporary.unlink(missing_ok=True)


def main() -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)

    with httpx.Client() as client:
        while True:
            try:
                flush_spool(client)

                if not EVE_PATH.exists():
                    print(f"Waiting for {EVE_PATH}", flush=True)
                    time.sleep(POLL_INTERVAL)
                    continue

                stat = EVE_PATH.stat()
                state = load_offset()

                # Handle file rotation or replacement.
                if (
                    state["inode"] != stat.st_ino
                    or state["offset"] > stat.st_size
                ):
                    state = {"inode": stat.st_ino, "offset": 0}

                batch = []
                offset = state["offset"]

                with EVE_PATH.open("r", encoding="utf-8") as handle:
                    handle.seek(offset)

                    while True:
                        line = handle.readline()

                        if not line:
                            break

                        new_offset = handle.tell()

                        try:
                            event = json.loads(line)
                            normalized = normalize_event(event)
                            if normalized:
                                batch.append(normalized)
                        except (json.JSONDecodeError, TypeError, ValueError):
                            # Do not advance past an incomplete final line.
                            if not line.endswith("\n"):
                                break

                        offset = new_offset

                        if len(batch) >= BATCH_SIZE:
                            if send_batch(client, batch):
                                batch.clear()
                            else:
                                append_spool(batch)
                                batch.clear()

                save_offset(stat.st_ino, offset)

                if batch and not send_batch(client, batch):
                    append_spool(batch)

                time.sleep(POLL_INTERVAL)

            except Exception as exc:
                print(f"Sensor loop error: {exc}", flush=True)
                time.sleep(5)


if __name__ == "__main__":
    main()
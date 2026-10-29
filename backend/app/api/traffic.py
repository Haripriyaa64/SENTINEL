
from collections import deque
from datetime import datetime, timezone
import hmac

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings

router = APIRouter(prefix="/api/traffic", tags=["Traffic"])

# Recent five-minute buckets, retained in memory for this first version.
MAX_BUCKETS = 288
_buckets = deque(maxlen=MAX_BUCKETS)
_bucket_keys = set()


def check_sensor_key(
    x_sensor_key: str = Header(default="", alias="X-Sensor-Key"),
) -> None:
    if not hmac.compare_digest(
        x_sensor_key.encode("utf-8"),
        settings.sensor_api_key.encode("utf-8"),
    ):
        raise HTTPException(status_code=401, detail="Invalid sensor key")


class TrafficBucket(BaseModel):
    timestamp: datetime
    incoming_bytes: int = Field(ge=0)
    outgoing_bytes: int = Field(ge=0)
    incoming_packets: int = Field(ge=0)
    outgoing_packets: int = Field(ge=0)


@router.post("/ingest", dependencies=[Depends(check_sensor_key)])
def ingest_traffic(items: list[TrafficBucket]) -> dict:
    if len(items) > 100:
        raise HTTPException(status_code=413, detail="Maximum batch size is 100")

    inserted = 0

    for item in items:
        timestamp = item.timestamp.astimezone(timezone.utc)
        key = timestamp.isoformat()

        if key in _bucket_keys:
            continue

        record = item.model_dump()
        record["timestamp"] = timestamp.isoformat()
        _buckets.append(record)
        _bucket_keys.add(key)
        inserted += 1

        # Keep the key set aligned with the bounded deque.
        while len(_bucket_keys) > len(_buckets):
            _bucket_keys = {
                row["timestamp"] for row in _buckets
            }

    return {"received": len(items), "inserted": inserted}


@router.get("")
def get_traffic() -> dict:
    return {
        "interval_seconds": 300,
        "unit": "bytes_per_5_minutes",
        "items": list(_buckets),
    }

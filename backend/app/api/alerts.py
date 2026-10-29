import hashlib
import hmac
import json
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from redis import Redis
from sqlalchemy import desc, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models import Alert, Sensor
from app.schemas.alert import AlertIngest, AlertOut, AlertStatusUpdate


router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


def check_sensor_key(
    x_sensor_key: str = Header(default="", alias="X-Sensor-Key"),
) -> None:
    if not hmac.compare_digest(
        x_sensor_key.encode("utf-8"),
        settings.sensor_api_key.encode("utf-8"),
    ):
        raise HTTPException(status_code=401, detail="Invalid sensor key")


def publish_alert(alert_data: dict) -> None:
    client = Redis.from_url(
        settings.redis_url,
        decode_responses=True,
        socket_connect_timeout=2,
        socket_timeout=2,
    )
    try:
        client.publish("ids:alerts", json.dumps(alert_data, default=str))
    finally:
        client.close()


@router.post("/ingest")
def ingest_alerts(
    items: list[AlertIngest],
    _: None = Depends(check_sensor_key),
    db: Session = Depends(get_db),
) -> dict:
    if not items:
        return {"received": 0, "inserted": 0, "duplicates": 0}

    if len(items) > 500:
        raise HTTPException(
            status_code=413,
            detail="Maximum batch size is 500 alerts",
        )

    inserted = 0
    duplicates = 0
    now = datetime.now(timezone.utc)

    try:
        for item in items:
            sensor = db.scalar(
                select(Sensor).where(Sensor.name == item.sensor_name)
            )

            if sensor is None:
                sensor = Sensor(
                    name=item.sensor_name,
                    hostname=item.sensor_name,
                    ip_address=item.src_ip or "0.0.0.0",
                    sensor_type="suricata",
                    is_active=True,
                    last_seen_at=now,
                )
                db.add(sensor)
                db.flush()
            else:
                sensor.last_seen_at = now
                sensor.is_active = True

            statement = (
                insert(Alert)
                .values(
                    sensor_id=sensor.id,
                    timestamp=item.timestamp,
                    source_type=item.source_type,
                    severity=item.severity,
                    category=item.category,
                    src_ip=item.src_ip,
                    dst_ip=item.dst_ip,
                    description=item.description,
                    evidence=item.evidence,
                    mitre_id=item.mitre_id,
                    fingerprint=item.fingerprint,
                    status="New",
                )
                .on_conflict_do_nothing(
                    constraint="uq_alerts_fingerprint"
                )
                .returning(Alert.id)
            )

            new_id = db.execute(statement).scalar_one_or_none()

            if new_id is None:
                duplicates += 1
            else:
                inserted += 1

        db.commit()

        # Read committed alerts for publication after the transaction.
        new_alerts = db.scalars(
            select(Alert)
            .where(Alert.created_at >= now)
            .order_by(Alert.created_at.desc())
            .limit(inserted)
        ).all()

        for alert in new_alerts:
            try:
                publish_alert(
                    {
                        "id": str(alert.id),
                        "timestamp": alert.timestamp.isoformat(),
                        "severity": alert.severity,
                        "category": alert.category,
                        "src_ip": alert.src_ip,
                        "dst_ip": alert.dst_ip,
                        "description": alert.description,
                        "status": alert.status,
                    }
                )
            except Exception:
                # Redis is for live delivery; PostgreSQL remains the source
                # of truth. A Redis outage must not discard stored alerts.
                pass

    except Exception:
        db.rollback()
        raise

    return {
        "received": len(items),
        "inserted": inserted,
        "duplicates": duplicates,
    }


@router.get("", response_model=list[AlertOut])
def list_alerts(
    severity: str | None = Query(default=None),
    status: str | None = Query(default=None),
    source_type: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[Alert]:
    query = select(Alert)

    if severity:
        query = query.where(Alert.severity == severity)
    if status:
        query = query.where(Alert.status == status)
    if source_type:
        query = query.where(Alert.source_type == source_type)

    query = query.order_by(desc(Alert.timestamp)).offset(offset).limit(limit)
    return list(db.scalars(query).all())


@router.get("/stats")
def alert_stats(db: Session = Depends(get_db)) -> dict:
    total = db.scalar(select(func.count()).select_from(Alert)) or 0

    rows = db.execute(
        select(Alert.severity, func.count())
        .group_by(Alert.severity)
    ).all()

    by_severity = {severity: count for severity, count in rows}

    return {
        "total": total,
        "by_severity": by_severity,
    }


@router.patch("/{alert_id}/status", response_model=AlertOut)
def update_alert_status(
    alert_id: UUID,
    payload: AlertStatusUpdate,
    db: Session = Depends(get_db),
) -> Alert:
    alert = db.get(Alert, alert_id)

    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = payload.status
    db.commit()
    db.refresh(alert)

    return alert
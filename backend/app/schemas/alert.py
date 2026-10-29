import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


Severity = Literal["Low", "Medium", "High", "Critical"]
AlertStatus = Literal["New", "Investigating", "Resolved", "False Positive"]


class AlertIngest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    timestamp: datetime
    source_type: Literal["ids", "ml", "darkweb", "correlation"] = "ids"
    severity: Severity = "Medium"
    category: str = Field(min_length=1, max_length=100)
    src_ip: str = Field(default="", max_length=45)
    dst_ip: str = Field(default="", max_length=45)
    description: str = Field(default="", max_length=10000)
    evidence: dict[str, Any] = Field(default_factory=dict)
    mitre_id: str = Field(default="", max_length=30)
    fingerprint: str = Field(min_length=64, max_length=64)
    sensor_name: str = Field(default="ubuntu-suricata", max_length=100)


class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    timestamp: datetime
    source_type: str
    severity: str
    category: str
    src_ip: str
    dst_ip: str
    description: str
    evidence: dict[str, Any]
    mitre_id: str
    status: str
    fingerprint: str
    created_at: datetime


class AlertStatusUpdate(BaseModel):
    status: AlertStatus
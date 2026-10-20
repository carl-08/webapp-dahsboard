from __future__ import annotations

from datetime import datetime, timezone
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


class ComponentName(StrEnum):
    MICROPHONE = "microphone"
    CAMERA = "camera"
    AUDIO_CLASSIFIER = "audio_classifier"
    FACIAL_RECOGNITION = "facial_recognition"
    SMS = "sms"
    NETWORK = "network"
    LOCAL_STORAGE = "local_storage"
    LOGGING = "logging"
    RASPBERRY_PI_SERVICE = "raspberry_pi_service"


class ComponentStatus(StrEnum):
    ONLINE = "online"
    DEGRADED = "degraded"
    OFFLINE = "offline"
    UNKNOWN = "unknown"
    NOT_CONNECTED = "not_connected"


class MonitoringModeName(StrEnum):
    STANDARD = "standard"
    ADVANCED = "advanced"


class DeviceRegistration(BaseModel):
    device_id: UUID = Field(default_factory=uuid4)
    name: str = Field(min_length=1, max_length=120)


class ComponentHealthReport(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    status: ComponentStatus
    last_seen: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    details: str | None = Field(default=None, max_length=500)


class ComponentHealthRecord(ComponentHealthReport):
    component: ComponentName


class DeviceRecord(BaseModel):
    device_id: UUID
    name: str
    registered_at: datetime
    status: ComponentStatus
    components: list[ComponentHealthRecord]


class BackendHealth(BaseModel):
    status: str
    service: str
    version: str


class IntegrationStatus(BaseModel):
    name: str
    status: str
    implemented: bool
    note: str


class MonitoringModeRecord(BaseModel):
    mode: MonitoringModeName
    updated_at: datetime


class MonitoringModeUpdate(BaseModel):
    mode: MonitoringModeName


class EventCreate(BaseModel):
    event_id: UUID = Field(default_factory=uuid4)
    device_id: UUID | None = None
    event_type: str = Field(min_length=1, max_length=80)
    alert_level: str = Field(min_length=1, max_length=40)
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    detail: str = Field(min_length=1, max_length=2000)


class EventRecord(EventCreate):
    acknowledgement_status: str
    acknowledged_at: datetime | None = None


class EnrollmentStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    ENROLLED = "enrolled"
    FAILED = "failed"


class HouseholdMemberCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class HouseholdMemberRecord(BaseModel):
    member_id: UUID
    name: str
    photo_reference: str
    enrollment_status: EnrollmentStatus
    status_message: str | None
    created_at: datetime
    updated_at: datetime


class FaceEnrollmentResult(BaseModel):
    status: EnrollmentStatus
    message: str | None = Field(default=None, max_length=500)

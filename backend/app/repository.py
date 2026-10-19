from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from uuid import UUID

from .database import Database
from .models import (
    ComponentHealthRecord,
    ComponentHealthReport,
    ComponentName,
    ComponentStatus,
    DeviceRecord,
    DeviceRegistration,
    EventCreate,
    EventRecord,
    MonitoringModeName,
    MonitoringModeRecord,
)

REQUIRED_COMPONENTS = frozenset(ComponentName)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def normalized_datetime(value: str | datetime) -> datetime:
    timestamp = datetime.fromisoformat(value) if isinstance(value, str) else value
    if timestamp.tzinfo is None:
        return timestamp.replace(tzinfo=timezone.utc)
    return timestamp.astimezone(timezone.utc)


def device_status(components: list[ComponentHealthRecord]) -> ComponentStatus:
    if not components:
        return ComponentStatus.UNKNOWN
    statuses_by_name = {component.component: component.status for component in components}
    statuses = set(statuses_by_name.values())
    for status in (
        ComponentStatus.OFFLINE,
        ComponentStatus.DEGRADED,
        ComponentStatus.NOT_CONNECTED,
        ComponentStatus.UNKNOWN,
    ):
        if status in statuses:
            return status
    if not REQUIRED_COMPONENTS.issubset(statuses_by_name):
        return ComponentStatus.UNKNOWN
    return ComponentStatus.ONLINE


def _device_record(connection: sqlite3.Connection, device_row: sqlite3.Row) -> DeviceRecord:
    component_rows = connection.execute(
        "SELECT component, status, last_seen, details FROM component_health "
        "WHERE device_id = ? ORDER BY component",
        (device_row["device_id"],),
    ).fetchall()
    components = [
        ComponentHealthRecord(
            component=row["component"],
            status=row["status"],
            last_seen=normalized_datetime(row["last_seen"]) if row["last_seen"] else None,
            details=row["details"],
        )
        for row in component_rows
    ]
    return DeviceRecord(
        device_id=UUID(device_row["device_id"]),
        name=device_row["name"],
        registered_at=normalized_datetime(device_row["registered_at"]),
        status=device_status(components),
        components=components,
    )


def register_device(database: Database, registration: DeviceRegistration) -> DeviceRecord:
    with database.connect() as connection:
        connection.execute(
            "INSERT INTO devices (device_id, name, registered_at) VALUES (?, ?, ?)",
            (str(registration.device_id), registration.name, utc_now().isoformat()),
        )
        row = connection.execute(
            "SELECT * FROM devices WHERE device_id = ?", (str(registration.device_id),)
        ).fetchone()
        return _device_record(connection, row)


def get_device(database: Database, device_id: UUID) -> DeviceRecord | None:
    with database.connect() as connection:
        row = connection.execute(
            "SELECT * FROM devices WHERE device_id = ?", (str(device_id),)
        ).fetchone()
        return _device_record(connection, row) if row else None


def list_devices(database: Database) -> list[DeviceRecord]:
    with database.connect() as connection:
        rows = connection.execute(
            "SELECT * FROM devices ORDER BY registered_at DESC"
        ).fetchall()
        return [_device_record(connection, row) for row in rows]


def report_component_health(
    database: Database,
    device_id: UUID,
    component: ComponentName,
    report: ComponentHealthReport,
) -> DeviceRecord | None:
    with database.connect() as connection:
        exists = connection.execute(
            "SELECT 1 FROM devices WHERE device_id = ?", (str(device_id),)
        ).fetchone()
        if not exists:
            return None
        connection.execute(
            """
            INSERT INTO component_health (device_id, component, status, last_seen, details)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(device_id, component) DO UPDATE SET
                status = excluded.status,
                last_seen = excluded.last_seen,
                details = excluded.details
            """,
            (
                str(device_id),
                component.value,
                report.status.value if isinstance(report.status, ComponentStatus) else report.status,
                normalized_datetime(report.last_seen).isoformat(),
                report.details,
            ),
        )
        row = connection.execute(
            "SELECT * FROM devices WHERE device_id = ?", (str(device_id),)
        ).fetchone()
        return _device_record(connection, row)


def get_monitoring_mode(database: Database) -> MonitoringModeRecord:
    with database.connect() as connection:
        row = connection.execute(
            "SELECT mode, updated_at FROM monitoring_mode WHERE singleton_id = 1"
        ).fetchone()
        return MonitoringModeRecord(
            mode=MonitoringModeName(row["mode"]),
            updated_at=normalized_datetime(row["updated_at"]),
        )


def set_monitoring_mode(
    database: Database, mode: MonitoringModeName
) -> MonitoringModeRecord:
    updated_at = utc_now()
    with database.connect() as connection:
        connection.execute(
            "UPDATE monitoring_mode SET mode = ?, updated_at = ? WHERE singleton_id = 1",
            (mode.value, updated_at.isoformat()),
        )
    return MonitoringModeRecord(mode=mode, updated_at=updated_at)


def create_event(database: Database, event: EventCreate) -> EventRecord:
    with database.connect() as connection:
        if event.device_id is not None:
            exists = connection.execute(
                "SELECT 1 FROM devices WHERE device_id = ?", (str(event.device_id),)
            ).fetchone()
            if not exists:
                raise ValueError("The referenced device is not registered.")
        connection.execute(
            """
            INSERT INTO events (
                event_id, device_id, event_type, alert_level, occurred_at, detail
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                str(event.event_id),
                str(event.device_id) if event.device_id else None,
                event.event_type,
                event.alert_level,
                normalized_datetime(event.occurred_at).isoformat(),
                event.detail,
            ),
        )
        return EventRecord(**event.model_dump(), acknowledgement_status="pending")


def list_events(database: Database) -> list[EventRecord]:
    with database.connect() as connection:
        rows = connection.execute(
            "SELECT * FROM events ORDER BY occurred_at DESC"
        ).fetchall()
        return [
            EventRecord(
                event_id=UUID(row["event_id"]),
                device_id=UUID(row["device_id"]) if row["device_id"] else None,
                event_type=row["event_type"],
                alert_level=row["alert_level"],
                occurred_at=normalized_datetime(row["occurred_at"]),
                detail=row["detail"],
                acknowledgement_status=row["acknowledgement_status"],
                acknowledged_at=normalized_datetime(row["acknowledged_at"])
                if row["acknowledged_at"]
                else None,
            )
            for row in rows
        ]


def acknowledge_event(database: Database, event_id: UUID) -> EventRecord | None:
    acknowledged_at = utc_now()
    with database.connect() as connection:
        cursor = connection.execute(
            "UPDATE events SET acknowledgement_status = 'acknowledged', "
            "acknowledged_at = ? WHERE event_id = ?",
            (acknowledged_at.isoformat(), str(event_id)),
        )
        if cursor.rowcount == 0:
            return None
        row = connection.execute(
            "SELECT * FROM events WHERE event_id = ?", (str(event_id),)
        ).fetchone()
        return EventRecord(
            event_id=UUID(row["event_id"]),
            device_id=UUID(row["device_id"]) if row["device_id"] else None,
            event_type=row["event_type"],
            alert_level=row["alert_level"],
            occurred_at=normalized_datetime(row["occurred_at"]),
            detail=row["detail"],
            acknowledgement_status=row["acknowledgement_status"],
            acknowledged_at=normalized_datetime(row["acknowledged_at"]),
        )

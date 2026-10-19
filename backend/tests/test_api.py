from __future__ import annotations

from datetime import datetime, timezone
import sqlite3
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.models import ComponentName


def client_for(tmp_path: Path) -> TestClient:
    settings = Settings(
        database_path=tmp_path / "haven-test.sqlite3",
        cors_origins=("http://127.0.0.1:5173",),
    )
    return TestClient(create_app(settings))


def test_health_endpoint_reports_backend_status_and_version(tmp_path: Path):
    with client_for(tmp_path) as client:
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "haven-home-api",
        "version": "0.1.0",
    }


def test_integrations_are_explicitly_unimplemented(tmp_path: Path):
    with client_for(tmp_path) as client:
        response = client.get("/api/v1/integrations")

    assert response.status_code == 200
    assert {item["name"] for item in response.json()} == {
        "microphone",
        "camera",
        "audio_classification",
        "facial_recognition",
        "sms",
    }
    assert all(item["implemented"] is False for item in response.json())
    assert all(item["status"] == "not_implemented" for item in response.json())


def test_device_component_status_and_last_seen(tmp_path: Path):
    device_id = str(uuid4())
    timestamp = datetime(2026, 10, 19, 4, 0, tzinfo=timezone.utc).isoformat()
    with client_for(tmp_path) as client:
        created = client.post(
            "/api/v1/devices",
            json={"device_id": device_id, "name": "Haven Pi"},
        )
        assert created.status_code == 201
        assert created.json()["status"] == "unknown"
        assert created.json()["components"] == []

        reported = client.put(
            f"/api/v1/devices/{device_id}/components/microphone",
            json={"status": "online", "last_seen": timestamp, "details": "ready"},
        )

    assert reported.status_code == 200
    record = reported.json()
    assert record["status"] == "unknown"
    assert record["components"] == [
        {
            "component": "microphone",
            "status": "online",
            "last_seen": timestamp.replace("+00:00", "Z"),
            "details": "ready",
        }
    ]

    with client_for(tmp_path) as client:
        for component in ComponentName:
            if component == ComponentName.MICROPHONE:
                continue
            updated = client.put(
                f"/api/v1/devices/{device_id}/components/{component.value}",
                json={"status": "online", "last_seen": timestamp},
            )

    assert updated.status_code == 200
    assert updated.json()["status"] == "online"


def test_device_status_reports_degraded_and_offline_components(tmp_path: Path):
    device_id = str(uuid4())
    with client_for(tmp_path) as client:
        client.post("/api/v1/devices", json={"device_id": device_id, "name": "Haven Pi"})
        for component in ComponentName:
            response = client.put(
                f"/api/v1/devices/{device_id}/components/{component.value}",
                json={"status": "online"},
            )
        assert response.json()["status"] == "online"
        degraded = client.put(
            f"/api/v1/devices/{device_id}/components/camera",
            json={"status": "degraded"},
        )
        offline = client.put(
            f"/api/v1/devices/{device_id}/components/microphone",
            json={"status": "offline"},
        )

    assert degraded.json()["status"] == "degraded"
    assert offline.json()["status"] == "offline"


def test_unknown_device_health_report_returns_404(tmp_path: Path):
    with client_for(tmp_path) as client:
        response = client.put(
            f"/api/v1/devices/{uuid4()}/components/camera",
            json={"status": "online"},
        )

    assert response.status_code == 404


def test_monitoring_mode_defaults_to_standard_and_persists(tmp_path: Path):
    with client_for(tmp_path) as client:
        initial = client.get("/api/v1/monitoring-mode")
        updated = client.put("/api/v1/monitoring-mode", json={"mode": "advanced"})
        current = client.get("/api/v1/monitoring-mode")

    assert initial.status_code == 200
    assert initial.json()["mode"] == "standard"
    assert updated.json()["mode"] == "advanced"
    assert current.json()["mode"] == "advanced"


def test_event_create_and_acknowledgement_persist(tmp_path: Path):
    event_id = str(uuid4())
    with client_for(tmp_path) as client:
        created = client.post(
            "/api/v1/events",
            json={
                "event_id": event_id,
                "event_type": "audio_trigger",
                "alert_level": "L2",
                "detail": "Test event",
            },
        )
        acknowledged = client.post(f"/api/v1/events/{event_id}/acknowledge")
        listed = client.get("/api/v1/events")

    assert created.status_code == 201
    assert created.json()["acknowledgement_status"] == "pending"
    assert acknowledged.status_code == 200
    assert acknowledged.json()["acknowledgement_status"] == "acknowledged"
    assert acknowledged.json()["acknowledged_at"] is not None
    assert listed.json()[0]["event_id"] == event_id


def test_database_initialization_is_idempotent(tmp_path: Path):
    database_path = tmp_path / "nested" / "haven.sqlite3"
    settings = Settings(database_path=database_path)
    app = create_app(settings)
    with TestClient(app):
        pass
    with TestClient(app):
        pass

    assert database_path.exists()
    with sqlite3.connect(database_path) as connection:
        tables = {
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            )
        }
        initial_mode = connection.execute(
            "SELECT mode FROM monitoring_mode WHERE singleton_id = 1"
        ).fetchone()

    assert {"devices", "component_health", "events", "monitoring_mode"} <= tables
    assert initial_mode == ("standard",)


def test_remote_bind_is_rejected_until_authentication_exists():
    import pytest

    with pytest.raises(ValueError, match="Remote binding is disabled"):
        Settings(host="0.0.0.0")

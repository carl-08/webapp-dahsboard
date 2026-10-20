from __future__ import annotations

from datetime import datetime, timezone
import io
import sqlite3
from pathlib import Path
from uuid import uuid4

from PIL import Image
from fastapi.testclient import TestClient
import pytest

from app.config import Settings
from app.main import create_app
from app.models import ComponentName


TEST_API_TOKEN = "test-only-development-token-0123456789"


def client_for(tmp_path: Path, api_token: str | None = None) -> TestClient:
    settings = Settings(
        database_path=tmp_path / "haven-test.sqlite3",
        photo_storage_path=tmp_path / "private-photos",
        api_token=api_token,
        cors_origins=("http://127.0.0.1:5173",),
    )
    return TestClient(create_app(settings))


def image_bytes(image_format: str) -> bytes:
    image = Image.new("RGB", (32, 24), color=(45, 105, 160))
    buffer = io.BytesIO()
    image.save(buffer, format=image_format)
    return buffer.getvalue()


def auth_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {TEST_API_TOKEN}"}


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
    with pytest.raises(ValueError, match="Remote binding is disabled"):
        Settings(host="0.0.0.0")


def test_enrollment_routes_fail_closed_without_configured_token(tmp_path: Path):
    with client_for(tmp_path) as client:
        response = client.get("/api/v1/members", headers=auth_headers())

    assert response.status_code == 503


@pytest.mark.parametrize(("image_format", "media_type"), [
    ("JPEG", "image/jpeg"),
    ("PNG", "image/png"),
])
def test_member_photo_upload_list_status_and_private_photo_access(
    tmp_path: Path, image_format: str, media_type: str
):
    with client_for(tmp_path, TEST_API_TOKEN) as client:
        created = client.post(
            "/api/v1/members",
            headers=auth_headers(),
            data={"name": "  Alex  "},
            files={"photo": ("../../unsafe-name.png", image_bytes(image_format), "text/plain")},
        )
        assert created.status_code == 201
        member = created.json()
        listed = client.get("/api/v1/members", headers=auth_headers())
        detail = client.get(
            f"/api/v1/members/{member['member_id']}", headers=auth_headers()
        )
        status_response = client.get(
            f"/api/v1/members/{member['member_id']}/status", headers=auth_headers()
        )
        photo = client.get(
            f"/api/v1/members/{member['member_id']}/photo", headers=auth_headers()
        )
        unauthorized_photo = client.get(f"/api/v1/members/{member['member_id']}/photo")

    assert member["name"] == "Alex"
    assert member["enrollment_status"] == "pending"
    assert member["photo_reference"] != "../../unsafe-name.png"
    assert len(listed.json()) == 1
    assert detail.json()["member_id"] == member["member_id"]
    assert status_response.json() == "pending"
    assert photo.status_code == 200
    assert photo.headers["content-type"] == media_type
    assert photo.headers["cache-control"] == "private, no-store"
    with Image.open(io.BytesIO(photo.content)) as decoded_photo:
        assert decoded_photo.format == image_format
        assert decoded_photo.size == (32, 24)
    assert unauthorized_photo.status_code == 401


def test_member_routes_reject_missing_and_invalid_bearer_tokens(tmp_path: Path):
    with client_for(tmp_path, TEST_API_TOKEN) as client:
        missing = client.get("/api/v1/members")
        invalid = client.get(
            "/api/v1/members",
            headers={"Authorization": "Bearer invalid-token"},
        )

    assert missing.status_code == 401
    assert invalid.status_code == 401


@pytest.mark.parametrize(("filename", "contents", "content_type"), [
    ("face.jpg", b"not an image", "image/jpeg"),
    ("face.gif", b"GIF89a", "image/gif"),
])
def test_member_photo_upload_rejects_invalid_or_oversized_files(
    tmp_path: Path, filename: str, contents: bytes, content_type: str
):
    with client_for(tmp_path, TEST_API_TOKEN) as client:
        response = client.post(
            "/api/v1/members",
            headers=auth_headers(),
            data={"name": "Alex"},
            files={"photo": (filename, contents, content_type)},
        )

    assert response.status_code == 400


def test_member_photo_upload_rejects_oversized_files(tmp_path: Path):
    with client_for(tmp_path, TEST_API_TOKEN) as client:
        response = client.post(
            "/api/v1/members",
            headers=auth_headers(),
            data={"name": "Alex"},
            files={"photo": ("face.png", b"x" * (5 * 1024 * 1024 + 1), "image/png")},
        )

    assert response.status_code == 413


def test_member_photo_delete_removes_record_and_private_file(tmp_path: Path):
    with client_for(tmp_path, TEST_API_TOKEN) as client:
        created = client.post(
            "/api/v1/members",
            headers=auth_headers(),
            data={"name": "Alex"},
            files={"photo": ("face.png", image_bytes("PNG"), "image/png")},
        )
        member = created.json()
        private_path = tmp_path / "private-photos" / member["photo_reference"]
        assert private_path.is_file()

        deleted = client.delete(
            f"/api/v1/members/{member['member_id']}", headers=auth_headers()
        )
        listed = client.get("/api/v1/members", headers=auth_headers())
        missing_photo = client.get(
            f"/api/v1/members/{member['member_id']}/photo", headers=auth_headers()
        )

    assert deleted.status_code == 204
    assert listed.json() == []
    assert missing_photo.status_code == 404
    assert not private_path.exists()

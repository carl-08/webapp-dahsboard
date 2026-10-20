# Haven Home local backend

This is a local-only FastAPI service for the existing React/Vite prototype.
It uses SQLite for device registrations, component health reports, events,
monitoring-mode configuration, and household-member enrollment metadata. It
does not connect to physical hardware or provide production authentication.

## Requirements

- Python 3.11 or newer
- pip

## Windows setup

From the repository root:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\python -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
Set-Location backend
..\.venv\Scripts\python -c "from app.config import Settings; from app.database import Database; Database(Settings.from_environment().database_path).initialize()"
..\.venv\Scripts\python -m app
```

The service binds to `127.0.0.1:8000` by default. The explicit database
initialization command is optional because API startup also initializes it.
To enable the development-only enrollment API, edit the local `backend\.env`
and replace `HAVEN_API_TOKEN` with a randomly generated value of at least 32
characters. Do not commit the local `.env` file. The browser enrollment page
asks for this token in memory; it is not persisted by the frontend.

## Raspberry Pi / Linux setup

From the repository root:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
cd backend
../.venv/bin/python -c "from app.config import Settings; from app.database import Database; Database(Settings.from_environment().database_path).initialize()"
../.venv/bin/python -m app
```

The explicit initialization step is optional. The default database is
`backend/data/haven.sqlite3`; it is created automatically on API startup and
excluded from Git.
Set a private token in the local `backend/.env` as described above before using
the enrollment endpoints.

## Check the API

With the server running, use another terminal:

```sh
curl http://127.0.0.1:8000/api/v1/health
```

Expected response:

```json
{"status":"ok","service":"haven-home-api","version":"0.1.0"}
```

Interactive local API documentation is available at
`http://127.0.0.1:8000/docs`.

## API foundation

- `GET /api/v1/health` — backend service status and version.
- `GET /api/v1/integrations` — explicitly lists currently unimplemented
  microphone, camera, audio-classification, facial-recognition, and SMS adapters.
- `POST /api/v1/devices`, `GET /api/v1/devices`,
  `GET /api/v1/devices/{device_id}` — register and inspect device records.
- `PUT /api/v1/devices/{device_id}/components/{component}` — report component
  status, `last_seen`, and optional details. A device is reported online only
  when every defined component has a healthy report; missing reports are unknown.
- `GET` and `PUT /api/v1/monitoring-mode` — read/update persistent mode
  configuration. The initial value is Standard Mode.
- `GET` and `POST /api/v1/events` — list/store event records.
- `POST /api/v1/events/{event_id}/acknowledge` — record an acknowledgement.
- `POST /api/v1/members` — authenticated multipart upload (`name` and `photo`)
  creates a member record with `pending` status.
- `GET /api/v1/members`, `GET /api/v1/members/{member_id}`, and
  `GET /api/v1/members/{member_id}/status` — authenticated enrollment metadata.
- `GET /api/v1/members/{member_id}/photo` — authenticated, private photo
  retrieval; the response is not publicly served as a static asset.
- `DELETE /api/v1/members/{member_id}` — authenticated member and photo deletion.

Enrollment photos are validated by decoded image content, constrained to JPEG
or PNG and at most 5 MB, normalized and re-encoded to remove embedded metadata,
and stored under `backend/data/face_photos` by default (or the path configured
by `HAVEN_PHOTO_STORAGE_PATH`). Only the generated filename reference is stored
in SQLite. Upload acceptance leaves enrollment `pending`; face embeddings and
recognition are not implemented. The `FaceEnrollmentProcessor` protocol is
only an integration boundary.

API schemas and route definitions are under `app/models.py` and `app/api/`.
SQLite setup/repositories are in `app/database.py` and `app/repository.py`.
Replaceable Python protocols and the explicit integration status list are in
`app/interfaces.py`. The web dashboard is not connected to this API; its
existing simulated behavior remains unchanged.

## Tests

From the repository root:

```sh
.venv/bin/python -m pytest -c backend/pytest.ini
```

On Windows:

```powershell
.\.venv\Scripts\python -m pytest -c backend\pytest.ini
```

The tests use temporary SQLite databases and private photo directories. They
cover health, integrations, database initialization, device/component status,
mode persistence, event acknowledgement, non-loopback bind rejection, and
enrollment authentication, upload validation, pending status, protected photo
retrieval, and photo cleanup on deletion.

## Security boundary and next steps

The service intentionally accepts only loopback IP addresses for binding.
Non-loopback hosts are rejected in configuration. The bearer token is a
development-only shared-secret boundary for enrollment routes, not user
identity or role-based authorization. Do not expose the API on a LAN, through
port forwarding, or to the public internet. Before any remote use, implement
real user authentication and authorization (including administrator-only
actions), per-device credentials, TLS, credential rotation, request auditing,
rate limiting, and explicit firewall/VPN or private gateway policy. Never
place production device credentials in the frontend.

Hardware protocols are contracts only. Camera capture, audio capture and
inference, facial recognition, SMS delivery, health probes, real-time
dashboard updates, and production remote access are outside this phase. The
frontend uses `VITE_HAVEN_API_URL` to select the API base URL; it defaults to
`http://127.0.0.1:8000/api/v1`. Enrollment is the only frontend feature
connected to this API; other dashboard values remain demo or unavailable.

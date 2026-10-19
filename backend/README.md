# Haven Home local backend

This is a local-only FastAPI foundation for the existing React/Vite prototype.
It uses SQLite for device registrations, component health reports, events, and
monitoring-mode configuration. It does not connect to physical hardware or
provide production authentication.

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

The tests use temporary SQLite databases and cover health, integrations,
database initialization, device/component status, mode persistence, event
acknowledgement, and rejection of non-loopback bind addresses.

## Security boundary and next steps

The service intentionally accepts only loopback IP addresses for binding.
Non-loopback hosts are rejected in configuration. The local API has no user or
device authentication yet, so do not expose it on a LAN, through port
forwarding, or to the public internet. Before any remote use, implement user
authentication, role-based authorization (including administrator-only mode
changes), per-device credentials, TLS, credential rotation, request auditing,
rate limiting, and explicit firewall/VPN or private gateway policy. Never
place device credentials in the frontend.

Hardware protocols are contracts only. Camera capture, audio capture and
inference, facial recognition, SMS delivery, health probes, real-time
dashboard updates, and production remote access are outside this phase.

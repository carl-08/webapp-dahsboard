from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator


SCHEMA = """
CREATE TABLE IF NOT EXISTS devices (
    device_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    registered_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS component_health (
    device_id TEXT NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    component TEXT NOT NULL,
    status TEXT NOT NULL CHECK (
        status IN ('online', 'degraded', 'offline', 'unknown', 'not_connected')
    ),
    last_seen TEXT,
    details TEXT,
    PRIMARY KEY (device_id, component)
);

CREATE TABLE IF NOT EXISTS events (
    event_id TEXT PRIMARY KEY,
    device_id TEXT REFERENCES devices(device_id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    alert_level TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    detail TEXT NOT NULL,
    acknowledgement_status TEXT NOT NULL DEFAULT 'pending',
    acknowledged_at TEXT
);

CREATE TABLE IF NOT EXISTS monitoring_mode (
    singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
    mode TEXT NOT NULL CHECK (mode IN ('standard', 'advanced')),
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS household_members (
    member_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    photo_reference TEXT NOT NULL UNIQUE,
    enrollment_status TEXT NOT NULL CHECK (
        enrollment_status IN ('pending', 'processing', 'enrolled', 'failed')
    ),
    status_message TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""


class Database:
    def __init__(self, path: Path) -> None:
        self.path = path

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        try:
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def initialize(self) -> None:
        with self.connect() as connection:
            connection.executescript(SCHEMA)
            connection.execute(
                """
                INSERT OR IGNORE INTO monitoring_mode (singleton_id, mode, updated_at)
                VALUES (1, 'standard', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
                """
            )

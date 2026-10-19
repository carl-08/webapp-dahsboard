from __future__ import annotations

import ipaddress
import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BACKEND_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_ROOT / ".env", override=False)


@dataclass(frozen=True)
class Settings:
    host: str = "127.0.0.1"
    port: int = 8000
    database_path: Path = BACKEND_ROOT / "data" / "haven.sqlite3"
    cors_origins: tuple[str, ...] = (
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    )

    def __post_init__(self) -> None:
        try:
            address = ipaddress.ip_address(self.host)
        except ValueError as error:
            raise ValueError("HAVEN_HOST must be a loopback IP address.") from error
        if not address.is_loopback:
            raise ValueError(
                "Remote binding is disabled until authentication and secure "
                "device access are implemented."
            )
        if not 1 <= self.port <= 65535:
            raise ValueError("HAVEN_PORT must be between 1 and 65535.")

    @classmethod
    def from_environment(cls) -> Settings:
        raw_database_path = Path(
            os.getenv("HAVEN_DATABASE_PATH", "data/haven.sqlite3")
        )
        database_path = (
            raw_database_path
            if raw_database_path.is_absolute()
            else BACKEND_ROOT / raw_database_path
        )
        raw_origins = os.getenv(
            "HAVEN_CORS_ORIGINS",
            "http://127.0.0.1:5173,http://localhost:5173",
        )
        origins = tuple(origin.strip() for origin in raw_origins.split(",") if origin.strip())
        try:
            port = int(os.getenv("HAVEN_PORT", "8000"))
        except ValueError as error:
            raise ValueError("HAVEN_PORT must be an integer.") from error

        return cls(
            host=os.getenv("HAVEN_HOST", "127.0.0.1"),
            port=port,
            database_path=database_path,
            cors_origins=origins,
        )

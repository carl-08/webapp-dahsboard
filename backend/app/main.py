from __future__ import annotations

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import __version__
from .api.routes import router
from .config import Settings
from .database import Database


def create_app(settings: Settings | None = None) -> FastAPI:
    app_settings = settings or Settings.from_environment()
    database = Database(app_settings.database_path)

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        database.initialize()
        yield

    application = FastAPI(
        title="Haven Home API",
        version=__version__,
        description="Local Raspberry Pi backend foundation; hardware integrations are not installed.",
        lifespan=lifespan,
    )
    application.state.database = database
    application.add_middleware(
        CORSMiddleware,
        allow_origins=list(app_settings.cors_origins),
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "OPTIONS"],
        allow_headers=["Content-Type"],
    )
    application.include_router(router)
    return application


app = create_app()


if __name__ == "__main__":
    settings = Settings.from_environment()
    uvicorn.run(app, host=settings.host, port=settings.port)

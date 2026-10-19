from __future__ import annotations

import sqlite3
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status

from .. import __version__
from ..database import Database
from ..interfaces import UNIMPLEMENTED_INTEGRATIONS
from ..models import (
    BackendHealth,
    ComponentHealthReport,
    ComponentName,
    DeviceRecord,
    DeviceRegistration,
    EventCreate,
    EventRecord,
    IntegrationStatus,
    MonitoringModeRecord,
    MonitoringModeUpdate,
)
from ..repository import (
    acknowledge_event,
    create_event,
    get_device,
    get_monitoring_mode,
    list_devices,
    list_events,
    register_device,
    report_component_health,
    set_monitoring_mode,
)


router = APIRouter(prefix="/api/v1")


def database_from(request: Request) -> Database:
    return request.app.state.database


@router.get("/health", response_model=BackendHealth)
def health() -> BackendHealth:
    return BackendHealth(status="ok", service="haven-home-api", version=__version__)


@router.get("/integrations", response_model=list[IntegrationStatus])
def integrations() -> list[IntegrationStatus]:
    return [IntegrationStatus(**item) for item in UNIMPLEMENTED_INTEGRATIONS]


@router.post(
    "/devices",
    response_model=DeviceRecord,
    status_code=status.HTTP_201_CREATED,
)
def create_device(registration: DeviceRegistration, request: Request) -> DeviceRecord:
    try:
        return register_device(database_from(request), registration)
    except sqlite3.IntegrityError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A device with this identifier is already registered.",
        ) from error


@router.get("/devices", response_model=list[DeviceRecord])
def devices(request: Request) -> list[DeviceRecord]:
    return list_devices(database_from(request))


@router.get("/devices/{device_id}", response_model=DeviceRecord)
def device(device_id: UUID, request: Request) -> DeviceRecord:
    record = get_device(database_from(request), device_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found.")
    return record


@router.put(
    "/devices/{device_id}/components/{component}",
    response_model=DeviceRecord,
)
def update_component_health(
    device_id: UUID,
    component: ComponentName,
    report: ComponentHealthReport,
    request: Request,
) -> DeviceRecord:
    record = report_component_health(database_from(request), device_id, component, report)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found.")
    return record


@router.get("/monitoring-mode", response_model=MonitoringModeRecord)
def monitoring_mode(request: Request) -> MonitoringModeRecord:
    return get_monitoring_mode(database_from(request))


@router.put("/monitoring-mode", response_model=MonitoringModeRecord)
def update_monitoring_mode(
    update: MonitoringModeUpdate, request: Request
) -> MonitoringModeRecord:
    return set_monitoring_mode(database_from(request), update.mode)


@router.post(
    "/events",
    response_model=EventRecord,
    status_code=status.HTTP_201_CREATED,
)
def create_event_route(event: EventCreate, request: Request) -> EventRecord:
    try:
        return create_event(database_from(request), event)
    except sqlite3.IntegrityError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An event with this identifier already exists.",
        ) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.get("/events", response_model=list[EventRecord])
def events(request: Request) -> list[EventRecord]:
    return list_events(database_from(request))


@router.post("/events/{event_id}/acknowledge", response_model=EventRecord)
def acknowledge_event_route(event_id: UUID, request: Request) -> EventRecord:
    record = acknowledge_event(database_from(request), event_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
    return record

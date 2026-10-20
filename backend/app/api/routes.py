from __future__ import annotations

import sqlite3
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse, Response
from typing import Annotated

from .. import __version__
from ..database import Database
from ..interfaces import UNIMPLEMENTED_INTEGRATIONS
from ..enrollment import (
    MAX_PHOTO_BYTES,
    InvalidPhotoError,
    PhotoTooLargeError,
    delete_member_photo_and_record,
    photo_path,
    validate_and_store_photo,
)
from ..models import (
    BackendHealth,
    ComponentHealthReport,
    ComponentName,
    DeviceRecord,
    DeviceRegistration,
    EventCreate,
    EventRecord,
    EnrollmentStatus,
    HouseholdMemberRecord,
    IntegrationStatus,
    MonitoringModeRecord,
    MonitoringModeUpdate,
)
from ..repository import (
    acknowledge_event,
    create_event,
    create_household_member,
    delete_household_member,
    get_device,
    get_household_member,
    get_monitoring_mode,
    list_devices,
    list_events,
    list_household_members,
    register_device,
    report_component_health,
    set_monitoring_mode,
)
from ..security import require_development_bearer


router = APIRouter(prefix="/api/v1")
member_authorization = [Depends(require_development_bearer)]


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


async def read_bounded_upload(photo: UploadFile) -> bytes:
    contents = bytearray()
    while chunk := await photo.read(64 * 1024):
        contents.extend(chunk)
        if len(contents) > MAX_PHOTO_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="The photo exceeds the 5 MB upload limit.",
            )
    return bytes(contents)


@router.post(
    "/members",
    response_model=HouseholdMemberRecord,
    status_code=status.HTTP_201_CREATED,
    dependencies=member_authorization,
)
async def enroll_member(
    request: Request,
    name: Annotated[str, Form(min_length=1, max_length=80)],
    photo: Annotated[UploadFile, File()],
) -> HouseholdMemberRecord:
    normalized_name = name.strip()
    if not normalized_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Member name must not be empty.",
        )
    settings = request.app.state.settings
    try:
        data = await read_bounded_upload(photo)
        try:
            photo_reference, _media_type = validate_and_store_photo(
                data, settings.photo_storage_path
            )
        except PhotoTooLargeError as error:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=str(error)
            ) from error
        except InvalidPhotoError as error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)
            ) from error
    finally:
        await photo.close()

    member_id = UUID(photo_reference.split(".", maxsplit=1)[0])
    try:
        return create_household_member(
            request.app.state.database, member_id, normalized_name, photo_reference
        )
    except sqlite3.IntegrityError as error:
        try:
            photo_path(settings.photo_storage_path, photo_reference).unlink(missing_ok=True)
        except OSError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Enrollment could not be saved and private photo cleanup failed.",
            ) from error
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The enrollment record could not be created.",
        ) from error


@router.get(
    "/members",
    response_model=list[HouseholdMemberRecord],
    dependencies=member_authorization,
)
def household_members(request: Request) -> list[HouseholdMemberRecord]:
    return list_household_members(request.app.state.database)


@router.get(
    "/members/{member_id}",
    response_model=HouseholdMemberRecord,
    dependencies=member_authorization,
)
def household_member(member_id: UUID, request: Request) -> HouseholdMemberRecord:
    member = get_household_member(request.app.state.database, member_id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found.")
    return member


@router.get(
    "/members/{member_id}/status",
    response_model=EnrollmentStatus,
    dependencies=member_authorization,
)
def household_member_status(member_id: UUID, request: Request) -> EnrollmentStatus:
    member = get_household_member(request.app.state.database, member_id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found.")
    return member.enrollment_status


@router.get(
    "/members/{member_id}/photo",
    dependencies=member_authorization,
)
def household_member_photo(member_id: UUID, request: Request) -> Response:
    member = get_household_member(request.app.state.database, member_id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found.")
    try:
        target = photo_path(
            request.app.state.settings.photo_storage_path, member.photo_reference
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stored photo reference is invalid.",
        ) from error
    if not target.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found.")
    media_type = "image/jpeg" if target.suffix == ".jpg" else "image/png"
    return FileResponse(
        target,
        media_type=media_type,
        headers={
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "default-src 'none'; sandbox",
        },
    )


@router.delete(
    "/members/{member_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=member_authorization,
)
def delete_member(member_id: UUID, request: Request) -> Response:
    database = request.app.state.database
    member = get_household_member(database, member_id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found.")
    try:
        delete_member_photo_and_record(
            database, request.app.state.settings.photo_storage_path, member
        )
    except OSError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Member deletion could not be completed. The record and photo were retained.",
        ) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)

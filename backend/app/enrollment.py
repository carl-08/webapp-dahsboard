from __future__ import annotations

import io
import logging
import warnings
from pathlib import Path
from uuid import UUID, uuid4

from PIL import Image, ImageOps, UnidentifiedImageError

from .database import Database
from .models import EnrollmentStatus, HouseholdMemberRecord


logger = logging.getLogger(__name__)
MAX_PHOTO_BYTES = 5 * 1024 * 1024
MAX_IMAGE_DIMENSION = 8192
MAX_IMAGE_PIXELS = 16_000_000
ALLOWED_FORMATS = {"JPEG": ("JPEG", ".jpg"), "PNG": ("PNG", ".png")}


class InvalidPhotoError(ValueError):
    pass


class PhotoTooLargeError(ValueError):
    pass


def validate_and_store_photo(data: bytes, storage_dir: Path) -> tuple[str, str]:
    if not data:
        raise InvalidPhotoError("Choose a non-empty JPEG or PNG photo.")
    if len(data) > MAX_PHOTO_BYTES:
        raise PhotoTooLargeError("The photo exceeds the 5 MB upload limit.")

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(data)) as source:
                detected_format = source.format
                if detected_format not in ALLOWED_FORMATS:
                    raise InvalidPhotoError("Upload a valid JPEG or PNG image.")
                width, height = source.size
                if (
                    width < 1
                    or height < 1
                    or width > MAX_IMAGE_DIMENSION
                    or height > MAX_IMAGE_DIMENSION
                    or width * height > MAX_IMAGE_PIXELS
                ):
                    raise InvalidPhotoError(
                        "The photo dimensions exceed the supported limit."
                    )
                source.verify()

            with Image.open(io.BytesIO(data)) as source:
                if source.format != detected_format:
                    raise InvalidPhotoError("The image format could not be verified.")
                source.load()
                image = ImageOps.exif_transpose(source)
                if detected_format == "JPEG":
                    image = image.convert("RGB")
                elif image.mode not in ("RGB", "RGBA"):
                    image = image.convert("RGBA")

                format_name, extension = ALLOWED_FORMATS[detected_format]
                reference = f"{uuid4().hex}{extension}"
                storage_dir.mkdir(parents=True, exist_ok=True)
                try:
                    storage_dir.chmod(0o700)
                except OSError:
                    logger.debug("Private photo directory permissions are OS-managed.")
                target = storage_dir / reference
                image.save(target, format=format_name, optimize=True)
                try:
                    target.chmod(0o600)
                except OSError:
                    logger.debug("Private photo file permissions are OS-managed.")
                return reference, f"image/{'jpeg' if format_name == 'JPEG' else 'png'}"
    except InvalidPhotoError:
        raise
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError,
            Image.DecompressionBombWarning, SyntaxError, ValueError) as error:
        raise InvalidPhotoError("The uploaded file is not a safe, readable image.") from error


def photo_path(storage_dir: Path, reference: str) -> Path:
    candidate = (storage_dir / reference).resolve()
    root = storage_dir.resolve()
    if candidate.parent != root or candidate.name != reference:
        raise ValueError("Invalid stored photo reference.")
    return candidate


def delete_member_photo_and_record(
    database: Database, storage_dir: Path, member: HouseholdMemberRecord
) -> None:
    original_path = photo_path(storage_dir, member.photo_reference)
    staged_path: Path | None = None
    if original_path.exists():
        staged_path = original_path.with_name(
            f".{original_path.name}.deleting-{uuid4().hex}"
        )
        original_path.replace(staged_path)

    try:
        with database.connect() as connection:
            connection.execute(
                "DELETE FROM household_members WHERE member_id = ?",
                (str(member.member_id),),
            )
    except Exception:
        if staged_path is not None and staged_path.exists():
            staged_path.replace(original_path)
        raise

    if staged_path is not None:
        try:
            staged_path.unlink()
        except OSError:
            try:
                with database.connect() as connection:
                    connection.execute(
                        """
                        INSERT INTO household_members (
                            member_id, name, photo_reference, enrollment_status,
                            status_message, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            str(member.member_id),
                            member.name,
                            member.photo_reference,
                            member.enrollment_status.value,
                            member.status_message,
                            member.created_at.isoformat(),
                            member.updated_at.isoformat(),
                        ),
                    )
                staged_path.replace(original_path)
            except Exception:
                logger.exception("Failed to restore enrollment after photo cleanup error.")
            raise

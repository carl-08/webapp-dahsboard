from __future__ import annotations

from typing import Protocol
from uuid import UUID

from .models import FaceEnrollmentResult


class FaceEnrollmentProcessor(Protocol):
    async def process_photo(
        self, member_id: UUID, private_photo_path: str
    ) -> FaceEnrollmentResult:
        """Process a stored photo and return a status based on a real result."""
        ...

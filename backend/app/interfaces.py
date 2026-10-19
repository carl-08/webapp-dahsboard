from __future__ import annotations

from typing import Protocol

from .models import ComponentStatus


class IntegrationUnavailableError(RuntimeError):
    """Raised when an operation needs a hardware/provider adapter not installed."""


class MicrophoneInterface(Protocol):
    async def capture_audio(self, duration_seconds: float) -> bytes: ...

    async def health_status(self) -> ComponentStatus: ...


class CameraInterface(Protocol):
    async def capture_frame(self) -> bytes: ...

    async def health_status(self) -> ComponentStatus: ...


class AudioClassificationInterface(Protocol):
    async def classify(self, audio: bytes) -> dict[str, object]: ...


class FacialRecognitionInterface(Protocol):
    async def identify(self, frame: bytes) -> dict[str, object]: ...


class SmsInterface(Protocol):
    async def send(self, destination: str, message: str) -> str: ...


UNIMPLEMENTED_INTEGRATIONS = (
    {
        "name": "microphone",
        "status": "not_implemented",
        "implemented": False,
        "note": "No microphone driver or audio capture implementation is installed.",
    },
    {
        "name": "camera",
        "status": "not_implemented",
        "implemented": False,
        "note": "No camera capture implementation is installed.",
    },
    {
        "name": "audio_classification",
        "status": "not_implemented",
        "implemented": False,
        "note": "No audio inference model or classification service is installed.",
    },
    {
        "name": "facial_recognition",
        "status": "not_implemented",
        "implemented": False,
        "note": "No face detection or recognition service is installed.",
    },
    {
        "name": "sms",
        "status": "not_implemented",
        "implemented": False,
        "note": "No SMS modem/provider integration is installed.",
    },
)

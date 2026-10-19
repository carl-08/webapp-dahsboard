from .main import app
from .config import Settings
import uvicorn


def main() -> None:
    settings = Settings.from_environment()
    uvicorn.run(app, host=settings.host, port=settings.port)


if __name__ == "__main__":
    main()

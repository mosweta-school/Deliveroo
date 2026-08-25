"""
Called once inside create_app(). Everywhere else, get a logger with:
    import logging
    logger = logging.getLogger(__name__)
"""

import logging
import sys
from pathlib import Path

LOG_DIR = Path("logs")
LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"


def setup_logging(app) -> None:
    LOG_DIR.mkdir(exist_ok=True)

    formatter = logging.Formatter(LOG_FORMAT, datefmt="%Y-%m-%d %H:%M:%S")

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    file_handler = logging.FileHandler(LOG_DIR / "app.log")
    file_handler.setFormatter(formatter)

    level = logging.DEBUG if app.config.get("DEBUG") else logging.INFO

    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.handlers.clear()
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)

    app.logger.handlers = root_logger.handlers
    app.logger.setLevel(level)

    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

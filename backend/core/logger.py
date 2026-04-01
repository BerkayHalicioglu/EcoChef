"""
EcoChef Logging Katmanı
-----------------------
Tüm uygulama tek bir logger konfigürasyonunu paylaşır.

Format (JSON-lines tarzı okunabilir):
  2026-04-01 12:00:00 | INFO     | vision_agent  | Detected 3 ingredients in 0.42s
  2026-04-01 12:00:01 | ERROR    | nlp_agent     | Model file not found: model.gguf

Kullanım:
  from core.logger import get_logger
  log = get_logger(__name__)
  log.info("Mesaj")
"""

import logging
import sys
import time
from contextlib import contextmanager
from functools import wraps
from typing import Callable

# ------------------------------------------------------------------ #
# Format & Handler                                                     #
# ------------------------------------------------------------------ #

_FORMATTER = logging.Formatter(
    fmt="%(asctime)s | %(levelname)-8s | %(name)-16s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

_handler = logging.StreamHandler(sys.stdout)
_handler.setFormatter(_FORMATTER)

# ------------------------------------------------------------------ #
# Root logger ayarı — sadece bir kez yapılır                          #
# ------------------------------------------------------------------ #

logging.basicConfig(level=logging.WARNING)          # 3rd-party gürültüyü kapat
_root = logging.getLogger("ecochef")
_root.setLevel(logging.DEBUG)
if not _root.handlers:
    _root.addHandler(_handler)
_root.propagate = False


def get_logger(name: str) -> logging.Logger:
    """
    Her modül için hiyerarşik bir logger döner.

    Kullanım:
        log = get_logger(__name__)  # → ecochef.agents.vision_agent
    """
    # __name__ genellikle "agents.vision_agent" gibi gelir
    # "ecochef." prefix ekleyerek hiyerarşiye bağlarız
    child_name = f"ecochef.{name}" if not name.startswith("ecochef") else name
    return logging.getLogger(child_name)


# ------------------------------------------------------------------ #
# Yardımcı araçlar                                                    #
# ------------------------------------------------------------------ #

@contextmanager
def log_duration(logger: logging.Logger, operation: str):
    """
    Bir bloğun süresini ölçer ve loglar.

    Kullanım:
        with log_duration(log, "YOLO inference"):
            results = model(img)
        # → INFO | YOLO inference completed in 0.38s
    """
    start = time.perf_counter()
    try:
        yield
    except Exception:
        elapsed = time.perf_counter() - start
        logger.error("%s failed after %.2fs", operation, elapsed)
        raise
    else:
        elapsed = time.perf_counter() - start
        logger.info("%s completed in %.2fs", operation, elapsed)


def log_call(logger: logging.Logger):
    """
    Fonksiyon girişini ve çıkışını (veya hatasını) otomatik loglar.

    Kullanım:
        @log_call(log)
        def detect(cls, image_bytes): ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            logger.debug("→ %s called", func.__qualname__)
            try:
                result = func(*args, **kwargs)
                logger.debug("← %s returned", func.__qualname__)
                return result
            except Exception as exc:
                logger.error("✗ %s raised %s: %s", func.__qualname__, type(exc).__name__, exc)
                raise
        return wrapper
    return decorator

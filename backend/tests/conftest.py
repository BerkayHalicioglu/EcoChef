"""
Paylaşılan test fixture'ları ve sahte (mock) nesneler.
Gerçek YOLO ve Llama modelleri yüklenmez — testler hızlı ve izole çalışır.
"""

import io
import sys
import types
from pathlib import Path
from unittest.mock import MagicMock, patch

import numpy as np
import pytest
from fastapi.testclient import TestClient

# ------------------------------------------------------------------ #
# Ağır bağımlılıkları test ortamında stub ile değiştir               #
# ------------------------------------------------------------------ #

# ultralytics stub
ultralytics_stub = types.ModuleType("ultralytics")
ultralytics_stub.YOLO = MagicMock()
sys.modules.setdefault("ultralytics", ultralytics_stub)

# llama_cpp stub
llama_stub = types.ModuleType("llama_cpp")
llama_stub.Llama = MagicMock()
sys.modules.setdefault("llama_cpp", llama_stub)

# cv2 stub
cv2_stub = types.ModuleType("cv2")
cv2_stub.imdecode = MagicMock(return_value=np.zeros((100, 100, 3), dtype=np.uint8))
cv2_stub.IMREAD_COLOR = 1
sys.modules.setdefault("cv2", cv2_stub)


# ------------------------------------------------------------------ #
# Fixture: gerçek bir JPEG byte dizisi (1x1 siyah piksel)            #
# ------------------------------------------------------------------ #

@pytest.fixture
def sample_image_bytes() -> bytes:
    """Geçerli bir JPEG görüntüsünün ham byte verisi."""
    from PIL import Image

    img = Image.new("RGB", (10, 10), color=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


# ------------------------------------------------------------------ #
# Fixture: FastAPI test istemcisi                                     #
# ------------------------------------------------------------------ #

@pytest.fixture
def client():
    from main import app
    with TestClient(app) as c:
        yield c

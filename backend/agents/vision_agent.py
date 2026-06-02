import cv2
import numpy as np
from ultralytics import YOLO

from core.config import settings
from core.ingredient_translator import is_food_class
from core.logger import get_logger

log = get_logger(__name__)


class VisionAgent:
    """
    Görüntü üzerinde YOLO tabanlı malzeme tespiti yapar.
    Model tek seferinde yüklenir (Singleton benzeri sınıf düzeyinde önbellek).
    """

    _model: YOLO | None = None

    @classmethod
    def _get_model(cls) -> YOLO:
        if cls._model is None:
            log.info("Loading YOLO model from %s", settings.yolo_model_path)
            cls._model = YOLO(str(settings.yolo_model_path))
            log.info("YOLO model loaded successfully")
        return cls._model

    @classmethod
    def detect(cls, image_bytes: bytes) -> list[str]:
        """
        Ham görüntü byte'larını alır, tespit edilen benzersiz malzeme isimlerini döner.

        Filtreler:
          - Confidence eşiği (settings.yolo_confidence) altındaki tespitler atılır.
          - settings.yolo_food_only=True ise yalnızca yiyecek sınıfları döner.

        Args:
            image_bytes: UploadFile'dan okunan ham byte verisi.

        Returns:
            Benzersiz sınıf isimlerinin listesi (örn. ['apple', 'carrot']).
        """
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        model = cls._get_model()
        results = model(img, conf=settings.yolo_confidence, verbose=False)

        detected: list[str] = []
        for r in results:
            for box in r.boxes:
                conf = float(box.conf[0])
                class_id = int(box.cls[0])
                name = model.names[class_id]

                if settings.yolo_food_only and not is_food_class(name):
                    log.debug("VisionAgent.detect | skipped non-food class=%s conf=%.2f", name, conf)
                    continue

                detected.append(name)
                log.debug("VisionAgent.detect | accepted class=%s conf=%.2f", name, conf)

        unique = list(set(detected))
        log.info("VisionAgent.detect | conf_threshold=%.2f raw=%d unique=%d items=%s",
                 settings.yolo_confidence, len(detected), len(unique), unique)
        return unique

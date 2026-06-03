import cv2
import numpy as np
from ultralytics import YOLO

from core.config import settings
from core.ingredient_translator import is_food_class
from core.logger import get_logger

log = get_logger(__name__)

# COCO modeli bu sınıfları bilmediği için benzer görünümlü sınıflara karıştırır.
# Renk analizi ile düzeltilebilecek bilinen karışıklıklar:
#   lemon  → COCO'da yok, sarı+yuvarlak olduğu için "orange" sanılır
#   tomato → COCO 80'de yok, kırmızı+yuvarlak olduğu için "apple" sanılır
_COLOR_CORRECTIONS: dict[str, list[tuple[tuple[int,int,int], tuple[int,int,int], str]]] = {
    # (class_name): [(hsv_lower, hsv_upper, corrected_name), ...]
    # Kural sırası önemli — ilk eşleşen kazanır.
    "orange": [
        # Domates/kırmızı elma: saf kırmızı, hue 0-10 (HSV'de kırmızı 0'a yakın)
        ((0, 100, 60), (10, 255, 255), "tomato"),
        # Domates/kırmızı elma: kırmızı wrap, hue 165-180
        ((165, 100, 60), (180, 255, 255), "tomato"),
        # Limon: parlak sarı, hue 22-38
        ((22, 80, 120), (38, 255, 255), "lemon"),
        # Gerçek portakal: hue 10-22 → düzeltme yok, "orange" kalır
    ],
    # "apple" sınıfı COCO'da var — YOLO bunu doğru tanıyor, dokunmuyoruz.
}


def _crop(img: np.ndarray, box_xyxy) -> np.ndarray:
    """Bounding box koordinatlarından görüntü kırpması döner."""
    x1, y1, x2, y2 = map(int, box_xyxy)
    h, w = img.shape[:2]
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)
    return img[y1:y2, x1:x2]


def _dominant_hsv_ratio(crop: np.ndarray, lower: tuple, upper: tuple) -> float:
    """Kırpılan alandaki piksellerin kaçının verilen HSV aralığında olduğunu 0-1 arası döner."""
    if crop.size == 0:
        return 0.0
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    mask = cv2.inRange(hsv, np.array(lower), np.array(upper))
    return float(np.count_nonzero(mask)) / mask.size


def _color_correct(img: np.ndarray, box_xyxy, class_name: str) -> str:
    """
    Renk analizi ile COCO model karışıklıklarını düzeltir.
    Yeterli renk kanıtı yoksa orijinal sınıf adı döner.
    """
    rules = _COLOR_CORRECTIONS.get(class_name)
    if not rules:
        return class_name

    crop = _crop(img, box_xyxy)
    for lower, upper, corrected in rules:
        ratio = _dominant_hsv_ratio(crop, lower, upper)
        if ratio > 0.25:  # piksellerin %25+ renk aralığında → düzelt
            log.debug(
                "VisionAgent | color correction: %s → %s (ratio=%.2f)",
                class_name, corrected, ratio,
            )
            return corrected

    return class_name


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
          - Bilinen COCO renk karışıklıkları (lemon/orange, tomato/apple) düzeltilir.

        Returns:
            Benzersiz sınıf isimlerinin listesi (örn. ['lemon', 'tomato']).
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

                # Renk bazlı düzeltme — COCO sınıf eksikliğini telafi eder
                corrected = _color_correct(img, box.xyxy[0].tolist(), name)
                detected.append(corrected)
                log.debug("VisionAgent.detect | accepted class=%s→%s conf=%.2f", name, corrected, conf)

        unique = list(set(detected))
        log.info("VisionAgent.detect | conf_threshold=%.2f raw=%d unique=%d items=%s",
                 settings.yolo_confidence, len(detected), len(unique), unique)
        return unique

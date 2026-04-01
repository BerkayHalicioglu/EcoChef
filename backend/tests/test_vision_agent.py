from unittest.mock import MagicMock, patch

import pytest


class TestVisionAgentDetect:

    def setup_method(self):
        """Her testten önce sınıf düzeyindeki model önbelleğini sıfırla."""
        from agents.vision_agent import VisionAgent
        VisionAgent._model = None

    def _make_yolo_result(self, class_ids: list[int], names: dict[int, str]):
        """Sahte YOLO sonuç nesnesi üretir."""
        boxes = []
        for cid in class_ids:
            box = MagicMock()
            box.cls = [cid]
            boxes.append(box)

        result = MagicMock()
        result.boxes = boxes

        mock_model = MagicMock()
        mock_model.return_value = [result]
        mock_model.names = names
        return mock_model

    def test_detect_returns_unique_items(self, sample_image_bytes):
        """Aynı sınıf birden fazla tespit edilse bile tekrar eden isimler dönemez."""
        from agents.vision_agent import VisionAgent

        mock_model = self._make_yolo_result(
            class_ids=[0, 0, 1],
            names={0: "apple", 1: "carrot"},
        )

        with patch("agents.vision_agent.YOLO", return_value=mock_model):
            result = VisionAgent.detect(sample_image_bytes)

        assert sorted(result) == ["apple", "carrot"]

    def test_detect_returns_empty_when_nothing_found(self, sample_image_bytes):
        """YOLO hiçbir nesne tespit etmediğinde boş liste döner."""
        from agents.vision_agent import VisionAgent

        mock_model = MagicMock()
        mock_model.return_value = [MagicMock(boxes=[])]
        mock_model.names = {}

        with patch("agents.vision_agent.YOLO", return_value=mock_model):
            result = VisionAgent.detect(sample_image_bytes)

        assert result == []

    def test_model_loaded_once(self, sample_image_bytes):
        """Model ikinci çağrıda yeniden yüklenmez (singleton davranışı)."""
        from agents.vision_agent import VisionAgent

        mock_model = self._make_yolo_result([0], {0: "tomato"})

        with patch("agents.vision_agent.YOLO", return_value=mock_model) as yolo_cls:
            VisionAgent.detect(sample_image_bytes)
            VisionAgent.detect(sample_image_bytes)
            yolo_cls.assert_called_once()

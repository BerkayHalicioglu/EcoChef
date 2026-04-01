from unittest.mock import patch

import pytest


SAMPLE_INGREDIENTS = ["tomato", "egg"]
SAMPLE_RECIPES = [{"id": 1, "isim": "Menemen", "gorsel": None,
                   "kullanilan_malzemeler": ["tomato"], "eksik_malzemeler": []}]
SAMPLE_SUGGESTIONS = [
    {"isim": "Menemen", "neden": "Domates ve yumurta var"},
    {"isim": "Omlet", "neden": "Hızlı"},
    {"isim": "Çılbır", "neden": "Lezzetli"},
]


class TestImagePipeline:

    def test_returns_result_on_success(self, sample_image_bytes):
        from core.orchestrator import EcoChefOrchestrator

        with patch("core.orchestrator.VisionAgent.detect", return_value=SAMPLE_INGREDIENTS), \
             patch("core.orchestrator.find_recipes_by_ingredients", return_value=SAMPLE_RECIPES):
            result = EcoChefOrchestrator.image_pipeline(sample_image_bytes)

        assert result.detected_ingredients == SAMPLE_INGREDIENTS
        assert result.recipes == SAMPLE_RECIPES
        assert "2" in result.message  # 2 malzeme tespit edildi

    def test_raises_when_no_ingredients(self, sample_image_bytes):
        from core.orchestrator import EcoChefOrchestrator

        with patch("core.orchestrator.VisionAgent.detect", return_value=[]):
            with pytest.raises(ValueError, match="malzeme tespit edilemedi"):
                EcoChefOrchestrator.image_pipeline(sample_image_bytes)


class TestTextPipeline:

    def test_returns_suggestions(self):
        from core.orchestrator import EcoChefOrchestrator

        with patch("core.orchestrator.NLPAgent.suggest", return_value=SAMPLE_SUGGESTIONS):
            result = EcoChefOrchestrator.text_pipeline("domates ve yumurta var")

        assert len(result.suggestions) == 3

    def test_propagates_file_not_found(self):
        from core.orchestrator import EcoChefOrchestrator

        with patch("core.orchestrator.NLPAgent.suggest",
                   side_effect=FileNotFoundError("model.gguf bulunamadı")):
            with pytest.raises(FileNotFoundError):
                EcoChefOrchestrator.text_pipeline("herhangi bir istek")


class TestHybridPipeline:

    def test_returns_hybrid_result(self, sample_image_bytes):
        from core.orchestrator import EcoChefOrchestrator

        with patch("core.orchestrator.VisionAgent.detect", return_value=SAMPLE_INGREDIENTS), \
             patch("core.orchestrator.NLPAgent.suggest", return_value=SAMPLE_SUGGESTIONS):
            result = EcoChefOrchestrator.hybrid_pipeline(sample_image_bytes)

        assert result.detected_ingredients == SAMPLE_INGREDIENTS
        assert len(result.nlp_suggestions) == 3
        assert "yerel model" in result.message

    def test_raises_when_no_ingredients(self, sample_image_bytes):
        from core.orchestrator import EcoChefOrchestrator

        with patch("core.orchestrator.VisionAgent.detect", return_value=[]):
            with pytest.raises(ValueError):
                EcoChefOrchestrator.hybrid_pipeline(sample_image_bytes)

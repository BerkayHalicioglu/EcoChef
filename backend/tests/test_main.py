"""
FastAPI endpoint entegrasyon testleri.
Orchestrator mock'lanır — HTTP katmanı test edilir, iş mantığı değil.
"""

import io
from unittest.mock import patch

import pytest

from core.orchestrator import ImagePipelineResult, TextPipelineResult, HybridPipelineResult


FAKE_IMAGE = b"\xff\xd8\xff\xe0" + b"\x00" * 100  # Minimal JPEG header

SAMPLE_IMAGE_RESULT = ImagePipelineResult(
    detected_ingredients=["tomato", "egg"],
    recipes=[{"id": 1, "isim": "Menemen", "gorsel": None,
              "kullanilan_malzemeler": ["tomato"], "eksik_malzemeler": []}],
    message="2 malzeme tespit edildi, 1 tarif bulundu.",
)

SAMPLE_TEXT_RESULT = TextPipelineResult(
    suggestions=[
        {"isim": "Menemen", "neden": "Domates ve yumurta"},
        {"isim": "Omlet", "neden": "Kolay"},
        {"isim": "Çılbır", "neden": "Lezzetli"},
    ]
)

SAMPLE_HYBRID_RESULT = HybridPipelineResult(
    detected_ingredients=["tomato"],
    nlp_suggestions=[
        {"isim": "Domates Çorbası", "neden": "Tek malzeme ile yapılır"},
        {"isim": "Bruschetta", "neden": "Hızlı"},
        {"isim": "Salata", "neden": "Sağlıklı"},
    ],
    message="1 malzeme tespit edildi, yerel model ile öneri üretildi.",
)


class TestHealthEndpoint:

    def test_get_root_returns_200(self, client):
        response = client.get("/")
        assert response.status_code == 200
        assert response.json()["durum"] == "Çalışıyor"


class TestDetectIngredientsEndpoint:

    def test_success_returns_ingredients_and_recipes(self, client):
        with patch("main.orchestrator.image_pipeline", return_value=SAMPLE_IMAGE_RESULT):
            response = client.post(
                "/detect-ingredients/",
                files={"file": ("test.jpg", FAKE_IMAGE, "image/jpeg")},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["tespit_edilen_malzemeler"] == ["tomato", "egg"]
        assert len(data["bulunan_tarifler"]) == 1

    def test_no_ingredients_returns_empty_recipes(self, client):
        with patch("main.orchestrator.image_pipeline",
                   side_effect=ValueError("malzeme tespit edilemedi")):
            response = client.post(
                "/detect-ingredients/",
                files={"file": ("test.jpg", FAKE_IMAGE, "image/jpeg")},
            )

        assert response.status_code == 200
        assert response.json()["bulunan_tarifler"] == []

    def test_api_error_returns_502(self, client):
        with patch("main.orchestrator.image_pipeline",
                   side_effect=ConnectionError("Spoonacular erişilemiyor")):
            response = client.post(
                "/detect-ingredients/",
                files={"file": ("test.jpg", FAKE_IMAGE, "image/jpeg")},
            )

        assert response.status_code == 502


class TestAnalyzeTextEndpoint:

    def test_success_returns_suggestions(self, client):
        with patch("main.orchestrator.text_pipeline", return_value=SAMPLE_TEXT_RESULT):
            response = client.post(
                "/analyze-text-ingredients/",
                json={"text": "domates ve yumurta var"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["basari"] is True
        assert len(data["sonuclar"]) == 3

    def test_short_text_returns_422(self, client):
        """min_length=3 validasyonu — çok kısa girdi reddedilir."""
        response = client.post("/analyze-text-ingredients/", json={"text": "ab"})
        assert response.status_code == 422

    def test_model_missing_returns_500(self, client):
        with patch("main.orchestrator.text_pipeline",
                   side_effect=FileNotFoundError("model.gguf bulunamadı")):
            response = client.post(
                "/analyze-text-ingredients/",
                json={"text": "herhangi bir istek"},
            )

        assert response.status_code == 500


class TestHybridSuggestEndpoint:

    def test_success_returns_hybrid_result(self, client):
        with patch("main.orchestrator.hybrid_pipeline", return_value=SAMPLE_HYBRID_RESULT):
            response = client.post(
                "/hybrid-suggest/",
                files={"file": ("test.jpg", FAKE_IMAGE, "image/jpeg")},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["tespit_edilen_malzemeler"] == ["tomato"]
        assert len(data["nlp_onerileri"]) == 3

    def test_error_returns_500(self, client):
        with patch("main.orchestrator.hybrid_pipeline",
                   side_effect=ValueError("malzeme tespit edilemedi")):
            response = client.post(
                "/hybrid-suggest/",
                files={"file": ("test.jpg", FAKE_IMAGE, "image/jpeg")},
            )

        assert response.status_code == 500

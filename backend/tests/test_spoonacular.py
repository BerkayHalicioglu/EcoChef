from unittest.mock import MagicMock, patch

import pytest


SAMPLE_API_RESPONSE = [
    {
        "id": 1,
        "title": "Tomato Soup",
        "image": "https://img.spoonacular.com/recipes/1-556x370.jpg",
        "usedIngredients": [{"name": "tomato"}],
        "missedIngredients": [{"name": "cream"}],
    }
]


class TestFindRecipesByIngredients:

    def _mock_response(self, status_code: int, json_data):
        mock_resp = MagicMock()
        mock_resp.status_code = status_code
        mock_resp.json.return_value = json_data
        mock_resp.text = str(json_data)
        return mock_resp

    def test_returns_formatted_recipes(self):
        """Başarılı API yanıtı doğru formata dönüştürülür."""
        from connectors.spoonacular import find_recipes_by_ingredients

        with patch("connectors.spoonacular.requests.get") as mock_get:
            mock_get.return_value = self._mock_response(200, SAMPLE_API_RESPONSE)
            result = find_recipes_by_ingredients(["tomato"])

        assert len(result) == 1
        assert result[0]["isim"] == "Tomato Soup"
        assert result[0]["kullanilan_malzemeler"] == ["tomato"]
        assert result[0]["eksik_malzemeler"] == ["cream"]

    def test_raises_on_api_error(self):
        """API 4xx/5xx döndürdüğünde ConnectionError fırlatılır."""
        from connectors.spoonacular import find_recipes_by_ingredients

        with patch("connectors.spoonacular.requests.get") as mock_get:
            mock_get.return_value = self._mock_response(401, {"message": "Invalid API key"})

            with pytest.raises(ConnectionError, match="401"):
                find_recipes_by_ingredients(["tomato"])

    def test_api_called_with_correct_params(self):
        """API isteği doğru parametre ve API anahtarıyla gönderilir."""
        from connectors.spoonacular import find_recipes_by_ingredients

        with patch("connectors.spoonacular.requests.get") as mock_get, \
             patch("connectors.spoonacular.settings") as mock_settings:
            mock_settings.spoonacular_base_url = "https://api.spoonacular.com/recipes/findByIngredients"
            mock_settings.spoonacular_api_key = "test-key"
            mock_get.return_value = self._mock_response(200, [])

            find_recipes_by_ingredients(["apple", "carrot"], count=2)

            _, kwargs = mock_get.call_args
            assert kwargs["params"]["ingredients"] == "apple,carrot"
            assert kwargs["params"]["number"] == 2
            assert kwargs["params"]["apiKey"] == "test-key"

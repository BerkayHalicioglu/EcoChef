import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest


VALID_LLM_RESPONSE = {
    "choices": [
        {
            "message": {
                "content": json.dumps({
                    "oneriler": [
                        {"isim": "Menemen", "neden": "Domates ve yumurta var"},
                        {"isim": "Omlet", "neden": "Hızlı ve kolay"},
                        {"isim": "Domates Çorbası", "neden": "Sağlıklı"},
                    ]
                })
            }
        }
    ]
}


class TestNLPAgentSuggest:

    def setup_method(self):
        from agents.nlp_agent import NLPAgent
        NLPAgent._llm = None

    def _mock_llm(self, response: dict):
        mock = MagicMock()
        mock.create_chat_completion.return_value = response
        return mock

    def test_suggest_returns_three_items(self):
        """Geçerli model çıktısında tam 3 öneri döner."""
        from agents.nlp_agent import NLPAgent

        mock_llm = self._mock_llm(VALID_LLM_RESPONSE)

        with patch("agents.nlp_agent.settings") as mock_settings, \
             patch("agents.nlp_agent.Llama", return_value=mock_llm):
            mock_settings.llm_model_path = MagicMock(spec=Path)
            mock_settings.llm_model_path.exists.return_value = True
            mock_settings.llm_n_ctx = 2048
            mock_settings.llm_verbose = False

            result = NLPAgent.suggest("domates ve yumurta var")

        assert len(result) == 3
        assert result[0]["isim"] == "Menemen"

    def test_suggest_raises_on_invalid_json(self):
        """Model geçersiz JSON döndürdüğünde ValueError fırlatılır."""
        from agents.nlp_agent import NLPAgent

        bad_response = {"choices": [{"message": {"content": "üzgünüm, bilmiyorum"}}]}
        mock_llm = self._mock_llm(bad_response)

        with patch("agents.nlp_agent.settings") as mock_settings, \
             patch("agents.nlp_agent.Llama", return_value=mock_llm):
            mock_settings.llm_model_path = MagicMock(spec=Path)
            mock_settings.llm_model_path.exists.return_value = True
            mock_settings.llm_n_ctx = 2048
            mock_settings.llm_verbose = False

            with pytest.raises(ValueError, match="geçerli JSON döndürmedi"):
                NLPAgent.suggest("bir şeyler öner")

    def test_suggest_raises_when_model_missing(self):
        """Model dosyası yokken FileNotFoundError fırlatılır."""
        from agents.nlp_agent import NLPAgent

        with patch("agents.nlp_agent.settings") as mock_settings:
            mock_settings.llm_model_path = MagicMock(spec=Path)
            mock_settings.llm_model_path.exists.return_value = False

            with pytest.raises(FileNotFoundError):
                NLPAgent.suggest("herhangi bir istek")

    def test_llm_loaded_once(self):
        """Model ikinci çağrıda yeniden yüklenmez."""
        from agents.nlp_agent import NLPAgent

        mock_llm = self._mock_llm(VALID_LLM_RESPONSE)

        with patch("agents.nlp_agent.settings") as mock_settings, \
             patch("agents.nlp_agent.Llama", return_value=mock_llm) as llama_cls:
            mock_settings.llm_model_path = MagicMock(spec=Path)
            mock_settings.llm_model_path.exists.return_value = True
            mock_settings.llm_n_ctx = 2048
            mock_settings.llm_verbose = False

            NLPAgent.suggest("ilk istek")
            NLPAgent.suggest("ikinci istek")
            llama_cls.assert_called_once()

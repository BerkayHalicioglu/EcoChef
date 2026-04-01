import json

from llama_cpp import Llama

from core.config import settings
from core.logger import get_logger

log = get_logger(__name__)


class NLPAgent:
    """
    Llama tabanlı yerel model ile doğal dil yemek önerileri üretir.
    Model ilk çağrıda belleğe yüklenir, sonraki çağrılarda önbellekten kullanılır.
    """

    _llm: Llama | None = None

    @classmethod
    def _get_llm(cls) -> Llama:
        if cls._llm is None:
            if not settings.llm_model_path.exists():
                log.error("LLM model file not found: %s", settings.llm_model_path)
                raise FileNotFoundError(
                    f"LLM model dosyası bulunamadı: {settings.llm_model_path}"
                )
            log.info("Loading LLM from %s (n_ctx=%d)", settings.llm_model_path, settings.llm_n_ctx)
            cls._llm = Llama(
                model_path=str(settings.llm_model_path),
                n_ctx=settings.llm_n_ctx,
                verbose=settings.llm_verbose,
            )
            log.info("LLM loaded successfully")
        return cls._llm

    @staticmethod
    def _build_prompt(user_request: str) -> str:
        return f"""Sen profesyonel bir yemek asistanısın.
Kullanıcının isteğine göre tam 3 farklı Türkçe yemek önerisi yap.
Yanıtını SADECE geçerli bir JSON formatında ver. Ek açıklama veya metin ekleme.

İstenen JSON Yapısı:
{{
  "oneriler": [
    {{ "isim": "Yemek Adı", "neden": "Neden bu yemeği önerdiğinin kısa açıklaması" }},
    {{ "isim": "Yemek Adı", "neden": "Açıklama" }},
    {{ "isim": "Yemek Adı", "neden": "Açıklama" }}
  ]
}}

Kullanıcı İsteği: "{user_request}"
""".strip()

    @classmethod
    def suggest(cls, user_request: str) -> list[dict]:
        """
        Serbest metin isteğini alır, JSON parse edilmiş öneri listesini döner.

        Args:
            user_request: Kullanıcının doğal dil isteği.

        Returns:
            [{"isim": ..., "neden": ...}, ...] formatında öneri listesi.

        Raises:
            ValueError: Model çıktısı geçerli JSON içermiyorsa.
        """
        log.debug("NLPAgent.suggest | request=%r", user_request[:80])
        llm = cls._get_llm()
        prompt = cls._build_prompt(user_request)

        response = llm.create_chat_completion(
            messages=[
                {"role": "system", "content": "Sen sadece JSON çıktı veren profesyonel bir aşçısın."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=400,
        )

        raw = response["choices"][0]["message"]["content"]
        log.debug("NLPAgent.suggest | raw_output_len=%d", len(raw))

        start, end = raw.find("{"), raw.rfind("}")
        if start == -1 or end == -1:
            log.error("NLPAgent.suggest | invalid JSON output: %r", raw[:200])
            raise ValueError(f"Model geçerli JSON döndürmedi. Ham çıktı: {raw!r}")

        data = json.loads(raw[start : end + 1])
        suggestions = data.get("oneriler", [])
        log.debug("NLPAgent.suggest | parsed suggestions=%d", len(suggestions))
        return suggestions

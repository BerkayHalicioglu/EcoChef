import json
import re

from llama_cpp import Llama

from core.config import settings
from core.logger import get_logger

log = get_logger(__name__)

# Few-shot örnekler — modele "böyle cevap ver" gösterir
_FEW_SHOT = """Örnek 1:
Malzemeler: tavuk, soğan, domates, zeytinyağı
JSON: {"oneriler":[{"isim":"Tavuk Sote","neden":"Tavuk ve domates mükemmel uyum sağlar, soğan derinlik katar."},{"isim":"Domates Soslu Tavuk","neden":"Basit malzemelerle lezzetli bir ana yemek elde edersiniz."},{"isim":"Tavuklu Türlü","neden":"Sebzelerle birlikte pişirilen tavuk hem doyurucu hem sağlıklıdır."}]}

Örnek 2:
Malzemeler: mercimek, havuç, soğan, sarımsak
JSON: {"oneriler":[{"isim":"Mercimek Çorbası","neden":"Mercimek ve havuç birlikte pişince kremamsı ve besleyici bir çorba ortaya çıkar."},{"isim":"Mercimek Köftesi","neden":"Pişmiş mercimek ve baharatlarla kolayca hazırlanır, soğan ile lezzetlenir."},{"isim":"Kırmızı Mercimekli Havuç Yemeği","neden":"Sarımsak ve soğanın aroması mercimek ile harika uyum sağlar."}]}

Örnek 3:
Malzemeler: yumurta, un, süt, tereyağı
JSON: {"oneriler":[{"isim":"Krep","neden":"Un, süt ve yumurta krepin temel malzemeleridir, tereyağı lezzet katar."},{"isim":"Omlet","neden":"Yumurta ve tereyağıyla hızlı ve doyurucu bir kahvaltı hazırlanır."},{"isim":"Sütlü Kek","neden":"Dört malzemenin tamamı kullanılarak yumuşak ve pratik bir kek yapılır."}]}"""


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
                n_threads=4,
                verbose=settings.llm_verbose,
            )
            log.info("LLM loaded successfully")
        return cls._llm

    @staticmethod
    def _build_prompt(ingredients: str) -> str:
        return f"""{_FEW_SHOT}

Şimdi sıra sende. Aşağıdaki malzemelere göre TAM 3 farklı Türk mutfağı yemeği öner.

Kurallar:
- Sadece gerçek Türk mutfağı yemekleri öner (örn: "Tavuk Sote", "İmam Bayıldı", "Mercimek Çorbası").
- Her yemek birbirinden farklı olsun (çorba + ana yemek + ara sıcak gibi).
- "neden" alanı 1 cümle, kısa ve somut olsun.
- Tarif adları Türkçe ve gerçekçi olsun.
- SADECE JSON döndür, başka hiçbir şey yazma.

Malzemeler: {ingredients}
JSON:"""

    @staticmethod
    def _parse_json(raw: str) -> list[dict]:
        # JSON bloğunu bul
        start = raw.find("{")
        end = raw.rfind("}")
        if start == -1 or end == -1:
            raise ValueError(f"JSON bulunamadı: {raw[:200]!r}")

        cleaned = raw[start:end + 1]

        # Trailing comma temizle (bazı modeller ekler)
        cleaned = re.sub(r",\s*([}\]])", r"\1", cleaned)

        data = json.loads(cleaned)
        suggestions = data.get("oneriler", [])

        # Her önerinin gerekli alanları var mı kontrol et
        result = []
        for item in suggestions:
            if isinstance(item, dict) and "isim" in item and "neden" in item:
                result.append({"isim": str(item["isim"]).strip(), "neden": str(item["neden"]).strip()})

        return result

    @classmethod
    def suggest(cls, user_request: str, max_retries: int = 2) -> list[dict]:
        """
        Malzeme listesini alır, JSON parse edilmiş öneri listesini döner.
        Hatalı JSON çıktısında max_retries kadar tekrar dener.

        Args:
            user_request: Virgülle ayrılmış malzeme listesi veya serbest metin.
            max_retries: Başarısız JSON parse durumunda tekrar deneme sayısı.

        Returns:
            [{"isim": ..., "neden": ...}, ...] formatında öneri listesi.

        Raises:
            ValueError: Tüm denemeler başarısız olursa.
        """
        log.debug("NLPAgent.suggest | request=%r", user_request[:80])
        llm = cls._get_llm()
        prompt = cls._build_prompt(user_request)

        last_error: Exception | None = None

        for attempt in range(1, max_retries + 2):
            # İlk denemede düşük temperature (tutarlı), sonrakilerde biraz yükselt
            temperature = 0.1 if attempt == 1 else 0.3 + (attempt - 2) * 0.1

            log.debug("NLPAgent.suggest | attempt=%d temperature=%.1f", attempt, temperature)

            response = llm.create_chat_completion(
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Sen bir Türk mutfağı asistanısın. "
                            "Sadece geçerli JSON döndürürsün, başka hiçbir şey yazmazsın. "
                            "Cevabın her zaman { ile başlar ve } ile biter."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=temperature,
                max_tokens=600,
                repeat_penalty=1.15,
                stop=["Örnek", "Malzemeler:", "Kural"],
            )

            raw = response["choices"][0]["message"]["content"].strip()
            log.debug("NLPAgent.suggest | attempt=%d raw_len=%d", attempt, len(raw))

            try:
                suggestions = cls._parse_json(raw)
                if suggestions:
                    log.info("NLPAgent.suggest | success attempt=%d suggestions=%d", attempt, len(suggestions))
                    return suggestions
                raise ValueError("Boş öneri listesi döndü")
            except (ValueError, json.JSONDecodeError, KeyError) as e:
                log.warning("NLPAgent.suggest | attempt=%d parse failed: %s | raw=%r", attempt, e, raw[:200])
                last_error = e

        log.error("NLPAgent.suggest | all attempts failed, last_error=%s", last_error)
        raise ValueError(f"Model geçerli JSON döndüremedi ({max_retries + 1} deneme). Son hata: {last_error}")

"""
EcoChef Orchestrator
--------------------
Agent'ları ve connector'ları koordine eden merkezi yönetici katman.
main.py endpoint'leri doğrudan agent'lara değil, buraya bağlanır.

Pipeline akışları:
  1. image_pipeline  → VisionAgent → SpoonacularConnector
  2. text_pipeline   → NLPAgent
  3. hybrid_pipeline → VisionAgent → NLPAgent (Spoonacular yerine yerel model)
"""

from dataclasses import dataclass

from agents.nlp_agent import NLPAgent
from agents.vision_agent import VisionAgent
from connectors.spoonacular import find_recipes_by_ingredients
from core.logger import get_logger, log_duration

log = get_logger(__name__)


# --------------------------------------------------------------------------- #
# Sonuç veri modelleri (Pydantic değil dataclass — iç katman için yeterli)    #
# --------------------------------------------------------------------------- #

@dataclass
class ImagePipelineResult:
    detected_ingredients: list[str]
    recipes: list[dict]
    message: str


@dataclass
class TextPipelineResult:
    suggestions: list[dict]


@dataclass
class HybridPipelineResult:
    detected_ingredients: list[str]
    nlp_suggestions: list[dict]
    message: str


# --------------------------------------------------------------------------- #
# Orchestrator                                                                 #
# --------------------------------------------------------------------------- #

class EcoChefOrchestrator:
    """
    Tüm pipeline'ları tek bir noktadan yönetir.
    Stateless — her metod bağımsız çağrılabilir.
    """

    # --- Pipeline 1: Görsel → Spoonacular ---------------------------------- #

    @staticmethod
    def image_pipeline(image_bytes: bytes, recipe_count: int = 3) -> ImagePipelineResult:
        """
        Görüntüden malzeme tespit eder, Spoonacular'dan tarif çeker.

        Raises:
            ValueError: Görüntüde malzeme tespit edilemezse.
            ConnectionError: Spoonacular API erişilemezse.
        """
        log.info("image_pipeline started | image_size=%d bytes", len(image_bytes))

        with log_duration(log, "VisionAgent.detect"):
            ingredients = VisionAgent.detect(image_bytes)

        if not ingredients:
            log.warning("image_pipeline | no ingredients detected")
            raise ValueError("Fotoğrafta herhangi bir malzeme tespit edilemedi.")

        log.info("image_pipeline | detected=%s", ingredients)

        with log_duration(log, "Spoonacular.find_recipes"):
            recipes = find_recipes_by_ingredients(ingredients, count=recipe_count)

        log.info("image_pipeline completed | ingredients=%d recipes=%d",
                 len(ingredients), len(recipes))

        return ImagePipelineResult(
            detected_ingredients=ingredients,
            recipes=recipes,
            message=f"{len(ingredients)} malzeme tespit edildi, {len(recipes)} tarif bulundu.",
        )

    # --- Pipeline 2: Metin → NLP ------------------------------------------ #

    @staticmethod
    def text_pipeline(user_request: str) -> TextPipelineResult:
        """
        Serbest metin isteğini NLP agent'ına iletir ve öneri listesi döner.

        Raises:
            FileNotFoundError: LLM model dosyası yoksa.
            ValueError: Model çıktısı JSON parse edilemezse.
        """
        log.info("text_pipeline started | request_len=%d", len(user_request))

        with log_duration(log, "NLPAgent.suggest"):
            suggestions = NLPAgent.suggest(user_request)

        log.info("text_pipeline completed | suggestions=%d", len(suggestions))

        return TextPipelineResult(suggestions=suggestions)

    # --- Pipeline 3: Görsel → NLP (Spoonacular'sız hibrit) ----------------- #

    @staticmethod
    def hybrid_pipeline(image_bytes: bytes) -> HybridPipelineResult:
        """
        Görüntüden malzeme tespit eder, ardından yerel NLP modeliyle
        Türkçe yemek önerileri üretir. İnternet bağlantısı gerekmez.

        Raises:
            ValueError: Görüntüde malzeme tespit edilemezse veya JSON hatalıysa.
            FileNotFoundError: LLM model dosyası yoksa.
        """
        log.info("hybrid_pipeline started | image_size=%d bytes", len(image_bytes))

        with log_duration(log, "VisionAgent.detect"):
            ingredients = VisionAgent.detect(image_bytes)

        if not ingredients:
            log.warning("hybrid_pipeline | no ingredients detected")
            raise ValueError("Fotoğrafta herhangi bir malzeme tespit edilemedi.")

        log.info("hybrid_pipeline | detected=%s", ingredients)

        prompt = f"Elimde şu malzemeler var: {', '.join(ingredients)}. Ne pişirebilirim?"

        with log_duration(log, "NLPAgent.suggest"):
            suggestions = NLPAgent.suggest(prompt)

        log.info("hybrid_pipeline completed | ingredients=%d suggestions=%d",
                 len(ingredients), len(suggestions))

        return HybridPipelineResult(
            detected_ingredients=ingredients,
            nlp_suggestions=suggestions,
            message=f"{len(ingredients)} malzeme tespit edildi, yerel model ile öneri üretildi.",
        )

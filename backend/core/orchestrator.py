"""
EcoChef Orchestrator
--------------------
Agent'ları ve connector'ları koordine eden merkezi yönetici katman.
main.py endpoint'leri doğrudan agent'lara değil, buraya bağlanır.

Pipeline akışları:
  1. image_pipeline  → VisionAgent → Spoonacular
  2. text_pipeline   → parse+translate → Spoonacular + TheMealDB (paralel)
  3. hybrid_pipeline → VisionAgent → NLPAgent (çevrimdışı mod)
"""

from dataclasses import dataclass

from concurrent.futures import ThreadPoolExecutor
from contextvars import copy_context

from agents.nlp_agent import NLPAgent
from agents.vision_agent import VisionAgent
from connectors.spoonacular import find_recipes_by_ingredients
from connectors.themealdb import search_by_ingredient
from core.ingredient_translator import parse_and_translate_tr_ingredients, translate_list
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
    def image_pipeline(
        image_bytes: bytes,
        recipe_count: int = 3,
        diet: str | None = None,
        max_calories: int | None = None,
        min_protein: int | None = None,
        max_carbs: int | None = None,
        max_fat: int | None = None,
    ) -> ImagePipelineResult:
        """
        Görüntüden malzeme tespit eder, önce Spoonacular sonra TheMealDB'den tarif çeker.

        Raises:
            ValueError: Görüntüde malzeme tespit edilemezse.
            ConnectionError: Her iki API de erişilemezse.
        """
        log.info("image_pipeline started | image_size=%d bytes", len(image_bytes))

        try:
            with log_duration(log, "VisionAgent.detect"):
                ingredients = VisionAgent.detect(image_bytes)
        except Exception as e:
            log.error("image_pipeline | VisionAgent failed: %s", e)
            raise ValueError(f"Görüntü işlenirken hata oluştu: {e}") from e

        if not ingredients:
            log.warning("image_pipeline | no ingredients detected")
            raise ValueError("Fotoğrafta herhangi bir malzeme tespit edilemedi.")

        log.info("image_pipeline | detected=%s", ingredients)

        recipes: list[dict] = []
        spoon_error: Exception | None = None

        # 1. Spoonacular dene
        try:
            with log_duration(log, "Spoonacular.find_recipes"):
                recipes = find_recipes_by_ingredients(
                    ingredients, count=recipe_count, diet=diet,
                    max_calories=max_calories, min_protein=min_protein,
                    max_carbs=max_carbs, max_fat=max_fat,
                )
            for r in recipes:
                r.setdefault("kaynak", "spoonacular")
            log.info("image_pipeline | Spoonacular recipes=%d", len(recipes))
        except ConnectionError as e:
            spoon_error = e
            log.warning("image_pipeline | Spoonacular failed: %s — trying TheMealDB", e)

        # 2. Spoonacular başarısız veya boş → TheMealDB ile dene
        has_filter = bool(diet or max_calories or min_protein or max_carbs or max_fat)

        # Filtre yoksa → her zaman TheMealDB'ye düş (boş veya hata)
        # Filtre varken Spoonacular HATA verdiyse (kota/bağlantı) → TheMealDB fallback
        # Filtre varken Spoonacular boş döndüyse → TheMealDB atla (filtresiz sonuç istemiyoruz)
        use_mealdb = (not recipes) and (not has_filter or spoon_error is not None)

        if use_mealdb:
            if has_filter and spoon_error:
                log.warning("image_pipeline | Spoonacular error with active filter — falling back to TheMealDB (unfiltered)")
            try:
                with log_duration(log, "TheMealDB.search_by_ingredient"):
                    recipes = search_by_ingredient(ingredients[0], recipe_count)
                log.info("image_pipeline | TheMealDB recipes=%d", len(recipes))
            except Exception as meal_e:
                log.error("image_pipeline | TheMealDB also failed: %s", meal_e)
                if spoon_error:
                    raise ConnectionError(
                        f"Tarif API'lerine ulaşılamadı — "
                        f"Spoonacular: {spoon_error}, TheMealDB: {meal_e}"
                    )
        elif not recipes and has_filter:
            log.info("image_pipeline | TheMealDB skipped (Spoonacular OK with active filter, no results)")

        log.info("image_pipeline completed | ingredients=%d recipes=%d",
                 len(ingredients), len(recipes))

        return ImagePipelineResult(
            detected_ingredients=translate_list(ingredients),
            recipes=recipes,
            message=f"{len(ingredients)} malzeme tespit edildi, {len(recipes)} tarif bulundu.",
        )

    # --- Pipeline 2: Metin → Spoonacular (NLP fallback) ------------------- #

    @staticmethod
    def text_pipeline(
        user_request: str,
        recipe_count: int = 3,
        diet: str | None = None,
        max_calories: int | None = None,
        min_protein: int | None = None,
        max_carbs: int | None = None,
        max_fat: int | None = None,
    ) -> TextPipelineResult:
        """
        Türkçe malzeme metnini ayrıştırır, İngilizceye çevirir ve
        Spoonacular + TheMealDB'den paralel olarak gerçek ID'li tarifler çeker.

        Raises:
            ConnectionError: Her iki API de erişilemezse.
        """
        log.info("text_pipeline started | request_len=%d", len(user_request))

        # 1. Türkçe metni → İngilizce malzeme listesi
        with log_duration(log, "ingredient_parsing"):
            en_ingredients = parse_and_translate_tr_ingredients(user_request)

        log.info("text_pipeline | parsed_ingredients=%s", en_ingredients)

        if not en_ingredients:
            log.warning("text_pipeline | no ingredients parsed from input")
            return TextPipelineResult(suggestions=[])

        # 2. Spoonacular + TheMealDB paralel sorgu
        spoon_recipes: list[dict] = []
        meal_recipes: list[dict] = []
        api_errors: list[str] = []

        # Her thread kendi context kopyasını alır (ContextVar aynı anda girilemez)
        ctx_spoon = copy_context()
        ctx_meal = copy_context()

        has_filter = bool(diet or max_calories or min_protein or max_carbs or max_fat)
        spoon_failed = False

        def _spoon() -> list[dict]:
            return ctx_spoon.run(
                find_recipes_by_ingredients,
                en_ingredients, recipe_count, diet,
                max_calories, min_protein, max_carbs, max_fat,
            )

        def _meal() -> list[dict]:
            return ctx_meal.run(search_by_ingredient, en_ingredients[0], recipe_count)

        with log_duration(log, "parallel_api_fetch"):
            with ThreadPoolExecutor(max_workers=2) as executor:
                spoon_fut = executor.submit(_spoon)
                # Filtre yoksa TheMealDB'yi paralel başlat; varsa henüz başlatma
                meal_fut = executor.submit(_meal) if not has_filter else None

                try:
                    spoon_recipes = spoon_fut.result()
                    log.info("text_pipeline | Spoonacular recipes=%d", len(spoon_recipes))
                except Exception as e:
                    api_errors.append(f"Spoonacular: {e}")
                    log.warning("text_pipeline | Spoonacular failed: %s", e)
                    spoon_failed = True

                # Filtre varken Spoonacular çöktüyse (kota/bağlantı) → TheMealDB'ye düş
                if has_filter and spoon_failed and meal_fut is None:
                    log.warning("text_pipeline | Spoonacular error with active filter — falling back to TheMealDB (unfiltered)")
                    meal_fut = executor.submit(_meal)

                if meal_fut is not None:
                    try:
                        meal_recipes = meal_fut.result()
                        log.info("text_pipeline | TheMealDB recipes=%d", len(meal_recipes))
                    except Exception as e:
                        api_errors.append(f"TheMealDB: {e}")
                        log.warning("text_pipeline | TheMealDB failed: %s", e)
                elif has_filter:
                    log.info("text_pipeline | TheMealDB skipped (Spoonacular OK with active filter)")

        if api_errors and not spoon_recipes and not meal_recipes:
            raise ConnectionError(f"Tarif API'lerine ulaşılamadı: {'; '.join(api_errors)}")

        def _to_suggestion(r: dict, kaynak: str = "spoonacular") -> dict:
            return {
                "id": r.get("id"),
                "isim": r.get("isim", ""),
                "gorsel": str(r["gorsel"]) if r.get("gorsel") else None,
                "neden": "",
                "kullanilan_malzemeler": r.get("kullanilan_malzemeler", []),
                "eksik_malzemeler": r.get("eksik_malzemeler", []),
                "beslenme": r.get("beslenme"),
                "kaynak": r.get("kaynak", kaynak),
            }

        combined = (
            [_to_suggestion(r, "spoonacular") for r in spoon_recipes]
            + [_to_suggestion(r, "themealdb") for r in meal_recipes]
        )

        log.info("text_pipeline completed | total=%d", len(combined))
        return TextPipelineResult(suggestions=combined)

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

        try:
            with log_duration(log, "VisionAgent.detect"):
                ingredients = VisionAgent.detect(image_bytes)
        except Exception as e:
            log.error("hybrid_pipeline | VisionAgent failed: %s", e)
            raise ValueError(f"Görüntü işlenirken hata oluştu: {e}") from e

        if not ingredients:
            log.warning("hybrid_pipeline | no ingredients detected")
            raise ValueError("Fotoğrafta herhangi bir malzeme tespit edilemedi.")

        log.info("hybrid_pipeline | detected=%s", ingredients)

        turkish_ingredients = translate_list(ingredients)
        log.info("hybrid_pipeline | translated=%s", turkish_ingredients)
        prompt = ", ".join(turkish_ingredients)

        with log_duration(log, "NLPAgent.suggest"):
            suggestions = NLPAgent.suggest(prompt)

        log.info("hybrid_pipeline completed | ingredients=%d suggestions=%d",
                 len(ingredients), len(suggestions))

        return HybridPipelineResult(
            detected_ingredients=ingredients,
            nlp_suggestions=suggestions,
            message=f"{len(ingredients)} malzeme tespit edildi, yerel model ile öneri üretildi.",
        )

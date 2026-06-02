import random
import re

import requests

from core.config import settings
from core.translator import cevir, cevir_liste

FILTER_URL = "https://www.themealdb.com/api/json/v1/1/filter.php"
LOOKUP_URL = "https://www.themealdb.com/api/json/v1/1/lookup.php"
RANDOM_URL = "https://www.themealdb.com/api/json/v1/1/random.php"

# Spoonacular mutfak adı → TheMealDB alan adı eşlemesi
CUISINE_TO_AREA: dict[str, str] = {
    "italian":       "Italian",
    "mexican":       "Mexican",
    "french":        "French",
    "japanese":      "Japanese",
    "indian":        "Indian",
    "chinese":       "Chinese",
    "american":      "American",
    "mediterranean": "Greek",
    "asian":         "Thai",
}


def get_random_meals(count: int = 3) -> list[dict]:
    """
    TheMealDB'den rastgele tarifler çeker.
    Free API tek seferde 1 tarif döner; count kadar istek atılır.
    """
    tr = settings.translate_recipes
    seen: set[int] = set()
    results: list[dict] = []

    for _ in range(count * 2):  # quota için en fazla 2x deneme
        if len(results) >= count:
            break
        try:
            resp = requests.get(RANDOM_URL, timeout=5)
            if resp.status_code != 200:
                continue
            meals = resp.json().get("meals") or []
            if not meals:
                continue
            m = meals[0]
            meal_id = int(m["idMeal"])
            if meal_id in seen:
                continue
            seen.add(meal_id)
            results.append({
                "id": meal_id,
                "isim": cevir(m["strMeal"]) if tr else m["strMeal"],
                "gorsel": m.get("strMealThumb"),
                "sure_dakika": None,
                "beslenme": None,
                "kaynak": "themealdb",
            })
        except Exception:
            continue

    if not results:
        raise ConnectionError("TheMealDB rastgele tarif getirilemedi.")
    return results


def search_by_area(cuisine: str, count: int = 6) -> list[dict]:
    """
    TheMealDB'de mutfak türüne (area) göre tarif arar.
    `cuisine` Spoonacular formatında verilir; CUISINE_TO_AREA ile çevrilir.
    """
    area = CUISINE_TO_AREA.get(cuisine.lower(), cuisine.capitalize())
    response = requests.get(FILTER_URL, params={"a": area}, timeout=10)
    if response.status_code != 200:
        raise ConnectionError(f"TheMealDB API hatası [{response.status_code}]")

    meals = response.json().get("meals") or []
    if not meals:
        return []

    selected = random.sample(meals, min(count, len(meals)))
    tr = settings.translate_recipes

    return [
        {
            "id": int(m["idMeal"]),
            "isim": cevir(m["strMeal"]) if tr else m["strMeal"],
            "gorsel": m.get("strMealThumb"),
            "sure_dakika": None,
            "beslenme": None,
            "kaynak": "themealdb",
        }
        for m in selected
    ]


def search_by_ingredient(ingredient: str, count: int = 3) -> list[dict]:
    """
    TheMealDB'de tek bir malzemeye göre tarif arar.
    TheMealDB free API yalnızca tek malzeme destekler; en anlamlı ilk malzeme kullanılır.
    """
    response = requests.get(FILTER_URL, params={"i": ingredient}, timeout=10)
    if response.status_code != 200:
        raise ConnectionError(f"TheMealDB API hatası [{response.status_code}]")

    meals = response.json().get("meals") or []
    if not meals:
        return []

    selected = random.sample(meals, min(count, len(meals)))
    tr = settings.translate_recipes

    return [
        {
            "id": int(m["idMeal"]),
            "isim": cevir(m["strMeal"]) if tr else m["strMeal"],
            "gorsel": m.get("strMealThumb"),
            "neden": "",
            "kullanilan_malzemeler": [],
            "eksik_malzemeler": [],
            "beslenme": None,
            "kaynak": "themealdb",
        }
        for m in selected
    ]


def search_turkish(count: int = 6) -> list[dict]:
    """TheMealDB'den Türk mutfağı tarifleri çeker."""
    response = requests.get(FILTER_URL, params={"a": "Turkish"}, timeout=10)
    if response.status_code != 200:
        raise ConnectionError(f"TheMealDB API hatası [{response.status_code}]")

    meals = response.json().get("meals") or []
    selected = random.sample(meals, min(count, len(meals)))
    tr = settings.translate_recipes

    return [
        {
            "id": int(m["idMeal"]),
            "isim": cevir(m["strMeal"]) if tr else m["strMeal"],
            "gorsel": m.get("strMealThumb"),
            "sure_dakika": None,
            "beslenme": None,
            "kaynak": "themealdb",
        }
        for m in selected
    ]


def get_meal_detail(meal_id: int) -> dict:
    """TheMealDB'den tarif detayını çeker."""
    response = requests.get(LOOKUP_URL, params={"i": meal_id}, timeout=10)
    if response.status_code != 200:
        raise ConnectionError(f"TheMealDB API hatası [{response.status_code}]")

    meals = response.json().get("meals")
    if not meals:
        raise ValueError(f"Tarif bulunamadı: {meal_id}")

    m = meals[0]
    tr = settings.translate_recipes

    # Malzeme + miktar birleştir
    ingredients_raw = []
    for i in range(1, 21):
        ingredient = (m.get(f"strIngredient{i}") or "").strip()
        measure = (m.get(f"strMeasure{i}") or "").strip()
        if ingredient:
            ingredients_raw.append(f"{measure} {ingredient}".strip() if measure else ingredient)

    malzemeler = cevir_liste(ingredients_raw) if tr else ingredients_raw

    # Talimatları adım adım ayrıştır
    instructions_raw = m.get("strInstructions") or ""
    adimlar = _parse_instructions(instructions_raw, tr)

    return {
        "id": int(m["idMeal"]),
        "isim": cevir(m.get("strMeal", "")) if tr else m.get("strMeal", ""),
        "gorsel": m.get("strMealThumb"),
        "sure_dakika": None,
        "porsiyon": None,
        "malzemeler": malzemeler,
        "adimlar": adimlar,
        "beslenme": None,
    }


def _parse_instructions(text: str, translate: bool) -> list[dict]:
    """TheMealDB talimat stringini adım listesine dönüştürür."""
    if not text:
        return []

    # "1. step" veya "STEP 1\n" formatını dene
    numbered = re.split(r"\r?\n(?=\d+[\.\)])", text.strip())
    if len(numbered) > 1:
        steps = []
        for i, step in enumerate(numbered, 1):
            clean = re.sub(r"^\d+[\.\)]\s*", "", step.strip())
            if clean:
                aciklama = cevir(clean) if translate else clean
                steps.append({"numara": i, "aciklama": aciklama})
        return steps

    # Çift satır arası boşlukla paragraf bölümü
    paragraphs = [p.strip() for p in re.split(r"\r?\n\r?\n+", text.strip()) if p.strip()]
    if len(paragraphs) > 1:
        return [
            {"numara": i, "aciklama": cevir(p) if translate else p}
            for i, p in enumerate(paragraphs, 1)
        ]

    # Tek satır bölümü (\r\n)
    lines = [ln.strip() for ln in text.split("\r\n") if len(ln.strip()) > 10]
    if len(lines) > 1:
        return [
            {"numara": i, "aciklama": cevir(ln) if translate else ln}
            for i, ln in enumerate(lines, 1)
        ]

    # Son çare: tek adım olarak
    aciklama = cevir(text.strip()) if translate else text.strip()
    return [{"numara": 1, "aciklama": aciklama}]

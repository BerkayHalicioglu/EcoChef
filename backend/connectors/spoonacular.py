import requests

from core.config import settings
from core.translator import cevir, cevir_liste

RECIPE_INFO_URL = "https://api.spoonacular.com/recipes/{id}/information"
RECIPE_STEPS_URL = "https://api.spoonacular.com/recipes/{id}/analyzedInstructions"
COMPLEX_SEARCH_URL = "https://api.spoonacular.com/recipes/complexSearch"
RANDOM_URL = "https://api.spoonacular.com/recipes/random"


def find_recipes_by_ingredients(
    ingredients: list[str],
    count: int = 3,
    diet: str | None = None,
    max_calories: int | None = None,
    min_protein: int | None = None,
    max_carbs: int | None = None,
    max_fat: int | None = None,
) -> list[dict]:
    """
    Malzeme listesine göre Spoonacular'dan tarif çeker.
    Diyet veya besin değeri filtresi varsa complexSearch kullanılır.

    Raises:
        ConnectionError: API isteği başarısız olursa.
    """
    tr = settings.translate_recipes
    use_complex = bool(diet or max_calories or min_protein or max_carbs or max_fat)

    if use_complex:
        params: dict = {
            "includeIngredients": ",".join(ingredients),
            "number": count,
            "fillIngredients": True,
            "addRecipeNutrition": True,
            "apiKey": settings.spoonacular_api_key,
        }
        if diet:
            params["diet"] = diet
        if max_calories is not None:
            params["maxCalories"] = max_calories
        if min_protein is not None:
            params["minProtein"] = min_protein
        if max_carbs is not None:
            params["maxCarbs"] = max_carbs
        if max_fat is not None:
            params["maxFat"] = max_fat

        response = requests.get(COMPLEX_SEARCH_URL, params=params, timeout=10)
        if response.status_code != 200:
            raise ConnectionError(f"Spoonacular API hatası [{response.status_code}]: {response.text}")

        results = response.json().get("results", [])
        return [_format_complex(r, tr) for r in results]

    # Filtre yoksa standart findByIngredients (daha hızlı)
    params = {
        "ingredients": ",".join(ingredients),
        "number": count,
        "apiKey": settings.spoonacular_api_key,
    }
    response = requests.get(settings.spoonacular_base_url, params=params, timeout=10)
    if response.status_code != 200:
        raise ConnectionError(f"Spoonacular API hatası [{response.status_code}]: {response.text}")

    return [_format_simple(r, tr) for r in response.json()]


def _nutrient_val(nutrients: list[dict], name: str) -> float | None:
    hit = next((n for n in nutrients if n.get("name", "").lower() == name.lower()), None)
    return round(hit["amount"], 1) if hit else None


def _format_simple(r: dict, tr: bool) -> dict:
    return {
        "id": r.get("id"),
        "isim": cevir(r.get("title", "")) if tr else r.get("title"),
        "gorsel": r.get("image"),
        "kullanilan_malzemeler": cevir_liste([i["name"] for i in r.get("usedIngredients", [])]) if tr
                                 else [i["name"] for i in r.get("usedIngredients", [])],
        "eksik_malzemeler": cevir_liste([i["name"] for i in r.get("missedIngredients", [])]) if tr
                            else [i["name"] for i in r.get("missedIngredients", [])],
        "beslenme": None,
        "kaynak": "spoonacular",
    }


def _format_complex(r: dict, tr: bool) -> dict:
    nutrients = r.get("nutrition", {}).get("nutrients", [])
    beslenme = {
        "kalori": _nutrient_val(nutrients, "Calories"),
        "protein_g": _nutrient_val(nutrients, "Protein"),
        "karbonhidrat_g": _nutrient_val(nutrients, "Carbohydrates"),
        "yag_g": _nutrient_val(nutrients, "Fat"),
    } if nutrients else None

    return {
        "id": r.get("id"),
        "isim": cevir(r.get("title", "")) if tr else r.get("title"),
        "gorsel": r.get("image"),
        "kullanilan_malzemeler": cevir_liste([i["name"] for i in r.get("usedIngredients", [])]) if tr
                                 else [i["name"] for i in r.get("usedIngredients", [])],
        "eksik_malzemeler": cevir_liste([i["name"] for i in r.get("missedIngredients", [])]) if tr
                            else [i["name"] for i in r.get("missedIngredients", [])],
        "beslenme": beslenme,
        "kaynak": "spoonacular",
    }


def get_random_recipes(count: int = 3, tags: str | None = None) -> list[dict]:
    """
    Spoonacular'dan rastgele tarif çeker.

    Raises:
        ConnectionError: API isteği başarısız olursa.
    """
    params: dict = {"number": count, "apiKey": settings.spoonacular_api_key}
    if tags:
        params["tags"] = tags

    response = requests.get(RANDOM_URL, params=params, timeout=10)
    if response.status_code != 200:
        raise ConnectionError(f"Spoonacular API hatası [{response.status_code}]: {response.text}")

    tr = settings.translate_recipes
    return [_format_discover(r, tr) for r in response.json().get("recipes", [])]


def search_by_cuisine(cuisine: str, count: int = 6) -> list[dict]:
    """
    Mutfak türüne göre Spoonacular'dan tarif çeker.

    Raises:
        ConnectionError: API isteği başarısız olursa.
    """
    params = {
        "cuisine": cuisine,
        "number": count,
        "addRecipeInformation": True,
        "addRecipeNutrition": True,
        "apiKey": settings.spoonacular_api_key,
    }
    response = requests.get(COMPLEX_SEARCH_URL, params=params, timeout=10)
    if response.status_code != 200:
        raise ConnectionError(f"Spoonacular API hatası [{response.status_code}]: {response.text}")

    tr = settings.translate_recipes
    results = response.json().get("results", [])
    return [_format_discover_from_complex(r, tr) for r in results]


def _format_discover(r: dict, tr: bool) -> dict:
    nutrients = r.get("nutrition", {}).get("nutrients", [])
    beslenme = None
    if nutrients:
        def nv(name: str) -> float | None:
            hit = next((n for n in nutrients if n.get("name", "").lower() == name.lower()), None)
            return round(hit["amount"], 1) if hit else None
        beslenme = {"kalori": nv("Calories"), "protein_g": nv("Protein"), "karbonhidrat_g": nv("Carbohydrates"), "yag_g": nv("Fat")}

    return {
        "id": r.get("id"),
        "isim": cevir(r.get("title", "")) if tr else r.get("title"),
        "gorsel": r.get("image"),
        "sure_dakika": r.get("readyInMinutes"),
        "beslenme": beslenme,
    }


def _format_discover_from_complex(r: dict, tr: bool) -> dict:
    nutrients = r.get("nutrition", {}).get("nutrients", [])
    beslenme = None
    if nutrients:
        beslenme = {
            "kalori": _nutrient_val(nutrients, "Calories"),
            "protein_g": _nutrient_val(nutrients, "Protein"),
            "karbonhidrat_g": _nutrient_val(nutrients, "Carbohydrates"),
            "yag_g": _nutrient_val(nutrients, "Fat"),
        }
    return {
        "id": r.get("id"),
        "isim": cevir(r.get("title", "")) if tr else r.get("title"),
        "gorsel": r.get("image"),
        "sure_dakika": r.get("readyInMinutes"),
        "beslenme": beslenme,
    }


def get_recipe_detail(recipe_id: int) -> dict:
    """
    Tarif ID'sine göre detay ve adım adım yapılışı çeker.

    Returns:
        {id, isim, gorsel, sure_dakika, porsiyon, malzemeler, adimlar}

    Raises:
        ConnectionError: API isteği başarısız olursa.
        ValueError: Tarif bulunamazsa.
    """
    params = {"apiKey": settings.spoonacular_api_key, "includeNutrition": True}

    info_resp = requests.get(RECIPE_INFO_URL.format(id=recipe_id), params=params, timeout=10)
    if info_resp.status_code == 404:
        raise ValueError(f"Tarif bulunamadı: {recipe_id}")
    if info_resp.status_code != 200:
        raise ConnectionError(f"Spoonacular API hatası [{info_resp.status_code}]")

    info = info_resp.json()

    steps_resp = requests.get(RECIPE_STEPS_URL.format(id=recipe_id), params=params, timeout=10)
    raw_steps = steps_resp.json() if steps_resp.status_code == 200 else []

    tr = settings.translate_recipes

    adimlar = []
    for section in raw_steps:
        for step in section.get("steps", []):
            aciklama = step.get("step", "")
            adimlar.append({
                "numara": step.get("number"),
                "aciklama": cevir(aciklama) if tr else aciklama,
            })

    ham_malzemeler = [i.get("original", "") for i in info.get("extendedIngredients", [])]

    # Beslenme bilgisi
    beslenme = None
    nutrients = info.get("nutrition", {}).get("nutrients", [])
    if nutrients:
        def nutrient(ad: str) -> float | None:
            hit = next((n for n in nutrients if n["name"].lower() == ad.lower()), None)
            return round(hit["amount"], 1) if hit else None

        beslenme = {
            "kalori": nutrient("Calories"),
            "protein_g": nutrient("Protein"),
            "karbonhidrat_g": nutrient("Carbohydrates"),
            "yag_g": nutrient("Fat"),
        }

    return {
        "id": info.get("id"),
        "isim": cevir(info.get("title", "")) if tr else info.get("title"),
        "gorsel": info.get("image"),
        "sure_dakika": info.get("readyInMinutes"),
        "porsiyon": info.get("servings"),
        "malzemeler": cevir_liste(ham_malzemeler) if tr else ham_malzemeler,
        "adimlar": adimlar,
        "beslenme": beslenme,
    }

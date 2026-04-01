import requests

from core.config import settings

RECIPE_INFO_URL = "https://api.spoonacular.com/recipes/{id}/information"
RECIPE_STEPS_URL = "https://api.spoonacular.com/recipes/{id}/analyzedInstructions"


def find_recipes_by_ingredients(ingredients: list[str], count: int = 3) -> list[dict]:
    """
    Malzeme listesine göre Spoonacular'dan tarif çeker.

    Args:
        ingredients: Tespit edilen malzeme isimleri.
        count: Döndürülecek tarif sayısı.

    Returns:
        Formatlanmış tarif listesi.

    Raises:
        ConnectionError: API isteği başarısız olursa.
    """
    params = {
        "ingredients": ",".join(ingredients),
        "number": count,
        "apiKey": settings.spoonacular_api_key,
    }

    response = requests.get(settings.spoonacular_base_url, params=params, timeout=10)

    if response.status_code != 200:
        raise ConnectionError(
            f"Spoonacular API hatası [{response.status_code}]: {response.text}"
        )

    return [
        {
            "id": r.get("id"),
            "isim": r.get("title"),
            "gorsel": r.get("image"),
            "kullanilan_malzemeler": [i["name"] for i in r.get("usedIngredients", [])],
            "eksik_malzemeler": [i["name"] for i in r.get("missedIngredients", [])],
        }
        for r in response.json()
    ]


def get_recipe_detail(recipe_id: int) -> dict:
    """
    Tarif ID'sine göre detay ve adım adım yapılışı çeker.

    Returns:
        {id, isim, gorsel, sure_dakika, porsiyon, malzemeler, adimlar}

    Raises:
        ConnectionError: API isteği başarısız olursa.
        ValueError: Tarif bulunamazsa.
    """
    params = {"apiKey": settings.spoonacular_api_key, "includeNutrition": False}

    info_resp = requests.get(RECIPE_INFO_URL.format(id=recipe_id), params=params, timeout=10)
    if info_resp.status_code == 404:
        raise ValueError(f"Tarif bulunamadı: {recipe_id}")
    if info_resp.status_code != 200:
        raise ConnectionError(f"Spoonacular API hatası [{info_resp.status_code}]")

    info = info_resp.json()

    steps_resp = requests.get(RECIPE_STEPS_URL.format(id=recipe_id), params=params, timeout=10)
    raw_steps = steps_resp.json() if steps_resp.status_code == 200 else []

    adimlar = []
    for section in raw_steps:
        for step in section.get("steps", []):
            adimlar.append({
                "numara": step.get("number"),
                "aciklama": step.get("step"),
            })

    return {
        "id": info.get("id"),
        "isim": info.get("title"),
        "gorsel": info.get("image"),
        "sure_dakika": info.get("readyInMinutes"),
        "porsiyon": info.get("servings"),
        "malzemeler": [i.get("original") for i in info.get("extendedIngredients", [])],
        "adimlar": adimlar,
    }

"""
YOLO sınıf isimlerini (İngilizce) Türkçe mutfak terimlerine çevirir.
NLP pipeline'da Türkçe Llama modeline daha tutarlı input sağlamak için kullanılır.
"""

# COCO + yaygın food model sınıf isimleri → Türkçe
_EN_TO_TR: dict[str, str] = {
    # COCO temel yiyecekler
    "apple": "elma",
    "banana": "muz",
    "orange": "portakal",
    "broccoli": "brokoli",
    "carrot": "havuç",
    "hot dog": "sosisli",
    "pizza": "pizza",
    "donut": "donut",
    "cake": "pasta",
    "sandwich": "sandviç",
    # Sebzeler
    "tomato": "domates",
    "potato": "patates",
    "onion": "soğan",
    "garlic": "sarımsak",
    "pepper": "biber",
    "bell pepper": "kapya biber",
    "cucumber": "salatalık",
    "lettuce": "marul",
    "spinach": "ıspanak",
    "eggplant": "patlıcan",
    "zucchini": "kabak",
    "corn": "mısır",
    "mushroom": "mantar",
    "cabbage": "lahana",
    "celery": "kereviz",
    "pumpkin": "balkabağı",
    "leek": "pırasa",
    "artichoke": "enginar",
    # Meyveler
    "strawberry": "çilek",
    "lemon": "limon",
    "grape": "üzüm",
    "watermelon": "karpuz",
    "melon": "kavun",
    "pear": "armut",
    "peach": "şeftali",
    "cherry": "kiraz",
    "pineapple": "ananas",
    "mango": "mango",
    "kiwi": "kivi",
    "fig": "incir",
    "pomegranate": "nar",
    # Proteinler
    "egg": "yumurta",
    "eggs": "yumurta",
    "chicken": "tavuk",
    "beef": "et",
    "meat": "et",
    "fish": "balık",
    "salmon": "somon",
    "tuna": "ton balığı",
    "shrimp": "karides",
    "lamb": "kuzu eti",
    "pork": "domuz eti",
    "turkey": "hindi",
    "sausage": "sosis",
    # Süt ürünleri
    "milk": "süt",
    "cheese": "peynir",
    "butter": "tereyağı",
    "yogurt": "yoğurt",
    "cream": "krema",
    # Tahıllar / Kuru baklagiller
    "bread": "ekmek",
    "flour": "un",
    "rice": "pirinç",
    "pasta": "makarna",
    "noodle": "noodle",
    "lentil": "mercimek",
    "bean": "fasulye",
    "chickpea": "nohut",
    # Sıvılar / Yağlar
    "oil": "yağ",
    "olive oil": "zeytinyağı",
    "water": "su",
    "vinegar": "sirke",
    # Baharatlar / Diğer
    "salt": "tuz",
    "sugar": "şeker",
    "pepper spice": "karabiber",
    "tomato paste": "domates salçası",
    "sauce": "sos",
    "ketchup": "ketçap",
    "mayonnaise": "mayonez",
}

# Yiyecek/içecek olarak kabul edilen sınıf isimleri.
# _EN_TO_TR'deki tüm anahtarlar + ek COCO/genel model sınıfları dahildir.
COCO_FOOD_CLASSES: frozenset[str] = frozenset(_EN_TO_TR.keys()) | frozenset({
    "bowl", "hot dog", "wine glass", "cup", "fork", "knife", "spoon",
    "dining table", "bottle",
    # Renk düzeltmesi sonrası gelen isimler (COCO'da yoktu)
    "lemon", "tomato",
})


_TR_TO_EN: dict[str, str] = {v: k for k, v in _EN_TO_TR.items()}

# Türkçe dolgu kelimeleri — malzeme ayrıştırırken temizlenir
_TR_FILLERS = frozenset({
    "var", "evde", "elimde", "biraz", "bir", "miktar", "birkaç", "az", "çok",
    "taze", "kuru", "doğranmış", "dilimlenmiş", "pişmiş", "haşlanmış",
    "adet", "kg", "gr", "gram", "litre", "bardak", "kaşık", "çay", "yemek",
    "ne", "yapabilirim", "pişirebilirim", "önerir", "misin", "tarif",
})


def translate(english_name: str) -> str:
    """İngilizce malzeme adını Türkçeye çevirir; bilinmiyorsa orijinalini döner."""
    return _EN_TO_TR.get(english_name.lower(), english_name)


def translate_list(ingredients: list[str]) -> list[str]:
    """Malzeme listesini toplu olarak Türkçeye çevirir."""
    return [translate(i) for i in ingredients]


def is_food_class(class_name: str) -> bool:
    """Verilen COCO sınıf adının yiyecekle ilgili olup olmadığını döner."""
    return class_name.lower() in COCO_FOOD_CLASSES


def parse_and_translate_tr_ingredients(text: str) -> list[str]:
    """
    Türkçe serbest metin veya virgülle ayrılmış malzeme listesini
    Spoonacular için İngilizce malzeme listesine dönüştürür.

    Strateji:
      1. Virgül/noktalı virgül/ve bağlaçlarıyla böl
      2. Dolgu kelimeleri temizle
      3. Önce tam string, sonra kelime kelime sözlükten bak
      4. Sözlükte bulunmayan kısa token'ları Google Translate ile çevir
    """
    import re

    raw_tokens = re.split(r"[,،;]|\bve\b|\band\b", text, flags=re.IGNORECASE)

    resolved: list[str] = []
    unresolved: list[str] = []

    for token in raw_tokens:
        clean = re.sub(r"\b\d+\b", " ", token)
        clean = " ".join(w for w in clean.split() if w.lower() not in _TR_FILLERS).strip()
        if not clean or len(clean) < 2:
            continue

        # 1. Tam string eşleşmesi
        en = _TR_TO_EN.get(clean.lower())
        if en:
            resolved.append(en)
            continue

        # 2. Token içinde kelime kelime bak
        found = False
        for word in clean.split():
            en_word = _TR_TO_EN.get(word.lower())
            if en_word:
                resolved.append(en_word)
                found = True
        if found:
            continue

        # 3. Kısa (≤3 kelime) bilinmeyen token'ları çeviri kuyruğuna al
        if len(clean.split()) <= 3:
            unresolved.append(clean)

    if unresolved:
        try:
            from deep_translator import GoogleTranslator
            joined = ", ".join(unresolved)
            translated = GoogleTranslator(source="tr", target="en").translate(joined)
            if translated:
                resolved.extend(t.strip() for t in translated.split(",") if t.strip())
        except Exception:
            pass  # Çeviri başarısız → o token'ı atla, gereksiz kelime ekleme

    return [r for r in resolved if r]

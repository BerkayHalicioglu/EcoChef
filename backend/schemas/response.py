from pydantic import BaseModel, Field

from schemas.ingredient import NLPSuggestion

from schemas.recipe import Recipe


# --- Favoriler ---

class FavoriEkleIstegi(BaseModel):
    recipe_id: int
    recipe_isim: str
    recipe_gorsel: str | None = None


class FavoriYanit(BaseModel):
    id: int
    recipe_id: int
    recipe_isim: str
    recipe_gorsel: str | None = None
    kaydedilme_tarihi: str


# --- Yemek Planı ---

class PlanEkleIstegi(BaseModel):
    tarih: str        # YYYY-MM-DD
    ogun: str         # kahvalti / ogle / aksam
    recipe_id: int | None = None
    recipe_isim: str
    recipe_gorsel: str | None = None


class PlanYanit(BaseModel):
    id: int
    tarih: str
    ogun: str
    recipe_id: int | None = None
    recipe_isim: str
    recipe_gorsel: str | None = None


class RecipeStep(BaseModel):
    numara: int
    aciklama: str


class BeslenmeBilgisi(BaseModel):
    kalori: float | None = None
    protein_g: float | None = None
    karbonhidrat_g: float | None = None
    yag_g: float | None = None


class RecipeDetailResponse(BaseModel):
    """GET /recipes/{id} yanıtı."""

    id: int
    isim: str
    gorsel: str | None = None
    sure_dakika: int | None = Field(None, description="Toplam hazırlık süresi (dakika)")
    porsiyon: int | None = None
    malzemeler: list[str] = Field(default_factory=list)
    adimlar: list[RecipeStep] = Field(default_factory=list)
    beslenme: BeslenmeBilgisi | None = None


# --- Puanlama ---

class PuanEkleIstegi(BaseModel):
    recipe_id: int
    recipe_isim: str
    puan: int = Field(..., ge=1, le=5)


class PuanYanit(BaseModel):
    id: int
    recipe_id: int
    recipe_isim: str
    puan: int
    tarih: str


class TarifPuanOzet(BaseModel):
    recipe_id: int
    ortalama: float
    adet: int
    kullanici_puani: int | None = None


# --- Arama Geçmişi ---

class AramaKaydiIstegi(BaseModel):
    sorgu: str = Field(..., min_length=1, max_length=500)
    mod: str = Field(..., pattern="^(metin|gorsel)$")
    tarih: str


class AramaKaydiYanit(BaseModel):
    id: int
    sorgu: str
    mod: str
    tarih: str


# --- Keşfet ---

class DiscoverTarif(BaseModel):
    id: int
    isim: str
    gorsel: str | None = None
    sure_dakika: int | None = None
    beslenme: BeslenmeBilgisi | None = None
    kaynak: str | None = None  # "spoonacular" | "themealdb"


class DiscoverYanit(BaseModel):
    tarifler: list[DiscoverTarif]


class HealthResponse(BaseModel):
    """GET / yanıtı."""

    durum: str
    mesaj: str


class ImagePipelineResponse(BaseModel):
    """POST /detect-ingredients/ yanıtı."""

    tespit_edilen_malzemeler: list[str] = Field(
        ..., description="YOLO tarafından tespit edilen benzersiz malzeme isimleri"
    )
    bulunan_tarifler: list[Recipe] = Field(
        ..., description="Spoonacular'dan dönen eşleşen tarifler"
    )
    mesaj: str


class TextPipelineResponse(BaseModel):
    """POST /analyze-text-ingredients/ yanıtı."""

    basari: bool
    sonuclar: list[NLPSuggestion]


class HybridPipelineResponse(BaseModel):
    """POST /hybrid-suggest/ yanıtı."""

    tespit_edilen_malzemeler: list[str] = Field(
        ..., description="YOLO tarafından tespit edilen malzemeler"
    )
    nlp_onerileri: list[NLPSuggestion] = Field(
        ..., description="Yerel NLP modeli tarafından üretilen Türkçe yemek önerileri"
    )
    mesaj: str

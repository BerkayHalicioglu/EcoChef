from pydantic import BaseModel, Field

from schemas.ingredient import NLPSuggestion
from schemas.recipe import Recipe


class RecipeStep(BaseModel):
    numara: int
    aciklama: str


class RecipeDetailResponse(BaseModel):
    """GET /recipes/{id} yanıtı."""

    id: int
    isim: str
    gorsel: str | None = None
    sure_dakika: int | None = Field(None, description="Toplam hazırlık süresi (dakika)")
    porsiyon: int | None = None
    malzemeler: list[str] = Field(default_factory=list)
    adimlar: list[RecipeStep] = Field(default_factory=list)


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

from pydantic import BaseModel, Field


class TextInput(BaseModel):
    """Metin tabanlı NLP isteği."""

    text: str = Field(
        ...,
        min_length=3,
        max_length=500,
        examples=["Evde domates, soğan ve yumurta var, ne pişirebilirim?"],
    )
    diet: str | None = None
    max_calories: int | None = None
    min_protein: int | None = None
    max_carbs: int | None = None
    max_fat: int | None = None


class NLPSuggestion(BaseModel):
    """NLP modelinden ya da Spoonacular'dan dönen tek bir yemek önerisi."""

    isim: str = Field(..., description="Önerilen yemeğin adı")
    neden: str = Field(default="", description="Bu yemeğin neden önerildiğinin açıklaması")
    id: int | None = Field(None, description="Spoonacular tarif ID'si (varsa)")
    gorsel: str | None = Field(None, description="Tarif görseli URL'si (varsa)")
    kullanilan_malzemeler: list[str] = Field(default_factory=list)
    eksik_malzemeler: list[str] = Field(default_factory=list)
    beslenme: dict | None = None
    kaynak: str | None = Field(None, description="'spoonacular' veya 'themealdb'")

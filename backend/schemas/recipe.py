from pydantic import BaseModel, Field, HttpUrl


class Recipe(BaseModel):
    """Spoonacular veya TheMealDB'den dönen tek bir tarif."""

    id: int = Field(..., description="Tarif ID'si")
    isim: str = Field(..., description="Tarif adı")
    gorsel: HttpUrl | None = Field(None, description="Tarif görseli URL'i")
    kullanilan_malzemeler: list[str] = Field(default_factory=list)
    eksik_malzemeler: list[str] = Field(default_factory=list)
    kaynak: str = Field(default="spoonacular", description="'spoonacular' veya 'themealdb'")

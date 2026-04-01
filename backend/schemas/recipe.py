from pydantic import BaseModel, Field, HttpUrl


class Recipe(BaseModel):
    """Spoonacular'dan dönen tek bir tarif."""

    id: int = Field(..., description="Spoonacular tarif ID'si")
    isim: str = Field(..., description="Tarif adı")
    gorsel: HttpUrl | None = Field(None, description="Tarif görseli URL'i")
    kullanilan_malzemeler: list[str] = Field(
        default_factory=list,
        description="Elinizde bulunan ve tarifte kullanılan malzemeler",
    )
    eksik_malzemeler: list[str] = Field(
        default_factory=list,
        description="Tarifte gerekli olup elinizde bulunmayan malzemeler",
    )

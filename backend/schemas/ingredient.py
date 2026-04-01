from pydantic import BaseModel, Field


class TextInput(BaseModel):
    """Metin tabanlı NLP isteği."""

    text: str = Field(
        ...,
        min_length=3,
        max_length=500,
        examples=["Evde domates, soğan ve yumurta var, ne pişirebilirim?"],
    )


class NLPSuggestion(BaseModel):
    """NLP modelinden dönen tek bir yemek önerisi."""

    isim: str = Field(..., description="Önerilen yemeğin adı")
    neden: str = Field(..., description="Bu yemeğin neden önerildiğinin açıklaması")

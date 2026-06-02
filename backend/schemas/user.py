from pydantic import BaseModel, Field, field_validator


class KayitIstegi(BaseModel):
    kullanici_adi: str = Field(..., min_length=3, max_length=30)
    sifre: str = Field(..., min_length=6)

    @field_validator("kullanici_adi")
    @classmethod
    def sadece_gecerli_karakter(cls, v: str) -> str:
        if not v.replace("_", "").isalnum():
            raise ValueError("Kullanıcı adı sadece harf, rakam ve _ içerebilir.")
        return v.lower()


class GirisIstegi(BaseModel):
    kullanici_adi: str
    sifre: str


class TokenYanit(BaseModel):
    access_token: str
    token_type: str = "bearer"
    kullanici_adi: str


class KullaniciYanit(BaseModel):
    id: int
    kullanici_adi: str
    dietary_preferences: list[str] = []


class SifreDegistirIstegi(BaseModel):
    mevcut_sifre: str
    yeni_sifre: str = Field(..., min_length=6)


class ProfilGuncelleIstegi(BaseModel):
    dietary_preferences: list[str] = []

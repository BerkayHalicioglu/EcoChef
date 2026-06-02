from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Projenin kök dizini (backend/ klasörü)
BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """
    EcoChef uygulama ayarları.
    Değerler önce .env dosyasından, sonra ortam değişkenlerinden okunur.
    """

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # --- Spoonacular ---
    spoonacular_api_key: str
    spoonacular_base_url: str = "https://api.spoonacular.com/recipes/findByIngredients"

    # --- Model Yolları ---
    yolo_model_path: Path = BASE_DIR / "yolov8n.pt"
    llm_model_path: Path = BASE_DIR / "model.gguf"

    # --- YOLO Parametreleri ---
    yolo_confidence: float = 0.40   # Minimum tespit güven eşiği (0-1)
    yolo_food_only: bool = True     # Sadece yiyecek sınıflarını döndür

    # --- Veritabanı (MySQL) ---
    mysql_host: str = "localhost"
    mysql_port: int = 3306
    mysql_user: str = "ecochef"
    mysql_password: str = "ecochef_pass"
    mysql_db: str = "ecochef"

    @property
    def database_url(self) -> str:
        return (
            f"mysql+pymysql://{self.mysql_user}:{self.mysql_password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_db}"
            f"?charset=utf8mb4"
        )

    # --- JWT ---
    jwt_secret: str = Field(min_length=32)
    jwt_expire_days: int = 30

    # --- Çeviri ---
    translate_recipes: bool = True  # Spoonacular sonuçlarını Türkçeye çevir

    # --- Llama Parametreleri ---
    llm_n_ctx: int = 2048
    llm_verbose: bool = False


# Uygulama genelinde tek bir örnek (Singleton)
settings = Settings()

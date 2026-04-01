from pathlib import Path
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

    # --- Llama Parametreleri ---
    llm_n_ctx: int = 2048
    llm_verbose: bool = False


# Uygulama genelinde tek bir örnek (Singleton)
settings = Settings()

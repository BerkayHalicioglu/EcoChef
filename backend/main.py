from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile

from core.logger import get_logger
from core.orchestrator import EcoChefOrchestrator
from connectors.spoonacular import get_recipe_detail
from schemas.ingredient import TextInput
from schemas.response import (
    HealthResponse,
    HybridPipelineResponse,
    ImagePipelineResponse,
    RecipeDetailResponse,
    TextPipelineResponse,
)

log = get_logger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    log.info("EcoChef API starting up...")
    yield
    log.info("EcoChef API shutting down.")


app = FastAPI(
    title="EcoChef API",
    description="Yapay Zeka Destekli Akıllı Mutfak Asistanı (YOLO + NLP)",
    version="0.4.0",
    lifespan=lifespan,
)

orchestrator = EcoChefOrchestrator()


@app.get("/", response_model=HealthResponse)
def read_root() -> HealthResponse:
    return HealthResponse(
        durum="Çalışıyor",
        mesaj="EcoChef Hibrit (YOLO+NLP) Backend'i başarıyla ayağa kalktı!",
    )


@app.post("/detect-ingredients/", response_model=ImagePipelineResponse)
async def detect_ingredients(file: UploadFile = File(...)) -> ImagePipelineResponse:
    """Pipeline 1: Görsel → YOLO → Spoonacular"""
    try:
        result = orchestrator.image_pipeline(await file.read())
    except ValueError as e:
        return ImagePipelineResponse(
            tespit_edilen_malzemeler=[],
            bulunan_tarifler=[],
            mesaj=str(e),
        )
    except ConnectionError as e:
        raise HTTPException(status_code=502, detail=str(e))

    return ImagePipelineResponse(
        tespit_edilen_malzemeler=result.detected_ingredients,
        bulunan_tarifler=result.recipes,
        mesaj=result.message,
    )


@app.post("/analyze-text-ingredients/", response_model=TextPipelineResponse)
def analyze_text_ingredients(request: TextInput) -> TextPipelineResponse:
    """Pipeline 2: Metin → NLP → Öneri"""
    try:
        result = orchestrator.text_pipeline(request.text)
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return TextPipelineResponse(basari=True, sonuclar=result.suggestions)


@app.get("/recipes/{recipe_id}", response_model=RecipeDetailResponse)
def recipe_detail(recipe_id: int) -> RecipeDetailResponse:
    """Tarif ID'sine göre detay ve adım adım yapılışı döner."""
    try:
        data = get_recipe_detail(recipe_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ConnectionError as e:
        raise HTTPException(status_code=502, detail=str(e))
    return RecipeDetailResponse(**data)


@app.post("/hybrid-suggest/", response_model=HybridPipelineResponse)
async def hybrid_suggest(file: UploadFile = File(...)) -> HybridPipelineResponse:
    """Pipeline 3: Görsel → YOLO → NLP (internet bağlantısı gerekmez)"""
    try:
        result = orchestrator.hybrid_pipeline(await file.read())
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(status_code=500, detail=str(e))

    return HybridPipelineResponse(
        tespit_edilen_malzemeler=result.detected_ingredients,
        nlp_onerileri=result.nlp_suggestions,
        mesaj=result.message,
    )

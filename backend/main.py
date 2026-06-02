from contextlib import asynccontextmanager
from datetime import datetime, date as date_type, timedelta

from fastapi import Depends, FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from core.auth import kullanici_bul, kullanici_olustur, sifre_dogrula, sifrele, token_coz, token_iptal_et, token_iptal_mi, token_olustur
from core.request_context import current_lang
from core.database import FavoriteModel, MealPlanModel, RecipeRatingModel, SearchHistoryModel, get_db, init_db
from core.logger import get_logger
from core.orchestrator import EcoChefOrchestrator
from connectors.spoonacular import get_random_recipes, get_recipe_detail, search_by_cuisine
from connectors.themealdb import get_meal_detail, get_random_meals, search_by_area, search_turkish
from schemas.ingredient import TextInput
from schemas.response import (
    AramaKaydiIstegi,
    AramaKaydiYanit,
    FavoriEkleIstegi,
    FavoriYanit,
    HealthResponse,
    HybridPipelineResponse,
    ImagePipelineResponse,
    PlanEkleIstegi,
    PlanYanit,
    DiscoverTarif,
    DiscoverYanit,
    PuanEkleIstegi,
    PuanYanit,
    RecipeDetailResponse,
    TarifPuanOzet,
    TextPipelineResponse,
)
from schemas.user import GirisIstegi, KayitIstegi, KullaniciYanit, ProfilGuncelleIstegi, SifreDegistirIstegi, TokenYanit

log = get_logger(__name__)
security = HTTPBearer(auto_error=False)


def aktif_kullanici(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
):
    """Token geçerliyse UserModel döner, değilse 401 fırlatır."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Token gerekli.")
    if token_iptal_mi(db, credentials.credentials):
        raise HTTPException(status_code=401, detail="Oturum sonlandırılmış. Lütfen tekrar giriş yapın.")
    kullanici_adi = token_coz(credentials.credentials)
    if not kullanici_adi:
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token.")
    user = kullanici_bul(db, kullanici_adi)
    if not user:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı.")
    return user


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    log.info("EcoChef API starting up...")
    yield
    log.info("EcoChef API shutting down.")


app = FastAPI(
    title="EcoChef API",
    description="Yapay Zeka Destekli Akıllı Mutfak Asistanı (YOLO + NLP)",
    version="0.4.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def locale_middleware(request: Request, call_next):
    """Accept-Language başlığına göre istek dilini belirler."""
    lang_header = request.headers.get("Accept-Language", "tr")
    lang = lang_header[:2].lower()
    if lang not in ("tr", "en"):
        lang = "tr"
    token = current_lang.set(lang)
    try:
        return await call_next(request)
    finally:
        current_lang.reset(token)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

orchestrator = EcoChefOrchestrator()


@app.post("/auth/register", response_model=TokenYanit, tags=["Auth"])
def register(istek: KayitIstegi, db: Session = Depends(get_db)):
    if kullanici_bul(db, istek.kullanici_adi):
        raise HTTPException(status_code=409, detail="Bu kullanıcı adı zaten alınmış.")
    kullanici_olustur(db, istek.kullanici_adi, istek.sifre)
    token = token_olustur(istek.kullanici_adi)
    return TokenYanit(access_token=token, kullanici_adi=istek.kullanici_adi)


@app.post("/auth/login", response_model=TokenYanit, tags=["Auth"])
def login(istek: GirisIstegi, db: Session = Depends(get_db)):
    user = kullanici_bul(db, istek.kullanici_adi)
    if not user or not sifre_dogrula(istek.sifre, user.sifre_hash):
        raise HTTPException(status_code=401, detail="Kullanıcı adı veya şifre hatalı.")
    token = token_olustur(user.kullanici_adi)
    return TokenYanit(access_token=token, kullanici_adi=user.kullanici_adi)


@app.get("/auth/me", response_model=KullaniciYanit, tags=["Auth"])
def me(user=Depends(aktif_kullanici)):
    prefs = user.dietary_preferences.split(",") if user.dietary_preferences else []
    return KullaniciYanit(id=user.id, kullanici_adi=user.kullanici_adi, dietary_preferences=prefs)


@app.put("/auth/profile", response_model=KullaniciYanit, tags=["Auth"])
def update_profile(istek: ProfilGuncelleIstegi, user=Depends(aktif_kullanici), db: Session = Depends(get_db)):
    user.dietary_preferences = ",".join(istek.dietary_preferences) if istek.dietary_preferences else None
    db.commit()
    db.refresh(user)
    prefs = user.dietary_preferences.split(",") if user.dietary_preferences else []
    return KullaniciYanit(id=user.id, kullanici_adi=user.kullanici_adi, dietary_preferences=prefs)


@app.post("/auth/logout", tags=["Auth"])
def logout(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    db: Session = Depends(get_db),
):
    token_iptal_et(db, credentials.credentials)
    return {"basari": True, "mesaj": "Çıkış yapıldı."}


@app.put("/auth/password", tags=["Auth"])
def change_password(istek: SifreDegistirIstegi, user=Depends(aktif_kullanici), db: Session = Depends(get_db)):
    if not sifre_dogrula(istek.mevcut_sifre, user.sifre_hash):
        raise HTTPException(status_code=400, detail="Mevcut şifre hatalı.")
    user.sifre_hash = sifrele(istek.yeni_sifre)
    db.commit()
    return {"basari": True, "mesaj": "Şifre başarıyla güncellendi."}


@app.get("/", response_model=HealthResponse)
def read_root() -> HealthResponse:
    return HealthResponse(
        durum="Çalışıyor",
        mesaj="EcoChef Hibrit (YOLO+NLP) Backend'i başarıyla ayağa kalktı!",
    )


@app.post("/detect-ingredients/", response_model=ImagePipelineResponse)
@limiter.limit("10/minute")
async def detect_ingredients(
    request: Request,
    file: UploadFile = File(...),
    diet: str | None = Query(None, description="Diyet filtresi: vegetarian, vegan, gluten free vb."),
    max_calories: int | None = Query(None, description="Maksimum kalori (kcal)"),
    min_protein: int | None = Query(None, description="Minimum protein (g)"),
    max_carbs: int | None = Query(None, description="Maksimum karbonhidrat (g)"),
    max_fat: int | None = Query(None, description="Maksimum yağ (g)"),
) -> ImagePipelineResponse:
    """Pipeline 1: Görsel → YOLO → Spoonacular (opsiyonel diyet + besin değeri filtresi)"""
    try:
        result = orchestrator.image_pipeline(
            await file.read(), diet=diet,
            max_calories=max_calories, min_protein=min_protein,
            max_carbs=max_carbs, max_fat=max_fat,
        )
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
@limiter.limit("20/minute")
def analyze_text_ingredients(request: Request, body: TextInput) -> TextPipelineResponse:
    """Pipeline 2: Metin → Spoonacular + TheMealDB (ID'li gerçek tarifler)."""
    try:
        result = orchestrator.text_pipeline(
            body.text,
            diet=body.diet,
            max_calories=body.max_calories,
            min_protein=body.min_protein,
            max_carbs=body.max_carbs,
            max_fat=body.max_fat,
        )
        return TextPipelineResponse(basari=True, sonuclar=result.suggestions)
    except ConnectionError as e:
        raise HTTPException(status_code=502, detail=str(e))


# ── KEŞFet ────────────────────────────────────────────────────────────────────
# ÖNEMLI: /recipes/random ve /recipes/discover route'ları /recipes/{recipe_id}
# route'undan ÖNCE tanımlanmalı. Aksi hâlde FastAPI "random"/"discover"
# stringini integer'a dönüştürmeye çalışıp 422 döndürür.

DESTEKLENEN_MUTFAKLAR = {
    "turkish", "italian", "asian", "mediterranean", "mexican",
    "french", "japanese", "indian", "chinese", "american",
}


@app.get("/recipes/random", response_model=DiscoverYanit, tags=["Discover"])
@limiter.limit("15/minute")
def random_recipes(
    request: Request,
    count: int = Query(3, ge=1, le=6),
    tags: str | None = Query(None, description="Virgülle ayrılmış etiketler, ör: vegetarian,dinner"),
) -> DiscoverYanit:
    """Rastgele tarif önerileri döner. Spoonacular kotası doluysa TheMealDB kullanılır."""
    tarifler: list[dict] = []
    try:
        tarifler = get_random_recipes(count=count, tags=tags)
        for t in tarifler:
            t.setdefault("kaynak", "spoonacular")
    except ConnectionError as spoon_err:
        try:
            tarifler = get_random_meals(count=count)
        except ConnectionError as meal_err:
            raise HTTPException(status_code=502, detail=f"Spoonacular: {spoon_err} | TheMealDB: {meal_err}")
    return DiscoverYanit(tarifler=[DiscoverTarif(**t) for t in tarifler])


@app.get("/recipes/discover", response_model=DiscoverYanit, tags=["Discover"])
@limiter.limit("20/minute")
def discover_by_cuisine(
    request: Request,
    cuisine: str = Query(..., description="Mutfak türü, ör: italian"),
    count: int = Query(6, ge=1, le=10),
) -> DiscoverYanit:
    """Mutfak türüne göre tarif listesi döner. Türk mutfağı TheMealDB'den çekilir."""
    if cuisine.lower() not in DESTEKLENEN_MUTFAKLAR:
        raise HTTPException(status_code=400, detail=f"Desteklenmeyen mutfak türü. Geçerli seçenekler: {', '.join(sorted(DESTEKLENEN_MUTFAKLAR))}")
    tarifler: list[dict] = []
    try:
        if cuisine.lower() == "turkish":
            tarifler = search_turkish(count=count)
        else:
            tarifler = search_by_cuisine(cuisine=cuisine, count=count)
            for t in tarifler:
                t.setdefault("kaynak", "spoonacular")
    except ConnectionError as spoon_err:
        # Spoonacular başarısız → TheMealDB alan araması
        try:
            tarifler = search_by_area(cuisine=cuisine, count=count)
        except ConnectionError as meal_err:
            raise HTTPException(status_code=502, detail=f"Spoonacular: {spoon_err} | TheMealDB: {meal_err}")
    return DiscoverYanit(tarifler=[DiscoverTarif(**t) for t in tarifler])


@app.get("/recipes/meal/{meal_id}", response_model=RecipeDetailResponse, tags=["Discover"])
def meal_detail(meal_id: int) -> RecipeDetailResponse:
    """TheMealDB tarif ID'sine göre detay döner."""
    try:
        data = get_meal_detail(meal_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ConnectionError as e:
        raise HTTPException(status_code=502, detail=str(e))
    return RecipeDetailResponse(**data)


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


# ── FAVORİLER ─────────────────────────────────────────────────────────────────

@app.get("/favorites", response_model=list[FavoriYanit], tags=["Favorites"])
def list_favorites(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    user=Depends(aktif_kullanici),
    db: Session = Depends(get_db),
):
    favs = db.query(FavoriteModel).filter(FavoriteModel.user_id == user.id).offset(skip).limit(limit).all()
    return [
        FavoriYanit(
            id=f.id,
            recipe_id=f.recipe_id,
            recipe_isim=f.recipe_isim,
            recipe_gorsel=f.recipe_gorsel,
            kaydedilme_tarihi=f.kaydedilme_tarihi,
        )
        for f in favs
    ]


@app.post("/favorites", response_model=FavoriYanit, tags=["Favorites"])
def add_favorite(istek: FavoriEkleIstegi, user=Depends(aktif_kullanici), db: Session = Depends(get_db)):
    existing = db.query(FavoriteModel).filter(
        FavoriteModel.user_id == user.id,
        FavoriteModel.recipe_id == istek.recipe_id,
    ).first()
    if existing:
        return FavoriYanit(
            id=existing.id, recipe_id=existing.recipe_id,
            recipe_isim=existing.recipe_isim, recipe_gorsel=existing.recipe_gorsel,
            kaydedilme_tarihi=existing.kaydedilme_tarihi,
        )
    fav = FavoriteModel(
        user_id=user.id,
        recipe_id=istek.recipe_id,
        recipe_isim=istek.recipe_isim,
        recipe_gorsel=istek.recipe_gorsel,
        kaydedilme_tarihi=datetime.utcnow().isoformat(),
    )
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return FavoriYanit(
        id=fav.id, recipe_id=fav.recipe_id,
        recipe_isim=fav.recipe_isim, recipe_gorsel=fav.recipe_gorsel,
        kaydedilme_tarihi=fav.kaydedilme_tarihi,
    )


@app.delete("/favorites/{recipe_id}", tags=["Favorites"])
def remove_favorite(recipe_id: int, user=Depends(aktif_kullanici), db: Session = Depends(get_db)):
    fav = db.query(FavoriteModel).filter(
        FavoriteModel.user_id == user.id,
        FavoriteModel.recipe_id == recipe_id,
    ).first()
    if fav:
        db.delete(fav)
        db.commit()
    return {"basari": True}


# ── YEMEK PLANI ───────────────────────────────────────────────────────────────

@app.get("/meal-plan", response_model=list[PlanYanit], tags=["MealPlan"])
def get_meal_plan(
    hafta_basi: str = Query(..., description="Haftanın ilk günü (YYYY-MM-DD, Pazartesi)"),
    user=Depends(aktif_kullanici),
    db: Session = Depends(get_db),
):
    bitis = (date_type.fromisoformat(hafta_basi) + timedelta(days=6)).isoformat()
    items = db.query(MealPlanModel).filter(
        MealPlanModel.user_id == user.id,
        MealPlanModel.tarih >= hafta_basi,
        MealPlanModel.tarih <= bitis,
    ).all()
    return [
        PlanYanit(
            id=p.id, tarih=p.tarih, ogun=p.ogun,
            recipe_id=p.recipe_id, recipe_isim=p.recipe_isim, recipe_gorsel=p.recipe_gorsel,
        )
        for p in items
    ]


@app.post("/meal-plan", response_model=PlanYanit, tags=["MealPlan"])
def add_meal_plan(istek: PlanEkleIstegi, user=Depends(aktif_kullanici), db: Session = Depends(get_db)):
    # Aynı gün+öğün varsa üzerine yaz
    existing = db.query(MealPlanModel).filter(
        MealPlanModel.user_id == user.id,
        MealPlanModel.tarih == istek.tarih,
        MealPlanModel.ogun == istek.ogun,
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
    plan = MealPlanModel(
        user_id=user.id,
        tarih=istek.tarih,
        ogun=istek.ogun,
        recipe_id=istek.recipe_id,
        recipe_isim=istek.recipe_isim,
        recipe_gorsel=istek.recipe_gorsel,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return PlanYanit(
        id=plan.id, tarih=plan.tarih, ogun=plan.ogun,
        recipe_id=plan.recipe_id, recipe_isim=plan.recipe_isim, recipe_gorsel=plan.recipe_gorsel,
    )


@app.delete("/meal-plan/{plan_id}", tags=["MealPlan"])
def remove_meal_plan(plan_id: int, user=Depends(aktif_kullanici), db: Session = Depends(get_db)):
    plan = db.query(MealPlanModel).filter(
        MealPlanModel.id == plan_id,
        MealPlanModel.user_id == user.id,
    ).first()
    if plan:
        db.delete(plan)
        db.commit()
    return {"basari": True}


# ── PUANLAMA ──────────────────────────────────────────────────────────────────

@app.post("/ratings", response_model=PuanYanit, tags=["Ratings"])
def add_rating(istek: PuanEkleIstegi, user=Depends(aktif_kullanici), db: Session = Depends(get_db)):
    # Kullanıcının mevcut puanı varsa güncelle
    mevcut = db.query(RecipeRatingModel).filter(
        RecipeRatingModel.user_id == user.id,
        RecipeRatingModel.recipe_id == istek.recipe_id,
    ).first()
    if mevcut:
        mevcut.puan = istek.puan
        mevcut.tarih = datetime.utcnow().isoformat()
        db.commit()
        db.refresh(mevcut)
        return PuanYanit(id=mevcut.id, recipe_id=mevcut.recipe_id, recipe_isim=mevcut.recipe_isim, puan=mevcut.puan, tarih=mevcut.tarih)

    rating = RecipeRatingModel(
        user_id=user.id,
        recipe_id=istek.recipe_id,
        recipe_isim=istek.recipe_isim,
        puan=istek.puan,
        tarih=datetime.utcnow().isoformat(),
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)
    return PuanYanit(id=rating.id, recipe_id=rating.recipe_id, recipe_isim=rating.recipe_isim, puan=rating.puan, tarih=rating.tarih)


@app.get("/ratings/{recipe_id}", response_model=TarifPuanOzet, tags=["Ratings"])
def get_rating(
    recipe_id: int,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
):
    tumler = db.query(RecipeRatingModel).filter(RecipeRatingModel.recipe_id == recipe_id).all()
    ortalama = round(sum(r.puan for r in tumler) / len(tumler), 1) if tumler else 0.0

    kullanici_puani = None
    if credentials and not token_iptal_mi(db, credentials.credentials):
        kullanici_adi = token_coz(credentials.credentials)
        if kullanici_adi:
            user = kullanici_bul(db, kullanici_adi)
            if user:
                kullanici_puani = next((r.puan for r in tumler if r.user_id == user.id), None)

    return TarifPuanOzet(recipe_id=recipe_id, ortalama=ortalama, adet=len(tumler), kullanici_puani=kullanici_puani)


@app.post("/hybrid-suggest/", response_model=HybridPipelineResponse)
@limiter.limit("10/minute")
async def hybrid_suggest(request: Request, file: UploadFile = File(...)) -> HybridPipelineResponse:
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


# ── ARAMA GEÇMİŞİ ─────────────────────────────────────────────────────────────

@app.get("/search-history", response_model=list[AramaKaydiYanit], tags=["SearchHistory"])
def get_search_history(
    limit: int = Query(30, ge=1, le=100),
    user=Depends(aktif_kullanici),
    db: Session = Depends(get_db),
):
    kayitlar = (
        db.query(SearchHistoryModel)
        .filter(SearchHistoryModel.user_id == user.id)
        .order_by(SearchHistoryModel.id.desc())
        .limit(limit)
        .all()
    )
    return [AramaKaydiYanit(id=k.id, sorgu=k.sorgu, mod=k.mod, tarih=k.tarih) for k in kayitlar]


@app.post("/search-history", response_model=AramaKaydiYanit, tags=["SearchHistory"])
def add_search_history(istek: AramaKaydiIstegi, user=Depends(aktif_kullanici), db: Session = Depends(get_db)):
    # Aynı sorgu zaten varsa üste taşı (sil + yeniden ekle)
    mevcut = db.query(SearchHistoryModel).filter(
        SearchHistoryModel.user_id == user.id,
        SearchHistoryModel.sorgu == istek.sorgu,
    ).first()
    if mevcut:
        db.delete(mevcut)
        db.commit()
    kayit = SearchHistoryModel(
        user_id=user.id,
        sorgu=istek.sorgu,
        mod=istek.mod,
        tarih=istek.tarih,
    )
    db.add(kayit)
    db.commit()
    db.refresh(kayit)
    return AramaKaydiYanit(id=kayit.id, sorgu=kayit.sorgu, mod=kayit.mod, tarih=kayit.tarih)


@app.delete("/search-history/{kayit_id}", tags=["SearchHistory"])
def delete_search_history(kayit_id: int, user=Depends(aktif_kullanici), db: Session = Depends(get_db)):
    kayit = db.query(SearchHistoryModel).filter(
        SearchHistoryModel.id == kayit_id,
        SearchHistoryModel.user_id == user.id,
    ).first()
    if kayit:
        db.delete(kayit)
        db.commit()
    return {"basari": True}


@app.delete("/search-history", tags=["SearchHistory"])
def clear_search_history(user=Depends(aktif_kullanici), db: Session = Depends(get_db)):
    db.query(SearchHistoryModel).filter(SearchHistoryModel.user_id == user.id).delete()
    db.commit()
    return {"basari": True}

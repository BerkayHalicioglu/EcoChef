from sqlalchemy import create_engine, Column, ForeignKey, Integer, String, inspect as _inspect, text as _text
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from core.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=3600,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    kullanici_adi = Column(String(100), unique=True, index=True, nullable=False)
    sifre_hash = Column(String(255), nullable=False)
    dietary_preferences = Column(String(500), nullable=True)  # virgülle ayrılmış: "vegetarian,vegan"


class FavoriteModel(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipe_id = Column(Integer, nullable=False)
    recipe_isim = Column(String(255), nullable=False)
    recipe_gorsel = Column(String(512), nullable=True)
    kaydedilme_tarihi = Column(String(30), nullable=False)


class MealPlanModel(Base):
    __tablename__ = "meal_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    tarih = Column(String(10), nullable=False)   # YYYY-MM-DD
    ogun = Column(String(20), nullable=False)    # kahvalti / ogle / aksam
    recipe_id = Column(Integer, nullable=True)
    recipe_isim = Column(String(255), nullable=False)
    recipe_gorsel = Column(String(512), nullable=True)


class RecipeRatingModel(Base):
    __tablename__ = "recipe_ratings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipe_id = Column(Integer, nullable=False, index=True)
    recipe_isim = Column(String(255), nullable=False)
    puan = Column(Integer, nullable=False)   # 1-5
    tarih = Column(String(30), nullable=False)


class SearchHistoryModel(Base):
    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    sorgu = Column(String(500), nullable=False)
    mod = Column(String(10), nullable=False)   # metin / gorsel
    tarih = Column(String(30), nullable=False)


class RevokedTokenModel(Base):
    __tablename__ = "revoked_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(512), unique=True, nullable=False, index=True)
    iptal_tarihi = Column(String(50), nullable=False)


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    # Mevcut tablolara sonradan eklenen kolonları ekle (create_all yapmaz)
    try:
        inspector = _inspect(engine)
        existing_cols = {col["name"] for col in inspector.get_columns("users")}
        if "dietary_preferences" not in existing_cols:
            with engine.connect() as conn:
                conn.execute(_text(
                    "ALTER TABLE users ADD COLUMN dietary_preferences VARCHAR(500)"
                ))
                conn.commit()
    except Exception:
        pass  # tablo henüz yoksa create_all halleder

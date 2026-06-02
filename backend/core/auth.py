import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from sqlalchemy.orm import Session

from core.config import settings
from core.database import RevokedTokenModel, UserModel


def sifrele(sifre: str) -> str:
    """PBKDF2-SHA256 ile şifrele — salt:hash formatında döner."""
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", sifre.encode(), salt.encode(), 260_000).hex()
    return f"{salt}:{h}"


def sifre_dogrula(sifre: str, kayitli: str) -> bool:
    """Timing-safe karşılaştırma ile şifre doğrula."""
    try:
        salt, beklenen = kayitli.split(":", 1)
    except ValueError:
        return False
    hesaplanan = hashlib.pbkdf2_hmac("sha256", sifre.encode(), salt.encode(), 260_000).hex()
    return hmac.compare_digest(hesaplanan, beklenen)


def token_olustur(kullanici_adi: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_expire_days)
    return jwt.encode(
        {"sub": kullanici_adi, "exp": expire},
        settings.jwt_secret,
        algorithm="HS256",
    )


def token_coz(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return payload.get("sub")
    except JWTError:
        return None


def token_iptal_et(db: Session, token: str) -> None:
    """Token'ı blacklist'e ekle."""
    if not db.query(RevokedTokenModel).filter(RevokedTokenModel.token == token).first():
        db.add(RevokedTokenModel(token=token, iptal_tarihi=datetime.now(timezone.utc).isoformat()))
        db.commit()


def token_iptal_mi(db: Session, token: str) -> bool:
    """Token blacklist'te mi kontrol et."""
    return db.query(RevokedTokenModel).filter(RevokedTokenModel.token == token).first() is not None


def kullanici_bul(db: Session, kullanici_adi: str) -> UserModel | None:
    return db.query(UserModel).filter(UserModel.kullanici_adi == kullanici_adi).first()


def kullanici_olustur(db: Session, kullanici_adi: str, sifre: str) -> UserModel:
    user = UserModel(kullanici_adi=kullanici_adi, sifre_hash=sifrele(sifre))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

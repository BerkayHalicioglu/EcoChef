"""
EcoChef çeviri modülü.
deep-translator (Google Translate) kullanarak İngilizce → Türkçe çeviri yapar.
LRU önbellek ile tekrar eden çeviriler atlanır.
Çeviri başarısız olursa orijinal metin döner (graceful fallback).
"""

from functools import lru_cache

from core.logger import get_logger
from core.request_context import current_lang

log = get_logger(__name__)


@lru_cache(maxsize=512)
def _cevir(metin: str) -> str:
    """Tek bir metni çevirir; önbellekte varsa doğrudan döner."""
    from deep_translator import GoogleTranslator
    try:
        sonuc = GoogleTranslator(source="en", target="tr").translate(metin)
        return sonuc if sonuc else metin
    except Exception as exc:
        log.warning("Çeviri başarısız | metin=%r hata=%s", metin[:60], exc)
        return metin


def cevir(metin: str) -> str:
    """Boş stringleri geçer; istek dili 'en' ise çevirmeden döner."""
    if not metin or not metin.strip():
        return metin
    if current_lang.get() == 'en':
        return metin
    return _cevir(metin.strip())


def cevir_liste(metinler: list[str]) -> list[str]:
    """Liste içindeki her metni ayrı ayrı çevirir."""
    return [cevir(m) for m in metinler]


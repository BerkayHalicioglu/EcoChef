"""İstek başına dil tercihini tutan context değişkeni."""
from contextvars import ContextVar

current_lang: ContextVar[str] = ContextVar('current_lang', default='tr')

/**
 * Backend API ile iletişimde kullanılan ortak yardımcılar.
 *
 * - parseHata: HTTP hata yanıtından Türkçe mesaj üretir
 * - FavoriYanit / PlanYanit gibi backend snake_case yanıtlarını
 *   camelCase frontend tiplerine dönüştüren mapper'lar
 */

export const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
export const NGROK_HEADER: Record<string, string> = { 'ngrok-skip-browser-warning': '1' };

/** Locale header'ı — backend bu header'a göre tarif çevirisini atlar. */
export function langHeaders(locale: string): Record<string, string> {
  return { 'Accept-Language': locale };
}

// ── Hata mesajı çözümleyici ───────────────────────────────────────────────────

/**
 * Fetch yanıtından kullanıcıya gösterilecek Türkçe hata mesajı üretir.
 * Önce backend'in `detail` alanına bakar, sonra HTTP status'a göre
 * anlamlı bir varsayılan döner.
 */
export async function parseHata(res: Response, varsayilan: string): Promise<string> {
  try {
    const json = await res.clone().json();
    if (json?.detail) {
      if (Array.isArray(json.detail)) {
        // FastAPI validation errors: [{loc, msg, type}]
        return json.detail.map((e: any) => e.msg ?? String(e)).join(', ');
      }
      return String(json.detail);
    }
  } catch {
    // JSON parse edilemezse aşağıdaki status bazlı mesaja düş
  }

  switch (res.status) {
    case 400: return 'Geçersiz istek. Girdiğiniz bilgileri kontrol edin.';
    case 401: return 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.';
    case 403: return 'Bu işlem için yetkiniz yok.';
    case 404: return 'İstenen kaynak bulunamadı.';
    case 409: return 'Bu kayıt zaten mevcut.';
    case 422: return 'Gönderilen veri geçersiz. Lütfen tekrar deneyin.';
    case 429: {
      const retryAfter = res.headers.get('Retry-After');
      const saniye = retryAfter ? parseInt(retryAfter, 10) : NaN;
      return Number.isFinite(saniye) && saniye > 0
        ? `İstek limiti aşıldı. ${saniye} saniye sonra tekrar deneyin.`
        : 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.';
    }
    case 500: return 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
    case 502:
    case 503: return 'Sunucuya ulaşılamıyor. İnternet bağlantınızı kontrol edin.';
    default:  return varsayilan;
  }
}

/**
 * Ağ hatalarını (fetch throw) kullanıcı dostu mesaja çevirir.
 * `AbortError` timeout, diğerleri genellikle ağ bağlantısı sorunudur.
 */
export function agHatasiMesaji(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === 'AbortError') return 'İstek zaman aşımına uğradı. Bağlantınızı kontrol edin.';
    if (err.message.includes('Network')) return 'Ağ bağlantısı yok. Lütfen internet bağlantınızı kontrol edin.';
  }
  return 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.';
}

// ── Backend → Frontend tip dönüşümleri ──────────────────────────────────────

/** Backend FavoriYanit (snake_case) → Frontend FavoriTarif (camelCase) */
export function favoriYanitMap(f: any) {
  return {
    id: f.recipe_id as number,
    isim: f.recipe_isim as string,
    gorsel: (f.recipe_gorsel ?? undefined) as string | undefined,
    kaydedilmeTarihi: f.kaydedilme_tarihi as string,
  };
}

/** Backend PlanYanit (snake_case) → Frontend PlanItem (camelCase) */
export function planYanitMap(p: any) {
  return {
    id: p.id as number,
    tarih: p.tarih as string,
    ogun: p.ogun as 'kahvalti' | 'ogle' | 'aksam',
    recipe_id: (p.recipe_id ?? undefined) as number | undefined,
    recipe_isim: p.recipe_isim as string,
    recipe_gorsel: (p.recipe_gorsel ?? undefined) as string | undefined,
  };
}

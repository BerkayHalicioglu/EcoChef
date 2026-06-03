import {
  agHatasiMesaji,
  favoriYanitMap,
  langHeaders,
  parseHata,
  planYanitMap,
} from '@/utils/api';

// ── langHeaders ────────────────────────────────────────────────────────────────

describe('langHeaders', () => {
  it('doğru Accept-Language header döner', () => {
    expect(langHeaders('tr')).toEqual({ 'Accept-Language': 'tr' });
    expect(langHeaders('en')).toEqual({ 'Accept-Language': 'en' });
  });
});

// ── agHatasiMesaji ─────────────────────────────────────────────────────────────

describe('agHatasiMesaji', () => {
  it('AbortError için timeout mesajı döner', () => {
    const err = Object.assign(new Error('aborted'), { name: 'AbortError' });
    expect(agHatasiMesaji(err)).toMatch(/zaman aşım/i);
  });

  it('"Network" içeren hata için ağ bağlantısı mesajı döner', () => {
    const err = new Error('Network request failed');
    expect(agHatasiMesaji(err)).toMatch(/ağ bağlantısı/i);
  });

  it('bilinmeyen hata için genel mesaj döner', () => {
    expect(agHatasiMesaji(new Error('unknown'))).toMatch(/sunucuya bağlanılamadı/i);
    expect(agHatasiMesaji('string error')).toMatch(/sunucuya bağlanılamadı/i);
    expect(agHatasiMesaji(null)).toMatch(/sunucuya bağlanılamadı/i);
  });
});

// ── parseHata ──────────────────────────────────────────────────────────────────

function mockResponse(status: number, body?: object, retryAfter?: string) {
  const bodyStr = body ? JSON.stringify(body) : '{}';
  const headers = { get: (key: string) => (key === 'Retry-After' ? (retryAfter ?? null) : null) };
  return {
    status,
    ok: status >= 200 && status < 300,
    headers,
    clone: () => ({
      json: () => (body ? Promise.resolve(body) : Promise.reject(new Error('parse error'))),
    }),
  } as unknown as Response;
}

describe('parseHata', () => {
  it('backend detail string döndürürse onu kullanır', async () => {
    const res = mockResponse(400, { detail: 'Özel hata mesajı' });
    expect(await parseHata(res, 'varsayılan')).toBe('Özel hata mesajı');
  });

  it('backend detail array (Pydantic) ise msg alanlarını birleştirir', async () => {
    const res = mockResponse(422, { detail: [{ msg: 'alan gerekli' }, { msg: 'geçersiz değer' }] });
    expect(await parseHata(res, 'varsayılan')).toBe('alan gerekli, geçersiz değer');
  });

  it('401 için oturum mesajı döner', async () => {
    const res = mockResponse(401);
    expect(await parseHata(res, 'varsayılan')).toMatch(/oturum/i);
  });

  it('403 için yetki mesajı döner', async () => {
    const res = mockResponse(403);
    expect(await parseHata(res, 'varsayılan')).toMatch(/yetkini/i);
  });

  it('404 için bulunamadı mesajı döner', async () => {
    const res = mockResponse(404);
    expect(await parseHata(res, 'varsayılan')).toMatch(/bulunamadı/i);
  });

  it('409 için zaten mevcut mesajı döner', async () => {
    const res = mockResponse(409);
    expect(await parseHata(res, 'varsayılan')).toMatch(/mevcut/i);
  });

  it('429 için rate-limit mesajı döner', async () => {
    const res = mockResponse(429);
    expect(await parseHata(res, 'varsayılan')).toMatch(/fazla istek/i);
  });

  it('429 + Retry-After header saniyeyi içerir', async () => {
    const res = mockResponse(429, undefined, '30');
    const mesaj = await parseHata(res, 'varsayılan');
    expect(mesaj).toMatch(/30 saniye/);
  });

  it('500 için sunucu hatası mesajı döner', async () => {
    const res = mockResponse(500);
    expect(await parseHata(res, 'varsayılan')).toMatch(/sunucu hatası/i);
  });

  it('502/503 için ulaşılamıyor mesajı döner', async () => {
    expect(await parseHata(mockResponse(502), 'varsayılan')).toMatch(/ulaşılamıyor/i);
    expect(await parseHata(mockResponse(503), 'varsayılan')).toMatch(/ulaşılamıyor/i);
  });

  it('bilinmeyen status için varsayılan mesajı döner', async () => {
    const res = mockResponse(418);
    expect(await parseHata(res, 'çaydanlık hatası')).toBe('çaydanlık hatası');
  });

  it('JSON parse hatası olursa status bazlı mesaja düşer', async () => {
    const res = {
      status: 400,
      headers: { get: () => null },
      clone: () => ({ json: () => Promise.reject(new Error('parse')) }),
    } as unknown as Response;
    expect(await parseHata(res, 'varsayılan')).toMatch(/geçersiz istek/i);
  });
});

// ── favoriYanitMap ─────────────────────────────────────────────────────────────

describe('favoriYanitMap', () => {
  it('backend snake_case yanıtını camelCase frontend tipine dönüştürür', () => {
    const yanit = {
      recipe_id: 42,
      recipe_isim: 'Mercimek Çorbası',
      recipe_gorsel: 'https://example.com/gorsel.jpg',
      kaydedilme_tarihi: '2024-01-15T10:00:00Z',
    };
    expect(favoriYanitMap(yanit)).toEqual({
      id: 42,
      isim: 'Mercimek Çorbası',
      gorsel: 'https://example.com/gorsel.jpg',
      kaydedilmeTarihi: '2024-01-15T10:00:00Z',
    });
  });

  it('recipe_gorsel null ise gorsel undefined olur', () => {
    const yanit = { recipe_id: 1, recipe_isim: 'Test', recipe_gorsel: null, kaydedilme_tarihi: '2024-01-01' };
    expect(favoriYanitMap(yanit).gorsel).toBeUndefined();
  });
});

// ── planYanitMap ───────────────────────────────────────────────────────────────

describe('planYanitMap', () => {
  it('backend plan yanıtını frontend tipine dönüştürür', () => {
    const yanit = {
      id: 7,
      tarih: '2024-06-10',
      ogun: 'kahvalti',
      recipe_id: 99,
      recipe_isim: 'Yulaf Ezmesi',
      recipe_gorsel: null,
    };
    const sonuc = planYanitMap(yanit);
    expect(sonuc).toEqual({
      id: 7,
      tarih: '2024-06-10',
      ogun: 'kahvalti',
      recipe_id: 99,
      recipe_isim: 'Yulaf Ezmesi',
      recipe_gorsel: undefined,
    });
  });

  it('recipe_id yoksa undefined olur', () => {
    const yanit = { id: 1, tarih: '2024-06-10', ogun: 'ogle', recipe_id: null, recipe_isim: 'Sade', recipe_gorsel: null };
    expect(planYanitMap(yanit).recipe_id).toBeUndefined();
  });
});

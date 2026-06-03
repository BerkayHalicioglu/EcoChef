import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';
import { useRecipeCache } from '@/hooks/use-recipe-cache';

const STORAGE_KEY = 'ecochef_recipe_cache';
const DETAIL_KEY = 'ecochef_detail_cache';

const ornek = (isim: string) => ({
  malzemeler: ['tavuk', 'soğan'],
  tarifler: [{ id: 1, isim }],
  mod: 'metin' as const,
});

describe('useRecipeCache', () => {
  beforeEach(() => { (AsyncStorage as any).clear(); });

  it('başlangıçta boş cache', async () => {
    const { result } = renderHook(() => useRecipeCache());
    await act(async () => {});
    expect(result.current.gecmis).toHaveLength(0);
    expect(result.current.sonGirdi).toBeNull();
  });

  it('kaydet() yeni girdi ekler ve AsyncStorage günceller', async () => {
    const { result } = renderHook(() => useRecipeCache());
    await act(async () => {});

    await act(async () => {
      await result.current.kaydet(ornek('Tavuk Sote'));
    });

    expect(result.current.gecmis).toHaveLength(1);
    expect(result.current.gecmis[0].tarifler[0].isim).toBe('Tavuk Sote');
    expect(result.current.gecmis[0]).toHaveProperty('tarih');

    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    expect(JSON.parse(stored!)[0].tarifler[0].isim).toBe('Tavuk Sote');
  });

  it('sonGirdi her zaman en son kaydedilen girdidir', async () => {
    const { result } = renderHook(() => useRecipeCache());
    await act(async () => {});

    await act(async () => { await result.current.kaydet(ornek('Birinci')); });
    await act(async () => { await result.current.kaydet(ornek('İkinci')); });

    expect(result.current.sonGirdi?.tarifler[0].isim).toBe('İkinci');
  });

  it('detayKaydet() ve detayGetir() birlikte çalışır', async () => {
    const { result } = renderHook(() => useRecipeCache());
    await act(async () => {});

    const detay = {
      id: 42,
      isim: 'Mercimek Çorbası',
      gorsel: null,
      sure_dakika: 30,
      porsiyon: 4,
      malzemeler: ['kırmızı mercimek'],
      adimlar: [{ numara: 1, aciklama: 'Haşla' }],
      beslenme: { kalori: 180 },
    };

    await act(async () => { await result.current.detayKaydet(detay, 'tr'); });
    const getirilen = result.current.detayGetir(42, 'tr');
    expect(getirilen?.isim).toBe('Mercimek Çorbası');
    expect(getirilen?.beslenme?.kalori).toBe(180);
  });

  it('farklı locale için ayrı cache tutulur', async () => {
    const { result } = renderHook(() => useRecipeCache());
    await act(async () => {});

    const detayTR = { id: 5, isim: 'Tarhana Çorbası', gorsel: null, sure_dakika: null, porsiyon: null, malzemeler: [], adimlar: [] };
    const detayEN = { id: 5, isim: 'Tarhana Soup', gorsel: null, sure_dakika: null, porsiyon: null, malzemeler: [], adimlar: [] };

    // Her iki locale için ayrı act — hook closure'da detaylar state güncellenmeli
    await act(async () => { await result.current.detayKaydet(detayTR, 'tr'); });
    await act(async () => { await result.current.detayKaydet(detayEN, 'en'); });

    expect(result.current.detayGetir(5, 'tr')?.isim).toBe('Tarhana Çorbası');
    expect(result.current.detayGetir(5, 'en')?.isim).toBe('Tarhana Soup');
  });

  it('olmayan tarif için detayGetir null döner', async () => {
    const { result } = renderHook(() => useRecipeCache());
    await act(async () => {});
    expect(result.current.detayGetir(9999, 'tr')).toBeNull();
  });

  it('AsyncStorage doluysa mevcut cache yüklenir', async () => {
    const mevcutCache = [
      { ...ornek('Önceden Kaydedilmiş'), tarih: '2024-01-01T00:00:00Z' },
    ];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mevcutCache));

    const { result } = renderHook(() => useRecipeCache());
    await act(async () => {});

    expect(result.current.gecmis[0].tarifler[0].isim).toBe('Önceden Kaydedilmiş');
  });
});

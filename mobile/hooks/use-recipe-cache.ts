import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export type CacheGirdisi = {
  malzemeler: string[];
  tarifler: {
    id?: number;
    isim: string;
    gorsel?: string;
    kullanilan_malzemeler?: string[];
    eksik_malzemeler?: string[];
    neden?: string;
  }[];
  mod: 'gorsel' | 'metin';
  tarih: string;
};

export type DetayCacheGirdisi = {
  id: number;
  isim: string;
  gorsel: string | null;
  sure_dakika: number | null;
  porsiyon: number | null;
  malzemeler: string[];
  adimlar: { numara: number; aciklama: string }[];
  beslenme?: {
    kalori?: number;
    protein_g?: number;
    karbonhidrat_g?: number;
    yag_g?: number;
  } | null;
};

const STORAGE_KEY = 'ecochef_recipe_cache';
const DETAIL_STORAGE_KEY = 'ecochef_detail_cache';
const MAX_GIRDI = 10;
const MAX_DETAY = 20;

export function useRecipeCache() {
  const [gecmis, setGecmis] = useState<CacheGirdisi[]>([]);
  const [detaylar, setDetaylar] = useState<Record<string, DetayCacheGirdisi>>({});

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((json) => {
      if (json) setGecmis(JSON.parse(json));
    });
    AsyncStorage.getItem(DETAIL_STORAGE_KEY).then((json) => {
      if (json) setDetaylar(JSON.parse(json));
    });
  }, []);

  const kaydet = useCallback(async (girdi: Omit<CacheGirdisi, 'tarih'>) => {
    const yeni: CacheGirdisi = { ...girdi, tarih: new Date().toISOString() };
    const guncel = [yeni, ...gecmis].slice(0, MAX_GIRDI);
    setGecmis(guncel);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(guncel));
  }, [gecmis]);

  const detayKaydet = useCallback(async (detay: DetayCacheGirdisi, locale: string = 'tr') => {
    const key = `${detay.id}_${locale}`;
    const guncel = { ...detaylar, [key]: detay };
    if (Object.keys(guncel).length > MAX_DETAY) {
      const enEski = Object.keys(guncel)[0];
      delete guncel[enEski];
    }
    setDetaylar(guncel);
    await AsyncStorage.setItem(DETAIL_STORAGE_KEY, JSON.stringify(guncel));
  }, [detaylar]);

  const detayGetir = useCallback((id: number, locale: string = 'tr'): DetayCacheGirdisi | null => {
    return detaylar[`${id}_${locale}`] ?? null;
  }, [detaylar]);

  const sonGirdi = gecmis[0] ?? null;

  return { gecmis, sonGirdi, kaydet, detayKaydet, detayGetir };
}

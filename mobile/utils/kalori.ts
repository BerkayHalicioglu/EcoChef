import AsyncStorage from '@react-native-async-storage/async-storage';

export const BEDEN_KEY = 'ecochef_body_metrics';
export const KALORI_HEDEF_KEY = 'ecochef_kalori_hedefi';

export type Cinsiyet = 'erkek' | 'kadin';
export type AktiviteSeviyesi = 'hareketsiz' | 'az' | 'orta' | 'cok';

export type BedenMetrikleri = {
  cinsiyet: Cinsiyet;
  yas: number;
  boy: number;
  kilo: number;
  aktivite: AktiviteSeviyesi;
};

const AKTIVITE_KATSAYI: Record<AktiviteSeviyesi, number> = {
  hareketsiz: 1.2,
  az: 1.375,
  orta: 1.55,
  cok: 1.725,
};

export function kaloriHesapla(m: BedenMetrikleri): number {
  const bmr =
    m.cinsiyet === 'erkek'
      ? 10 * m.kilo + 6.25 * m.boy - 5 * m.yas + 5
      : 10 * m.kilo + 6.25 * m.boy - 5 * m.yas - 161;
  return Math.round(bmr * AKTIVITE_KATSAYI[m.aktivite]);
}

export async function bedenKaydet(m: BedenMetrikleri): Promise<void> {
  const hedef = kaloriHesapla(m);
  await Promise.all([
    AsyncStorage.setItem(BEDEN_KEY, JSON.stringify(m)),
    AsyncStorage.setItem(KALORI_HEDEF_KEY, String(hedef)),
  ]);
}

export async function kaloriHedefiGetir(): Promise<number> {
  const val = await AsyncStorage.getItem(KALORI_HEDEF_KEY);
  return val ? parseInt(val, 10) : 2000;
}

export async function bedenGetir(): Promise<BedenMetrikleri | null> {
  const val = await AsyncStorage.getItem(BEDEN_KEY);
  return val ? JSON.parse(val) : null;
}

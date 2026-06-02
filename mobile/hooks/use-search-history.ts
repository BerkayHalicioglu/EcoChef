import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export type AramaKaydi = {
  id: string;
  sorgu: string;
  mod: 'metin' | 'gorsel';
  tarih: string;
};

const MAX_KAYIT = 30;
const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
const NGROK_HEADER = { 'ngrok-skip-browser-warning': '1' };

// Her kullanıcı kendi geçmişini görür
const storageKey = (kullaniciAdi: string | null) =>
  `ecochef_arama_gecmisi_${kullaniciAdi ?? 'misafir'}`;

export function useSearchHistory() {
  const { token, kullaniciAdi } = useAuth();
  const [gecmis, setGecmis] = useState<AramaKaydi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Kullanıcı değiştiğinde (login/logout/hesap değişimi) yeniden yükle
  useEffect(() => {
    setGecmis([]);
    setYukleniyor(true);
    const key = storageKey(kullaniciAdi);

    AsyncStorage.getItem(key).then((json) => {
      if (json) setGecmis(JSON.parse(json));
      if (!token) setYukleniyor(false);
    });

    if (!token) return;

    fetch(`${BASE_URL}/search-history?limit=30`, {
      headers: { ...NGROK_HEADER, Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!Array.isArray(data)) return;
        const sunucu: AramaKaydi[] = data.map((k: any) => ({
          id: String(k.id),
          sorgu: k.sorgu,
          mod: k.mod as 'metin' | 'gorsel',
          tarih: k.tarih,
        }));
        setGecmis((prev) => {
          const sunucuSorgular = new Set(sunucu.map((k) => k.sorgu.toLowerCase()));
          const yerelEkstra = prev.filter((k) => !sunucuSorgular.has(k.sorgu.toLowerCase()));
          const birlesik = [...sunucu, ...yerelEkstra].slice(0, MAX_KAYIT);
          AsyncStorage.setItem(key, JSON.stringify(birlesik));
          return birlesik;
        });
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, [kullaniciAdi, token]);

  const kaydet = useCallback(
    async (sorgu: string, mod: 'metin' | 'gorsel') => {
      const temiz = sorgu.trim();
      if (!temiz) return;
      const key = storageKey(kullaniciAdi);

      setGecmis((onceki) => {
        const filtrelenmis = onceki.filter((k) => k.sorgu.toLowerCase() !== temiz.toLowerCase());
        const yeni: AramaKaydi = {
          id: Date.now().toString(),
          sorgu: temiz,
          mod,
          tarih: new Date().toISOString(),
        };
        const guncel = [yeni, ...filtrelenmis].slice(0, MAX_KAYIT);
        AsyncStorage.setItem(key, JSON.stringify(guncel));
        return guncel;
      });

      if (!token) return;
      fetch(`${BASE_URL}/search-history`, {
        method: 'POST',
        headers: { ...NGROK_HEADER, 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sorgu: temiz, mod, tarih: new Date().toISOString() }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return;
          setGecmis((prev) => {
            const guncel = prev.map((k) =>
              k.sorgu.toLowerCase() === temiz.toLowerCase() && k.mod === mod
                ? { ...k, id: String(data.id) }
                : k,
            );
            AsyncStorage.setItem(key, JSON.stringify(guncel));
            return guncel;
          });
        })
        .catch(() => {});
    },
    [token, kullaniciAdi],
  );

  const kaldir = useCallback(
    async (id: string) => {
      const key = storageKey(kullaniciAdi);
      setGecmis((onceki) => {
        const guncel = onceki.filter((k) => k.id !== id);
        AsyncStorage.setItem(key, JSON.stringify(guncel));
        return guncel;
      });

      if (!token) return;
      const sayisal = Number(id);
      if (!isNaN(sayisal)) {
        fetch(`${BASE_URL}/search-history/${sayisal}`, {
          method: 'DELETE',
          headers: { ...NGROK_HEADER, Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    },
    [token, kullaniciAdi],
  );

  const tumunuSil = useCallback(async () => {
    const key = storageKey(kullaniciAdi);
    setGecmis([]);
    await AsyncStorage.removeItem(key);

    if (!token) return;
    fetch(`${BASE_URL}/search-history`, {
      method: 'DELETE',
      headers: { ...NGROK_HEADER, Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }, [token, kullaniciAdi]);

  const sonBes = gecmis.slice(0, 5).filter((k) => k.mod === 'metin');

  return { gecmis, yukleniyor, sonBes, kaydet, kaldir, tumunuSil };
}

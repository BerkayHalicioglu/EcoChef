import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BASE_URL, favoriYanitMap, NGROK_HEADER, parseHata } from '@/utils/api';

export type FavoriTarif = {
  id: number;
  isim: string;
  gorsel?: string;
  kaydedilmeTarihi: string;
};

type FavoritesState = {
  favoriler: FavoriTarif[];
  yukleniyor: boolean;
  hata: boolean;
  yukle: () => Promise<void>;
  favoriEkle: (tarif: { id?: number; isim: string; gorsel?: string }) => Promise<boolean>;
  favoriKaldir: (tarif: { id?: number }) => Promise<boolean>;
  favoriMi: (tarif: { id?: number }) => boolean;
};

const FavoritesContext = createContext<FavoritesState | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [favoriler, setFavoriler] = useState<FavoriTarif[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(false);

  const yukle = useCallback(async () => {
    if (!token) { setFavoriler([]); setYukleniyor(false); return; }
    setYukleniyor(true);
    setHata(false);
    try {
      const res = await fetch(`${BASE_URL}/favorites`, {
        headers: { ...NGROK_HEADER, Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFavoriler(data.map(favoriYanitMap));
      } else {
        setHata(true);
      }
    } catch {
      setHata(true);
    } finally {
      setYukleniyor(false);
    }
  }, [token]);

  useEffect(() => {
    yukle();
  }, [yukle]);

  const favoriEkle = useCallback(
    async (tarif: { id?: number; isim: string; gorsel?: string }): Promise<boolean> => {
      if (!token || !tarif.id) return false;
      const gecici: FavoriTarif = {
        id: tarif.id,
        isim: tarif.isim,
        gorsel: tarif.gorsel,
        kaydedilmeTarihi: new Date().toISOString(),
      };
      setFavoriler((prev) => [gecici, ...prev.filter((f) => f.id !== tarif.id)]);
      try {
        const res = await fetch(`${BASE_URL}/favorites`, {
          method: 'POST',
          headers: { ...NGROK_HEADER, 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            recipe_id: tarif.id,
            recipe_isim: tarif.isim,
            recipe_gorsel: tarif.gorsel ?? null,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const yeni = favoriYanitMap(data);
          setFavoriler((prev) => [yeni, ...prev.filter((f) => f.id !== yeni.id)]);
          return true;
        }
        await parseHata(res, '');
        setFavoriler((prev) => prev.filter((f) => f.id !== tarif.id));
        return false;
      } catch {
        setFavoriler((prev) => prev.filter((f) => f.id !== tarif.id));
        return false;
      }
    },
    [token],
  );

  const favoriKaldir = useCallback(
    async (tarif: { id?: number }): Promise<boolean> => {
      if (!token || !tarif.id) return false;
      const onceki = favoriler.find((f) => f.id === tarif.id);
      setFavoriler((prev) => prev.filter((f) => f.id !== tarif.id));
      try {
        const res = await fetch(`${BASE_URL}/favorites/${tarif.id}`, {
          method: 'DELETE',
          headers: { ...NGROK_HEADER, Authorization: `Bearer ${token}` },
        });
        if (res.ok) return true;
        if (onceki) setFavoriler((prev) => [...prev, onceki].sort((a, b) => b.kaydedilmeTarihi.localeCompare(a.kaydedilmeTarihi)));
        return false;
      } catch {
        if (onceki) setFavoriler((prev) => [...prev, onceki].sort((a, b) => b.kaydedilmeTarihi.localeCompare(a.kaydedilmeTarihi)));
        return false;
      }
    },
    [token, favoriler],
  );

  const favoriMi = useCallback(
    (tarif: { id?: number }): boolean => {
      if (!tarif.id) return false;
      return favoriler.some((f) => f.id === tarif.id);
    },
    [favoriler],
  );

  return (
    <FavoritesContext.Provider value={{ favoriler, yukleniyor, hata, yukle, favoriEkle, favoriKaldir, favoriMi }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavoritesContext must be used within FavoritesProvider');
  return ctx;
}

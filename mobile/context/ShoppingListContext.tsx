import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export type AlisverisMalzeme = {
  isim: string;
  tamamlandi: boolean;
  eklenmeTarihi: string;
};

type ShoppingListState = {
  liste: AlisverisMalzeme[];
  ekle: (malzemeler: string[]) => void;
  tamamlaToggle: (isim: string) => void;
  kaldir: (isim: string) => void;
  duzenle: (eskiIsim: string, yeniIsim: string) => void;
  tamamlananlarisil: () => void;
  tumunuSil: () => void;
  bekleyenSayisi: number;
};

// Her kullanıcı kendi listesini görür; misafir ayrı bir liste kullanır
const storageKey = (kullaniciAdi: string | null) =>
  `ecochef_alisveris_${kullaniciAdi ?? 'misafir'}`;

const ShoppingListContext = createContext<ShoppingListState | null>(null);

export function ShoppingListProvider({ children }: { children: React.ReactNode }) {
  const { kullaniciAdi } = useAuth();
  const [liste, setListe] = useState<AlisverisMalzeme[]>([]);

  // Kullanıcı değiştiğinde o kullanıcının listesini yükle
  useEffect(() => {
    setListe([]);
    AsyncStorage.getItem(storageKey(kullaniciAdi)).then((json) => {
      if (json) setListe(JSON.parse(json));
    });
  }, [kullaniciAdi]);

  const kaydet = useCallback(
    async (guncel: AlisverisMalzeme[]) => {
      setListe(guncel);
      await AsyncStorage.setItem(storageKey(kullaniciAdi), JSON.stringify(guncel));
    },
    [kullaniciAdi],
  );

  const ekle = useCallback(
    (malzemeler: string[]) => {
      setListe((onceki) => {
        const mevcutlar = new Set(onceki.map((m) => m.isim.toLowerCase()));
        const yeniler = malzemeler
          .filter((m) => !mevcutlar.has(m.toLowerCase()))
          .map((m) => ({ isim: m, tamamlandi: false, eklenmeTarihi: new Date().toISOString() }));
        if (yeniler.length === 0) return onceki;
        const guncel = [...onceki, ...yeniler];
        AsyncStorage.setItem(storageKey(kullaniciAdi), JSON.stringify(guncel));
        return guncel;
      });
    },
    [kullaniciAdi],
  );

  const tamamlaToggle = useCallback(
    (isim: string) => {
      setListe((onceki) => {
        const guncel = onceki.map((m) =>
          m.isim === isim ? { ...m, tamamlandi: !m.tamamlandi } : m,
        );
        AsyncStorage.setItem(storageKey(kullaniciAdi), JSON.stringify(guncel));
        return guncel;
      });
    },
    [kullaniciAdi],
  );

  const duzenle = useCallback(
    (eskiIsim: string, yeniIsim: string) => {
      const temiz = yeniIsim.trim();
      if (!temiz || temiz === eskiIsim) return;
      setListe((onceki) => {
        if (onceki.some((m) => m.isim.toLowerCase() === temiz.toLowerCase() && m.isim !== eskiIsim))
          return onceki;
        const guncel = onceki.map((m) => (m.isim === eskiIsim ? { ...m, isim: temiz } : m));
        AsyncStorage.setItem(storageKey(kullaniciAdi), JSON.stringify(guncel));
        return guncel;
      });
    },
    [kullaniciAdi],
  );

  const kaldir = useCallback(
    (isim: string) => {
      setListe((onceki) => {
        const guncel = onceki.filter((m) => m.isim !== isim);
        AsyncStorage.setItem(storageKey(kullaniciAdi), JSON.stringify(guncel));
        return guncel;
      });
    },
    [kullaniciAdi],
  );

  const tamamlananlarisil = useCallback(() => {
    setListe((onceki) => {
      const guncel = onceki.filter((m) => !m.tamamlandi);
      AsyncStorage.setItem(storageKey(kullaniciAdi), JSON.stringify(guncel));
      return guncel;
    });
  }, [kullaniciAdi]);

  const tumunuSil = useCallback(() => kaydet([]), [kaydet]);

  const bekleyenSayisi = liste.filter((m) => !m.tamamlandi).length;

  return (
    <ShoppingListContext.Provider
      value={{ liste, ekle, tamamlaToggle, kaldir, duzenle, tamamlananlarisil, tumunuSil, bekleyenSayisi }}
    >
      {children}
    </ShoppingListContext.Provider>
  );
}

export function useShoppingListContext() {
  const ctx = useContext(ShoppingListContext);
  if (!ctx) throw new Error('useShoppingListContext must be used within ShoppingListProvider');
  return ctx;
}

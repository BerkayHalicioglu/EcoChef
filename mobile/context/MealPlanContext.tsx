import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ogunBildirimiZamanla } from '@/hooks/use-notifications';
import { BASE_URL, NGROK_HEADER, planYanitMap } from '@/utils/api';

export type OgunTipi = 'kahvalti' | 'ogle' | 'aksam';

export type PlanItem = {
  id: number;
  tarih: string;
  ogun: OgunTipi;
  recipe_id?: number;
  recipe_isim: string;
  recipe_gorsel?: string;
};

type MealPlanState = {
  plan: PlanItem[];
  yukle: (hafta_basi: string) => Promise<void>;
  planEkle: (params: {
    tarih: string;
    ogun: OgunTipi;
    recipe_id?: number;
    recipe_isim: string;
    recipe_gorsel?: string;
  }) => Promise<PlanItem | null>;
  planKaldir: (id: number) => Promise<void>;
};

function cacheKey(kullaniciAdi: string, hafta_basi: string) {
  return `ecochef_plan_${kullaniciAdi}_${hafta_basi}`;
}

const MealPlanContext = createContext<MealPlanState | null>(null);

export function MealPlanProvider({ children }: { children: React.ReactNode }) {
  const { token, kullaniciAdi } = useAuth();
  const [plan, setPlan] = useState<PlanItem[]>([]);

  const yukle = useCallback(
    async (hafta_basi: string) => {
      if (!token || !kullaniciAdi) { setPlan([]); return; }

      const key = cacheKey(kullaniciAdi, hafta_basi);
      const cached = await AsyncStorage.getItem(key);
      if (cached) setPlan(JSON.parse(cached));

      try {
        const res = await fetch(
          `${BASE_URL}/meal-plan?hafta_basi=${hafta_basi}`,
          { headers: { ...NGROK_HEADER, Authorization: `Bearer ${token}` } },
        );
        if (res.ok) {
          const data = await res.json();
          const parsed: PlanItem[] = data.map(planYanitMap);
          setPlan(parsed);
          await AsyncStorage.setItem(key, JSON.stringify(parsed));
        }
      } catch {
        // Ağ yoksa cache'den devam
      }
    },
    [token, kullaniciAdi],
  );

  const planEkle = useCallback(
    async (params: {
      tarih: string;
      ogun: OgunTipi;
      recipe_id?: number;
      recipe_isim: string;
      recipe_gorsel?: string;
    }): Promise<PlanItem | null> => {
      if (!token || !kullaniciAdi) return null;

      // Optimistik güncelleme
      const gecici: PlanItem = {
        id: -Date.now(),
        tarih: params.tarih,
        ogun: params.ogun,
        recipe_id: params.recipe_id,
        recipe_isim: params.recipe_isim,
        recipe_gorsel: params.recipe_gorsel,
      };
      setPlan((prev) => [
        ...prev.filter((p) => !(p.tarih === params.tarih && p.ogun === params.ogun)),
        gecici,
      ]);

      try {
        const res = await fetch(`${BASE_URL}/meal-plan`, {
          method: 'POST',
          headers: { ...NGROK_HEADER, 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            ...params,
            recipe_id: params.recipe_id ?? null,
            recipe_gorsel: params.recipe_gorsel ?? null,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const yeni: PlanItem = planYanitMap(data);
          setPlan((prev) => {
            const guncel = [
              ...prev.filter((p) => p.id !== gecici.id && !(p.tarih === params.tarih && p.ogun === params.ogun)),
              yeni,
            ];
            // Hafta başını params.tarih'ten hesapla ve cache'i güncelle
            const d = new Date(params.tarih);
            const gun = d.getDay();
            const fark = gun === 0 ? -6 : 1 - gun;
            d.setDate(d.getDate() + fark);
            const hb = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            AsyncStorage.setItem(cacheKey(kullaniciAdi, hb), JSON.stringify(guncel));
            return guncel;
          });
          ogunBildirimiZamanla(yeni.tarih, yeni.ogun, yeni.recipe_isim).catch(() => {});
          return yeni;
        }
      } catch {}

      // Başarısız — optimistik güncellemeyi geri al
      setPlan((prev) => prev.filter((p) => p.id !== gecici.id));
      return null;
    },
    [token, kullaniciAdi],
  );

  const planKaldir = useCallback(
    async (id: number) => {
      if (!token || !kullaniciAdi) return;
      setPlan((prev) => prev.filter((p) => p.id !== id));
      try {
        await fetch(`${BASE_URL}/meal-plan/${id}`, {
          method: 'DELETE',
          headers: { ...NGROK_HEADER, Authorization: `Bearer ${token}` },
        });
      } catch {}
    },
    [token, kullaniciAdi],
  );

  return (
    <MealPlanContext.Provider value={{ plan, yukle, planEkle, planKaldir }}>
      {children}
    </MealPlanContext.Provider>
  );
}

export function useMealPlanContext() {
  const ctx = useContext(MealPlanContext);
  if (!ctx) throw new Error('useMealPlanContext must be used within MealPlanProvider');
  return ctx;
}

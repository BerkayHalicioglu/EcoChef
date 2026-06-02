import { useCallback, useEffect, useState } from 'react';
import { useSearchHistory } from './use-search-history';
import { useLocale } from '@/context/I18nContext';
import { BASE_URL, langHeaders, NGROK_HEADER } from '@/utils/api';

// Türkçe arama sorgularında anlamsız olan yaygın kelimeler
const STOP_WORDS = new Set([
  've', 'ile', 'bir', 'bu', 'de', 'da', 'ne', 'var', 'yok', 'için',
  'gibi', 'kadar', 'daha', 'çok', 'az', 'ben', 'sen', 've', 'ama',
  'fakat', 'ancak', 'sadece', 'hem', 'ya', 'veya', 'bazı',
]);

export type KisiselOneri = {
  isim: string;
  neden?: string;
  id?: number;
  gorsel?: string;
};

function topMalzemeleriCikar(aramalar: string[], topN = 4): string[] {
  const frekans: Record<string, number> = {};

  for (const sorgu of aramalar) {
    // Virgül veya boşlukla ayır, temizle
    const kelimeler = sorgu
      .toLowerCase()
      .split(/[,،\s]+/)
      .map((k) => k.trim().replace(/[^a-züğışöçÜĞİŞÖÇ]/gi, ''))
      .filter((k) => k.length >= 3 && !STOP_WORDS.has(k));

    for (const kelime of kelimeler) {
      frekans[kelime] = (frekans[kelime] ?? 0) + 1;
    }
  }

  return Object.entries(frekans)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([kelime]) => kelime);
}

export function usePersonalizedSuggestions() {
  const { gecmis } = useSearchHistory();
  const { locale } = useLocale();
  const [oneriler, setOneriler] = useState<KisiselOneri[]>([]);
  const [topMalzemeler, setTopMalzemeler] = useState<string[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [yuklendiMi, setYuklendiMi] = useState(false);

  const metinGecmisi = gecmis.filter((k) => k.mod === 'metin').map((k) => k.sorgu);

  const yenile = useCallback(async () => {
    if (metinGecmisi.length < 2) return; // En az 2 arama olsun
    const top = topMalzemeleriCikar(metinGecmisi);
    if (top.length === 0) return;

    setTopMalzemeler(top);
    setYukleniyor(true);

    try {
      const res = await fetch(`${BASE_URL}/analyze-text-ingredients/`, {
        method: 'POST',
        headers: { ...NGROK_HEADER, ...langHeaders(locale), 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: top.join(', ') }),
      });
      if (res.ok) {
        const data = await res.json();
        setOneriler(data.sonuclar ?? []);
      }
    } catch {
      // Sessizce başarısız ol — ağ yoksa boş kalır
    } finally {
      setYukleniyor(false);
      setYuklendiMi(true);
    }
  }, [metinGecmisi.join(',')]);

  useEffect(() => {
    if (!yuklendiMi && metinGecmisi.length >= 2) {
      yenile();
    }
  }, [metinGecmisi.length]);

  return { oneriler, topMalzemeler, yukleniyor, yenile };
}

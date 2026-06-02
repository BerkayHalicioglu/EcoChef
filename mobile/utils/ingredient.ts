// Türkçe ve İngilizce ölçü birimlerini ve miktarları malzeme adından temizler.
// "3/4 bardak su" → "su", "2 yemek kaşığı zeytinyağı" → "zeytinyağı"
const BIRIMLER = [
  // Türkçe çok kelimeli (önce kontrol edilmeli)
  'yemek kaşığı', 'çay kaşığı', 'tatlı kaşığı', 'çay bardağı',
  'su bardağı', 'ölçü kaşığı',
  // İngilizce çok kelimeli
  'table spoon', 'tea spoon', 'fluid ounce', 'fl oz',
  // Türkçe tek kelimeli
  'bardak', 'kilo', 'gram', 'kilogram', 'litre', 'mililitre',
  'adet', 'demet', 'tutam', 'dilim', 'paket', 'kutu', 'şişe',
  'diş', 'dal', 'yaprak', 'çimdik', 'avuç', 'porsiyon', 'kase',
  'küçük', 'büyük', 'orta', 'iri', 'tane', 'parça', 'dilim',
  'fincankayık', 'fincan',
  // İngilizce kısaltmalar / kelimeler
  'tbsp', 'tsp', 'cup', 'cups', 'oz', 'lb', 'lbs',
  'ml', 'cl', 'dl', 'lt', 'kg', 'gr', 'g',
  'large', 'medium', 'small', 'whole', 'fresh', 'dried',
  'slice', 'slices', 'clove', 'cloves', 'bunch', 'pinch',
  'piece', 'pieces', 'can', 'package', 'bag',
];

export function malzemeAdiniCikar(malzeme: string): string {
  let s = malzeme.trim();

  // Parantez içini kaldır: "(isteğe bağlı)", "(doğranmış)" vb.
  s = s.replace(/\(.*?\)/g, '').trim();

  // Başındaki sayıyı kaldır: "3/4", "1.5", "2-3", "½", "¼", "¾" vb.
  s = s.replace(/^[\d\s\.\,\/\-]+/, '').trim();
  s = s.replace(/^[½¼¾⅓⅔⅛⅜⅝⅞]\s*/, '').trim();

  // Birimleri uzundan kısaya kontrol et
  const sorted = [...BIRIMLER].sort((a, b) => b.length - a.length);
  for (const birim of sorted) {
    const pattern = new RegExp(`^${birim.replace(/\s+/g, '\\s+')}[\\s,]+`, 'i');
    const sonuc = s.replace(pattern, '').trim();
    if (sonuc) { s = sonuc; break; }
  }

  // Hâlâ başında sıfat varsa (küçük/büyük geçtiyse tekrar dene)
  s = s.replace(/^(küçük|büyük|orta|iri|taze|kuru|az)\s+/i, '').trim();

  return s || malzeme; // parse başarısız olursa orijinali döndür
}

export function malzemeleriTemizle(malzemeler: string[]): string[] {
  const sonuclar = malzemeler.map(malzemeAdiniCikar);
  // Duplicate'leri kaldır (büyük/küçük harf duyarsız)
  const gorulenler = new Set<string>();
  return sonuclar.filter((m) => {
    const kucuk = m.toLowerCase();
    if (gorulenler.has(kucuk)) return false;
    gorulenler.add(kucuk);
    return true;
  });
}

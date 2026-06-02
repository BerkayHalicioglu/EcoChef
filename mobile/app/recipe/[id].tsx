import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AnimatedButton } from '@/components/AnimatedButton';
import { GlassCard } from '@/components/GlassCard';
import { GlassScreen } from '@/components/GlassScreen';
import { Toast } from '@/components/Toast';
import { useGlass } from '@/context/GlassContext';
import { useLocale } from '@/context/I18nContext';
import { type GlassTokens } from '@/constants/glass';
import { langHeaders } from '@/utils/api';
import { PlanEkleModal } from '@/components/PlanEkleModal';
import { useAuth } from '@/context/AuthContext';
import { useMealPlan } from '@/hooks/use-meal-plan';
import { useRecipeCache } from '@/hooks/use-recipe-cache';
import { useShoppingList } from '@/hooks/use-shopping-list';
import { useToast } from '@/hooks/use-toast';
import { useFavorites } from '@/hooks/use-favorites';
import { malzemeleriTemizle } from '@/utils/ingredient';
import Feather from '@expo/vector-icons/Feather';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
const NGROK_HEADER = { 'ngrok-skip-browser-warning': '1' };

type RecipeStep = { numara: number; aciklama: string };
type BeslenmeBilgisi = { kalori?: number; protein_g?: number; karbonhidrat_g?: number; yag_g?: number };
type RecipeDetail = {
  id: number; isim: string; gorsel: string | null; sure_dakika: number | null;
  porsiyon: number | null; malzemeler: string[]; adimlar: RecipeStep[]; beslenme?: BeslenmeBilgisi | null;
};

export default function RecipeDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const G = useGlass();
  const styles = useMemo(() => makeStyles(G), [G]);

  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const isim = Array.isArray(params.isim) ? params.isim[0] : params.isim;
  const gorsel = Array.isArray(params.gorsel) ? params.gorsel[0] : params.gorsel;
  const kaynak = Array.isArray(params.kaynak) ? params.kaynak[0] : (params.kaynak ?? 'spoonacular');

  const { locale, t } = useLocale();
  const { kullaniciAdi, token } = useAuth();
  const { planEkle } = useMealPlan();
  const { ekle: alisverisEkle } = useShoppingList();
  const { favoriMi, favoriEkle, favoriKaldir } = useFavorites();
  const { toast, goster } = useToast();

  const tarifId = id ? Number(id) : undefined;
  const favori = favoriMi({ id: tarifId });

  const favoriToggle = async () => {
    if (!token) { goster(t('recipe.loginForFav'), 'bilgi'); return; }
    if (favori) {
      await favoriKaldir({ id: tarifId });
    } else {
      await favoriEkle({ id: tarifId, isim: detay?.isim ?? isim ?? '', gorsel: detay?.gorsel ?? gorsel });
    }
  };
  const { detayGetir, detayKaydet } = useRecipeCache();
  const [detay, setDetay] = useState<RecipeDetail | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gorselYuklendi, setGorselYuklendi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [planModalGorunur, setPlanModalGorunur] = useState(false);
  const [onbellekten, setOnbellekten] = useState(false);
  const [kullaniciPuani, setKullaniciPuani] = useState<number | null>(null);
  const [ortalamaPuan, setOrtalamaPuan] = useState<number | null>(null);
  const [puanAdet, setPuanAdet] = useState(0);
  const [puanYukleniyor, setPuanYukleniyor] = useState(false);

  const tarifYukle = () => {
    if (!id) return;
    const cached = detayGetir(Number(id), locale);
    if (cached) { setDetay(cached as RecipeDetail); setYukleniyor(false); setOnbellekten(true); return; }
    setYukleniyor(true);
    setHata(null);
    const endpoint = kaynak === 'themealdb'
      ? `${BASE_URL}/recipes/meal/${id}`
      : `${BASE_URL}/recipes/${id}`;
    fetch(endpoint, { headers: { ...NGROK_HEADER, ...langHeaders(locale) } })
      .then(r => r.json())
      .then(data => { setDetay(data); detayKaydet(data, locale); })
      .catch(() => setHata(t('recipe.loadError')))
      .finally(() => setYukleniyor(false));
  };

  useEffect(() => { tarifYukle(); }, [id, locale]);

  const gorselUrl = detay?.gorsel ?? (gorsel || null);

  // Puan yükle — TheMealDB tarifleri için rating yok
  useEffect(() => {
    if (!id || kaynak === 'themealdb') return;
    const headers: Record<string, string> = { ...NGROK_HEADER, ...langHeaders(locale) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch(`${BASE_URL}/ratings/${id}`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setOrtalamaPuan(data.ortalama);
          setPuanAdet(data.adet);
          setKullaniciPuani(data.kullanici_puani ?? null);
        }
      })
      .catch(() => {});
  }, [id, token]);

  const puanVer = async (puan: number) => {
    if (!kullaniciAdi || !token) { goster(t('recipe.loginForRating'), 'bilgi'); return; }
    if (!id || !detay) return;
    setPuanYukleniyor(true);
    setKullaniciPuani(puan);
    try {
      const res = await fetch(`${BASE_URL}/ratings`, {
        method: 'POST',
        headers: { ...NGROK_HEADER, 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipe_id: Number(id), recipe_isim: detay.isim, puan }),
      });
      if (res.ok) {
        goster(t('recipe.ratingSaved'), 'basari');
        fetch(`${BASE_URL}/ratings/${id}`, { headers: { ...NGROK_HEADER, ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
          .then(r => r.json())
          .then(d => { setOrtalamaPuan(d.ortalama); setPuanAdet(d.adet); })
          .catch(() => {});
      }
    } catch {
      goster(t('recipe.ratingError'), 'hata');
    } finally {
      setPuanYukleniyor(false);
    }
  };

  const tarifPaylas = async () => {
    const ad = detay?.isim ?? isim ?? 'Tarif';
    const malzemeler = (detay?.malzemeler ?? []).slice(0, 5).join(', ');
    const mesaj = `🍽 ${ad}\n\n${malzemeler ? `Malzemeler: ${malzemeler}${detay?.malzemeler && detay.malzemeler.length > 5 ? ' ve daha fazlası...' : ''}` : ''}\n\nEcoChef ile keşfedildi 🌿`;
    await Share.share({ message: mesaj, title: ad });
  };

  return (
    <GlassScreen>
      <ScrollView contentContainerStyle={styles.icerik}>
        <View style={styles.navSatiri}>
          <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
            <Text style={styles.geriMetin}>{t('common.back')}</Text>
          </TouchableOpacity>
          <View style={styles.navSag}>
            <TouchableOpacity style={styles.favoriButon} onPress={favoriToggle}>
              <Feather name="heart" size={20} color={favori ? '#EF7B6B' : G.textLight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.paylasButon} onPress={tarifPaylas}>
              <Text style={styles.paylasMetin}>{t('recipe.share')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.baslik}>{detay?.isim ?? isim}</Text>

        <View style={styles.gorselKutu}>
          {!gorselYuklendi && (
            <View style={styles.gorselPlaceholder}>
              <Text style={styles.placeholderIkon}>🍽</Text>
            </View>
          )}
          {gorselUrl && (
            <Image
              source={{ uri: gorselUrl }}
              style={[styles.gorsel, !gorselYuklendi && styles.gorselGizli]}
              onLoad={() => setGorselYuklendi(true)}
              onError={() => setGorselYuklendi(true)}
            />
          )}
        </View>

        {yukleniyor && <ActivityIndicator size="large" color={G.primary} style={{ marginTop: 32 }} />}

        {onbellekten && (
          <GlassCard style={styles.onbellekBanner}>
            <Text style={styles.onbellekMetin}>{t('recipe.cached')}</Text>
          </GlassCard>
        )}

        {hata && (
          <View style={styles.hataKutu}>
            <Text style={styles.hataMetin}>{hata}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={tarifYukle}>
              <Text style={styles.retryMetin}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {detay && (() => {
          const malzemeler = detay.malzemeler ?? [];
          const adimlar = detay.adimlar ?? [];
          return (
            <>
              <View style={styles.metaSatiri}>
                {detay.sure_dakika != null && (
                  <GlassCard style={styles.metaKutu}>
                    <Text style={styles.metaIkon}>⏱</Text>
                    <Text style={styles.metaDeger}>{detay.sure_dakika} {t('recipe.minutes')}</Text>
                  </GlassCard>
                )}
                {detay.porsiyon != null && (
                  <GlassCard style={styles.metaKutu}>
                    <Text style={styles.metaIkon}>👤</Text>
                    <Text style={styles.metaDeger}>{detay.porsiyon} {t('recipe.servings')}</Text>
                  </GlassCard>
                )}
                {malzemeler.length > 0 && (
                  <GlassCard style={styles.metaKutu}>
                    <Text style={styles.metaIkon}>🧂</Text>
                    <Text style={styles.metaDeger}>{malzemeler.length} {t('recipe.ingredientCount')}</Text>
                  </GlassCard>
                )}
              </View>

              <View style={styles.aksiyonSatiri}>
                <AnimatedButton
                  style={styles.planButon}
                  onPress={() => {
                    if (!kullaniciAdi) { goster(t('recipe.loginForPlan'), 'bilgi'); return; }
                    setPlanModalGorunur(true);
                  }}
                >
                  <Text style={styles.planButonMetni}>{t('recipe.addToPlan')}</Text>
                </AnimatedButton>
                {(detay?.malzemeler?.length ?? 0) > 0 && (
                  <AnimatedButton
                    style={styles.alisverisButon}
                    onPress={() => {
                      const temizlenmis = malzemeleriTemizle(detay!.malzemeler);
                      alisverisEkle(temizlenmis);
                      goster(t('recipe.addedToShopping', { count: temizlenmis.length }), 'basari');
                    }}
                  >
                    <Text style={styles.alisverisButonMetni}>{t('recipe.addToShopping')}</Text>
                  </AnimatedButton>
                )}
              </View>

              {kaynak !== 'themealdb' && (
                <GlassCard style={styles.puanKutu}>
                  <Text style={styles.puanBaslik}>{t('recipe.rate')}</Text>
                  <View style={styles.yildizSatiri}>
                    {[1, 2, 3, 4, 5].map(y => (
                      <TouchableOpacity key={y} onPress={() => puanVer(y)} disabled={puanYukleniyor}>
                        <Text style={[styles.yildiz, (kullaniciPuani ?? 0) >= y && styles.yildizDolu]}>
                          {(kullaniciPuani ?? 0) >= y ? '★' : '☆'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {ortalamaPuan != null && (
                    <Text style={styles.puanOzet}>
                      {t('recipe.avgRating', { avg: ortalamaPuan.toFixed(1), count: puanAdet })}
                    </Text>
                  )}
                </GlassCard>
              )}

              {detay.beslenme && (
                <GlassCard style={styles.bolum}>
                  <Text style={styles.bolumBaslik}>{t('recipe.nutrition')}</Text>
                  <View style={styles.beslenmeGrid}>
                    {detay.beslenme.kalori != null && (
                      <View style={styles.beslenmeKutu}>
                        <Text style={styles.beslenmeIkon}>🔥</Text>
                        <Text style={styles.beslenmeDeger}>{detay.beslenme.kalori}</Text>
                        <Text style={styles.beslenmeEtiket}>kcal</Text>
                      </View>
                    )}
                    {detay.beslenme.protein_g != null && (
                      <View style={styles.beslenmeKutu}>
                        <Text style={styles.beslenmeIkon}>💪</Text>
                        <Text style={styles.beslenmeDeger}>{detay.beslenme.protein_g}g</Text>
                        <Text style={styles.beslenmeEtiket}>{t('recipe.protein')}</Text>
                      </View>
                    )}
                    {detay.beslenme.karbonhidrat_g != null && (
                      <View style={styles.beslenmeKutu}>
                        <Text style={styles.beslenmeIkon}>🌾</Text>
                        <Text style={styles.beslenmeDeger}>{detay.beslenme.karbonhidrat_g}g</Text>
                        <Text style={styles.beslenmeEtiket}>{t('recipe.carbs')}</Text>
                      </View>
                    )}
                    {detay.beslenme.yag_g != null && (
                      <View style={styles.beslenmeKutu}>
                        <Text style={styles.beslenmeIkon}>🫒</Text>
                        <Text style={styles.beslenmeDeger}>{detay.beslenme.yag_g}g</Text>
                        <Text style={styles.beslenmeEtiket}>{t('recipe.fat')}</Text>
                      </View>
                    )}
                  </View>
                </GlassCard>
              )}

              {malzemeler.length > 0 && (
                <GlassCard style={styles.bolum}>
                  <Text style={styles.bolumBaslik}>{t('recipe.ingredients')}</Text>
                  {malzemeler.map((m, i) => (
                    <View key={i} style={styles.malzemeItem}>
                      <Text style={styles.malzemeNokta}>•</Text>
                      <Text style={styles.malzemeMetin}>{m}</Text>
                    </View>
                  ))}
                </GlassCard>
              )}

              {adimlar.length > 0 ? (
                <GlassCard style={styles.bolum}>
                  <Text style={styles.bolumBaslik}>{t('recipe.steps')}</Text>
                  {adimlar.map((adim, i) => (
                    <View key={i} style={styles.adimKart}>
                      <View style={styles.adimNumaraKutu}>
                        <Text style={styles.adimNumara}>{adim.numara}</Text>
                      </View>
                      <Text style={styles.adimMetin}>{adim.aciklama}</Text>
                    </View>
                  ))}
                </GlassCard>
              ) : (
                <GlassCard style={styles.bolum}>
                  <Text style={styles.adimYok}>{t('recipe.noSteps')}</Text>
                </GlassCard>
              )}
            </>
          );
        })()}
      </ScrollView>

      <PlanEkleModal
        gorunur={planModalGorunur}
        onKapat={() => setPlanModalGorunur(false)}
        onEkle={async (tarih, ogun) => {
          const sonuc = await planEkle({
            tarih, ogun,
            recipe_id: detay?.id ?? (id ? Number(id) : undefined),
            recipe_isim: detay?.isim ?? (isim as string),
            recipe_gorsel: detay?.gorsel ?? (gorsel as string) ?? undefined,
          });
          goster(sonuc ? t('recipe.addedToPlan') : t('recipe.planError'), sonuc ? 'basari' : 'hata');
        }}
      />
      <Toast mesaj={toast.mesaj} tip={toast.tip} gorunur={toast.gorunur} />
    </GlassScreen>
  );
}

function makeStyles(G: GlassTokens) {
  return StyleSheet.create({
    icerik: { padding: 20, paddingBottom: 48 },

    navSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 52, marginBottom: 12 },
    geriButon: {},
    geriMetin: { fontSize: 16, color: G.primary, fontWeight: '600' },
    navSag: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    favoriButon: { width: 36, height: 36, borderRadius: 18, backgroundColor: G.glassGreen, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: G.glassBorder },
    paylasButon: { backgroundColor: G.glassGreen, borderRadius: G.radius.pill, paddingHorizontal: 14, paddingVertical: 7 },
    paylasMetin: { fontSize: 14, color: G.primary, fontWeight: '700' },
    baslik: { fontSize: 24, fontWeight: '800', color: G.textDark, marginBottom: 16, lineHeight: 30 },

    gorselKutu: { width: '100%', height: 220, borderRadius: G.radius.lg, overflow: 'hidden', marginBottom: 16, backgroundColor: G.glassGreen },
    gorsel: { width: '100%', height: '100%', resizeMode: 'cover' },
    gorselGizli: { position: 'absolute', opacity: 0 },
    gorselPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    placeholderIkon: { fontSize: 56 },

    onbellekBanner: { padding: 10, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: G.warning },
    onbellekMetin: { fontSize: 13, color: G.warning, fontWeight: '600' },

    metaSatiri: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    metaKutu: { flex: 1, padding: 12, alignItems: 'center' },
    metaIkon: { fontSize: 20, marginBottom: 4 },
    metaDeger: { fontSize: 13, fontWeight: '600', color: G.textDark, textAlign: 'center' },

    planButonMetni: { color: '#fff', fontSize: 15, fontWeight: '700' },
    bolum: { padding: 16, marginBottom: 14 },
    bolumBaslik: { fontSize: 17, fontWeight: '800', color: G.primary, marginBottom: 12 },

    malzemeItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
    malzemeNokta: { color: G.primary, fontSize: 16, fontWeight: 'bold', lineHeight: 22 },
    malzemeMetin: { fontSize: 14, color: G.textDark, flex: 1, lineHeight: 22 },

    adimKart: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
    adimNumaraKutu: { width: 32, height: 32, borderRadius: 16, backgroundColor: G.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
    adimNumara: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    adimMetin: { flex: 1, fontSize: 14, color: G.textDark, lineHeight: 22 },
    adimYok: { fontSize: 14, color: G.textLight, textAlign: 'center', paddingVertical: 8 },

    hataKutu: { alignItems: 'center', marginTop: 24 },
    hataMetin: { color: G.danger, textAlign: 'center', fontSize: 15, marginBottom: 12 },
    retryBtn: { backgroundColor: G.glassGreen, borderRadius: G.radius.pill, paddingHorizontal: 20, paddingVertical: 8 },
    retryMetin: { fontSize: 13, fontWeight: '700', color: G.primary },

    beslenmeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    beslenmeKutu: { flexBasis: '22%', flexGrow: 1, minWidth: 72, backgroundColor: G.glassGreen, borderRadius: G.radius.md, padding: 10, alignItems: 'center' },
    beslenmeIkon: { fontSize: 20, marginBottom: 4 },
    beslenmeDeger: { fontSize: 14, fontWeight: '700', color: G.textDark },
    beslenmeEtiket: { fontSize: 11, color: G.textLight, marginTop: 2 },

    puanKutu: { padding: 16, marginBottom: 14, alignItems: 'center' },
    puanBaslik: { fontSize: 15, fontWeight: '700', color: G.textDark, marginBottom: 10 },
    yildizSatiri: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    yildiz: { fontSize: 32, color: G.glassGreen },
    yildizDolu: { color: '#F4B942' },
    puanOzet: { fontSize: 13, color: G.textLight, marginTop: 4 },

    aksiyonSatiri: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    planButon: { flex: 1, backgroundColor: G.primary, borderRadius: G.radius.pill, paddingVertical: 13, alignItems: 'center' },
    alisverisButon: { flex: 1, backgroundColor: G.glassGreenStrong, borderRadius: G.radius.pill, paddingVertical: 13, alignItems: 'center' },
    alisverisButonMetni: { color: '#fff', fontSize: 14, fontWeight: '700' },
  });
}

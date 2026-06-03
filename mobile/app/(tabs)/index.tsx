import Feather from '@expo/vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AnimatedButton } from '@/components/AnimatedButton';
import { GlassCard } from '@/components/GlassCard';
import { GlassScreen } from '@/components/GlassScreen';
import { Toast } from '@/components/Toast';
import { RecipeSkeleton } from '@/components/RecipeSkeleton';
import { PlanEkleModal } from '@/components/PlanEkleModal';
import { useGlass } from '@/context/GlassContext';
import { useLocale } from '@/context/I18nContext';
import { type GlassTokens } from '@/constants/glass';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/hooks/use-favorites';
import { useMealPlan } from '@/hooks/use-meal-plan';
import { useRecipeCache } from '@/hooks/use-recipe-cache';
import { useShoppingList } from '@/hooks/use-shopping-list';
import { useToast } from '@/hooks/use-toast';
import { useSearchHistory } from '@/hooks/use-search-history';
import { usePersonalizedSuggestions } from '@/hooks/use-personalized-suggestions';

const DIYET_SECENEKLERI = [
  { labelKey: 'home.diet.all',        deger: null,          ikon: null as string | null },
  { labelKey: 'home.diet.vegetarian', deger: 'vegetarian',  ikon: 'feather' as string | null },
  { labelKey: 'home.diet.vegan',      deger: 'vegan',       ikon: 'heart' as string | null },
  { labelKey: 'home.diet.glutenFree', deger: 'gluten free', ikon: 'slash' as string | null },
];

type BesinFiltre = { labelKey: string; ikon: string; maxCalories?: number; minProtein?: number; maxCarbs?: number };
const BESIN_FILTRELERI: BesinFiltre[] = [
  { labelKey: 'home.filter.lowCalorie',  ikon: 'zap',         maxCalories: 400 },
  { labelKey: 'home.filter.highProtein', ikon: 'trending-up', minProtein: 25 },
  { labelKey: 'home.filter.lowCarb',     ikon: 'minus-circle', maxCarbs: 20 },
  { labelKey: 'home.filter.light',       ikon: 'sun',         maxCalories: 300 },
];

import { agHatasiMesaji, BASE_URL, langHeaders, NGROK_HEADER, parseHata } from '@/utils/api';

type Tarif = {
  id?: number; isim: string; gorsel?: string;
  kullanilan_malzemeler?: string[]; eksik_malzemeler?: string[]; neden?: string;
  beslenme?: { kalori?: number; protein_g?: number; karbonhidrat_g?: number; yag_g?: number } | null;
  kaynak?: string;
};
type GorselSonuc = { tespit_edilen_malzemeler: string[]; bulunan_tarifler: Tarif[] };
type MetinSonuc = { sonuclar: Tarif[] };

function TarifKarti({ tarif, onPress, favoriMi, onFavoriToggle, onEksikEkle, onPlanEkle, styles }: {
  tarif: Tarif; onPress: () => void; favoriMi: boolean;
  onFavoriToggle: () => void; onEksikEkle: (m: string[]) => void;
  onPlanEkle: () => void; styles: ReturnType<typeof makeStyles>;
}) {
  const G = useGlass();
  const [gorselYuklendi, setGorselYuklendi] = useState(false);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.92} style={styles.tarifKartContainer}>
      <GlassCard style={styles.tarifKart}>
        <View style={styles.tarifGorselKutu}>
          {!gorselYuklendi && (
            <View style={styles.tarifPlaceholder}>
              <Feather name="book-open" size={44} color={G.primary} />
            </View>
          )}
          {tarif.gorsel && (
            <Image
              source={{ uri: tarif.gorsel }}
              style={[styles.tarifGorsel, !gorselYuklendi && styles.gorselGizli]}
              onLoad={() => setGorselYuklendi(true)}
              onError={() => setGorselYuklendi(true)}
            />
          )}
          <TouchableOpacity style={styles.favoriButon} onPress={onFavoriToggle}>
            <Feather name="heart" size={18} color={favoriMi ? '#EF7B6B' : G.textLight} />
          </TouchableOpacity>
        </View>

        <View style={styles.tarifIcerik}>
          <Text style={styles.tarifIsim} numberOfLines={2}>{tarif.isim}</Text>
          {tarif.neden && <Text style={styles.tarifNeden} numberOfLines={2}>{tarif.neden}</Text>}

          {tarif.beslenme?.kalori != null && (
            <View style={styles.beslenmeChipSatiri}>
              <View style={styles.beslenmeChip}>
                <Feather name="zap" size={10} color={G.accent} />
                <Text style={styles.beslenmeChipMetni}>{tarif.beslenme.kalori} kcal</Text>
              </View>
              {tarif.beslenme.protein_g != null && (
                <View style={styles.beslenmeChip}>
                  <Feather name="trending-up" size={10} color={G.accent} />
                  <Text style={styles.beslenmeChipMetni}>{tarif.beslenme.protein_g}g</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.tarifAlt}>
            {(tarif.kullanilan_malzemeler ?? []).length > 0 && (
              <View style={styles.malzemeChip}>
                <Feather name="check-circle" size={11} color={G.primary} />
                <Text style={styles.malzemeChipMetni}>{tarif.kullanilan_malzemeler!.length}</Text>
              </View>
            )}
            {(tarif.eksik_malzemeler ?? []).length > 0 && (
              <TouchableOpacity
                style={[styles.malzemeChip, styles.eksikChip]}
                onPress={() => onEksikEkle(tarif.eksik_malzemeler!)}
              >
                <Feather name="shopping-cart" size={11} color={G.accent} />
                <Text style={styles.eksikChipMetni}>{tarif.eksik_malzemeler!.length}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.tarifButonSatiri}>
            <TouchableOpacity style={styles.planEkleBtn} onPress={onPlanEkle}>
              <Feather name="calendar" size={15} color={G.primary} />
            </TouchableOpacity>
            {tarif.id && <Text style={styles.detayLink}>›</Text>}
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const G = useGlass();
  const { t, locale } = useLocale();
  const styles = useMemo(() => makeStyles(G), [G]);
  const { canliMalzemeler } = useLocalSearchParams<{ canliMalzemeler?: string }>();
  const { kullaniciAdi } = useAuth();
  const { favoriEkle, favoriKaldir, favoriMi } = useFavorites();
  const { planEkle } = useMealPlan();
  const { sonGirdi, kaydet: cacheKaydet, detayKaydet } = useRecipeCache();
  const { ekle: alisverisEkle } = useShoppingList();
  const { toast, goster } = useToast();
  const { sonBes, kaydet: gecmisKaydet } = useSearchHistory();
  const { oneriler: kisiselOneriler, topMalzemeler, yukleniyor: kisiselYukleniyor } = usePersonalizedSuggestions();
  const [planModalGorunur, setPlanModalGorunur] = useState(false);
  const [planModalTarif, setPlanModalTarif] = useState<Tarif | null>(null);
  const [secilenGorsel, setSecilenGorsel] = useState<string | null>(null);
  const [kullaniciMetni, setKullaniciMetni] = useState('');
  const [gorselYukleniyor, setGorselYukleniyor] = useState(false);
  const [metinYukleniyor, setMetinYukleniyor] = useState(false);
  const [tespitEdilenMalzemeler, setTespitEdilenMalzemeler] = useState<string[]>([]);
  const [tarifler, setTarifler] = useState<Tarif[]>([]);
  const [mod, setMod] = useState<'gorsel' | 'metin' | null>(null);
  const [onbellek, setOnbellek] = useState(false);
  const [seciliDiyet, setSeciliDiyet] = useState<string | null>(null);
  const [seciliBesin, setSeciliBesin] = useState<BesinFiltre | null>(null);
  const [aktifTab, setAktifTab] = useState<'gorsel' | 'metin'>('metin');
  const islenmisMalzemeler = useRef<string | null>(null);
  const toggleGenislik = useRef(0);
  const slideX = useSharedValue(0);
  const slideStyle = useAnimatedStyle(() => ({ transform: [{ translateX: slideX.value }] }));

  useEffect(() => {
    const metin = typeof canliMalzemeler === 'string' ? canliMalzemeler.trim() : '';
    if (metin && metin !== islenmisMalzemeler.current) {
      islenmisMalzemeler.current = metin;
      setKullaniciMetni(metin);
      setAktifTab('metin');
      metinAnalizEtIle(metin);
    }
  }, [canliMalzemeler]);

  const gorselSec = async (kaynak: 'galeri' | 'kamera') => {
    const izin = kaynak === 'kamera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) { goster(t('home.permissionDenied'), 'hata'); return; }
    const sonuc = kaynak === 'kamera'
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.8 });
    if (!sonuc.canceled) {
      const uri = sonuc.assets[0].uri;
      setSecilenGorsel(uri);
      setTarifler([]);
      setTespitEdilenMalzemeler([]);
      gorselAnalizEtIle(uri);
    }
  };

  const gorselAnalizEtIle = async (uri: string) => {
    setGorselYukleniyor(true); setMod('gorsel'); setOnbellek(false);
    const formData = new FormData();
    formData.append('file', { uri, name: 'malzeme.jpg', type: 'image/jpeg' } as any);
    try {
      const params = new URLSearchParams();
      if (seciliDiyet) params.set('diet', seciliDiyet);
      if (seciliBesin?.maxCalories) params.set('max_calories', String(seciliBesin.maxCalories));
      if (seciliBesin?.minProtein) params.set('min_protein', String(seciliBesin.minProtein));
      if (seciliBesin?.maxCarbs) params.set('max_carbs', String(seciliBesin.maxCarbs));
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${BASE_URL}/detect-ingredients/${query}`, { method: 'POST', body: formData, headers: { ...NGROK_HEADER, ...langHeaders(locale), 'Content-Type': 'multipart/form-data' } });
      if (res.ok) {
        const data: GorselSonuc = await res.json();
        setTespitEdilenMalzemeler(data.tespit_edilen_malzemeler ?? []);
        setTarifler(data.bulunan_tarifler ?? []);
        cacheKaydet({ malzemeler: data.tespit_edilen_malzemeler ?? [], tarifler: data.bulunan_tarifler ?? [], mod: 'gorsel' });
        if ((data.bulunan_tarifler ?? []).length === 0) goster(t('home.noFood'), 'bilgi');
      } else {
        const mesaj = await parseHata(res, 'Görsel analiz başarısız.');
        goster(mesaj, 'hata');
      }
    } catch (err) {
      if (sonGirdi) { setTarifler(sonGirdi.tarifler as Tarif[]); setOnbellek(true); goster('Çevrimdışı — önbellekten gösteriliyor.', 'bilgi'); }
      else goster(agHatasiMesaji(err), 'hata');
    } finally { setGorselYukleniyor(false); }
  };

  const metinAnalizEtIle = async (metin: string) => {
    setMetinYukleniyor(true); setMod('metin'); setTespitEdilenMalzemeler([]); setOnbellek(false);
    try {
      const body: Record<string, unknown> = { text: metin };
      if (seciliDiyet) body.diet = seciliDiyet;
      if (seciliBesin?.maxCalories) body.max_calories = seciliBesin.maxCalories;
      if (seciliBesin?.minProtein) body.min_protein = seciliBesin.minProtein;
      if (seciliBesin?.maxCarbs) body.max_carbs = seciliBesin.maxCarbs;
      const res = await fetch(`${BASE_URL}/analyze-text-ingredients/`, { method: 'POST', headers: { ...NGROK_HEADER, ...langHeaders(locale), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        const data: MetinSonuc = await res.json();
        setTarifler(data.sonuclar ?? []);
        cacheKaydet({ malzemeler: [], tarifler: data.sonuclar ?? [], mod: 'metin' });
        if ((data.sonuclar ?? []).length > 0) gecmisKaydet(metin, 'metin');
        else goster(t('home.noSuggestion'), 'bilgi');
      } else {
        const mesaj = await parseHata(res, 'Analiz başarısız.');
        goster(mesaj, 'hata');
      }
    } catch (err) {
      if (sonGirdi) { setTarifler(sonGirdi.tarifler as Tarif[]); setOnbellek(true); goster('Çevrimdışı — önbellekten gösteriliyor.', 'bilgi'); }
      else goster(agHatasiMesaji(err), 'hata');
    } finally { setMetinYukleniyor(false); }
  };

  const sifirla = () => { setSecilenGorsel(null); setKullaniciMetni(''); setTarifler([]); setTespitEdilenMalzemeler([]); setMod(null); setOnbellek(false); };
  const yukleniyor = gorselYukleniyor || metinYukleniyor;

  return (
    <GlassScreen>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.selamlama}>{t('home.greeting', { name: kullaniciAdi ? `, ${kullaniciAdi}` : '' })}</Text>
            <Text style={styles.altYazi}>{t('home.subtitle')}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile' as any)} style={styles.avatarBtn}>
            <View style={styles.avatarMini}>
              <Text style={styles.avatarMiniMetin}>{kullaniciAdi ? kullaniciAdi.slice(0, 1).toUpperCase() : '?'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Son Aramalar */}
        {sonBes.length > 0 && (
          <View style={styles.sonAramaSatiri}>
            <TouchableOpacity onPress={() => router.push('/search-history' as any)} style={styles.baslikSatiri}>
              <Feather name="clock" size={12} color={G.textLight} />
              <Text style={styles.sonAramaBaslik}>{t('home.recentSearches')}</Text>
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sonAramaChipler}>
              {sonBes.map((k) => (
                <TouchableOpacity
                  key={k.id}
                  style={styles.sonAramaChip}
                  onPress={() => { setKullaniciMetni(k.sorgu); setAktifTab('metin'); metinAnalizEtIle(k.sorgu); }}
                >
                  <Text style={styles.sonAramaChipMetin} numberOfLines={1}>{k.sorgu}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Sizin İçin Öneriler */}
        {(kisiselOneriler.length > 0 || kisiselYukleniyor) && (
          <View style={styles.kisiselKutu}>
            <View style={styles.kisiselBaslikSatiri}>
              <View style={styles.baslikSatiri}>
                <Feather name="star" size={15} color={G.textDark} />
                <Text style={styles.kisiselBaslik}>{t('home.forYou')}</Text>
              </View>
              {topMalzemeler.length > 0 && (
                <Text style={styles.kisiselAlt}>{t('home.basedOn', { items: topMalzemeler.join(', ') })}</Text>
              )}
            </View>
            {kisiselYukleniyor ? (
              <ActivityIndicator color={G.primary} style={{ marginVertical: 12 }} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kisiselChipler}>
                {kisiselOneriler.map((oneri, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.kisiselKart}
                    activeOpacity={0.85}
                    onPress={() => { setKullaniciMetni(oneri.isim); setAktifTab('metin'); metinAnalizEtIle(oneri.isim); }}
                  >
                    <Text style={styles.kisiselKartIsim} numberOfLines={2}>{oneri.isim}</Text>
                    {oneri.neden && <Text style={styles.kisiselKartNeden} numberOfLines={2}>{oneri.neden}</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Analiz Sekmeleri */}
        <GlassCard style={styles.sekmeSarici}>
          <View
            style={styles.sekmeToggle}
            onLayout={(e) => {
              toggleGenislik.current = e.nativeEvent.layout.width;
              slideX.value = aktifTab === 'gorsel' ? toggleGenislik.current / 2 : 0;
            }}
          >
            {/* Kayan arkaplan göstergesi */}
            <Animated.View style={[styles.sekmeIndicator, slideStyle]} />
            {(['metin', 'gorsel'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={styles.sekmeBtn}
                onPress={() => {
                  setAktifTab(tab);
                  slideX.value = withTiming(
                    tab === 'gorsel' ? toggleGenislik.current / 2 : 0,
                    { duration: 220 }
                  );
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Feather
                    name={tab === 'metin' ? 'edit-3' : 'camera'}
                    size={13}
                    color={aktifTab === tab ? '#fff' : G.textMid}
                  />
                  <Text style={[styles.sekmeBtnMetin, aktifTab === tab && { color: '#fff' }]}>
                    {tab === 'metin' ? t('home.textTab') : t('home.imageTab')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {aktifTab === 'metin' ? (
            <View style={styles.sekmeIcerik}>
              <TextInput
                style={styles.input}
                placeholder={t('home.placeholder')}
                placeholderTextColor={G.textLight}
                value={kullaniciMetni}
                onChangeText={setKullaniciMetni}
                multiline
                numberOfLines={3}
              />
              <AnimatedButton
                style={metinYukleniyor ? { ...styles.analizBtn, opacity: 0.6 } : styles.analizBtn}
                onPress={() => kullaniciMetni.trim() && metinAnalizEtIle(kullaniciMetni)}
                disabled={metinYukleniyor || !kullaniciMetni.trim()}
              >
                {metinYukleniyor ? <ActivityIndicator color="#fff" /> : <Text style={styles.analizBtnMetni}>{t('home.analyze')}</Text>}
              </AnimatedButton>
            </View>
          ) : (
            <View style={styles.sekmeIcerik}>
              {secilenGorsel && <Image source={{ uri: secilenGorsel }} style={styles.onizleme} />}
              <View style={styles.ikiliButon}>
                <AnimatedButton style={styles.ikiliBtnSol} onPress={() => gorselSec('galeri')}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="image" size={15} color={G.primary} />
                    <Text style={styles.ikiliBtnMetni}>{t('home.gallery')}</Text>
                  </View>
                </AnimatedButton>
                <AnimatedButton style={styles.ikiliBtnSol} onPress={() => gorselSec('kamera')}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="camera" size={15} color={G.primary} />
                    <Text style={styles.ikiliBtnMetni}>{t('home.camera')}</Text>
                  </View>
                </AnimatedButton>
              </View>
              {gorselYukleniyor && (
                <View style={styles.gorselYukleniyor}>
                  <ActivityIndicator color={G.primary} />
                  <Text style={styles.gorselYukleniyorMetin}>{t('home.scanning')}</Text>
                </View>
              )}
            </View>
          )}
        </GlassCard>

        {/* Diyet Filtreleri */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.diyetScroll} contentContainerStyle={styles.diyetSatiri}>
          {DIYET_SECENEKLERI.map((d) => {
            const aktif = seciliDiyet === d.deger;
            const renk = aktif ? '#fff' : G.textMid;
            return (
              <TouchableOpacity
                key={d.labelKey}
                style={aktif ? { ...styles.diyetChip, ...styles.diyetChipAktif } : styles.diyetChip}
                onPress={() => setSeciliDiyet(d.deger)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  {d.ikon && <Feather name={d.ikon as any} size={12} color={renk} />}
                  <Text style={[styles.diyetChipMetin, { color: renk }]}>{t(d.labelKey)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Besin Değeri Filtreleri */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.diyetScroll} contentContainerStyle={styles.diyetSatiri}>
          {BESIN_FILTRELERI.map((b) => {
            const aktif = seciliBesin?.labelKey === b.labelKey;
            const renk = aktif ? '#fff' : G.accent;
            return (
              <TouchableOpacity
                key={b.labelKey}
                style={aktif ? { ...styles.diyetChip, ...styles.besinChipAktif } : { ...styles.diyetChip, ...styles.besinChip }}
                onPress={() => setSeciliBesin(aktif ? null : b)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Feather name={b.ikon as any} size={12} color={renk} />
                  <Text style={[styles.diyetChipMetin, { color: renk }]}>{t(b.labelKey)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tespit edilen malzemeler */}
        {tespitEdilenMalzemeler.length > 0 && (
          <View style={styles.malzemeKutusu}>
            <View style={styles.baslikSatiri}>
              <Feather name="search" size={16} color={G.textDark} />
              <Text style={styles.bolumBaslik}>{t('home.detected')}</Text>
            </View>
            <View style={styles.chipSatiri}>
              {tespitEdilenMalzemeler.map((m, i) => (
                <View key={i} style={styles.malzemeChipGreen}>
                  <Text style={styles.malzemeChipGreenMetni}>{m}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Yükleniyor */}
        {yukleniyor && <RecipeSkeleton adet={3} />}

        {/* Sonuçlar */}
        {!yukleniyor && tarifler.length > 0 && (
          <View>
            {onbellek && (
              <View style={styles.onbellekBanner}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="wifi-off" size={14} color={G.warning} />
                  <Text style={styles.onbellekMetin}>{t('home.offline')}</Text>
                </View>
              </View>
            )}
            <View style={styles.sonucHeader}>
              <View style={styles.baslikSatiri}>
                <Feather name={mod === 'gorsel' ? 'book-open' : 'zap'} size={16} color={G.textDark} />
                <Text style={styles.bolumBaslik}>{mod === 'gorsel' ? t('home.foundRecipes') : t('home.suggestedRecipes')}</Text>
              </View>
              <TouchableOpacity onPress={sifirla}>
                <Text style={styles.sifirlaLink}>{t('home.clear')}</Text>
              </TouchableOpacity>
            </View>
            {tarifler.map((tarif, i) => (
              <TarifKarti
                key={i}
                tarif={tarif}
                styles={styles}
                onPress={() => tarif.id ? router.push({ pathname: '/recipe/[id]', params: { id: String(tarif.id), isim: tarif.isim, gorsel: tarif.gorsel ?? '', kaynak: tarif.kaynak ?? 'spoonacular' } }) : null}
                favoriMi={favoriMi(tarif)}
                onFavoriToggle={async () => {
                  if (!kullaniciAdi) { goster(t('home.favLoginPrompt'), 'bilgi'); return; }
                  const basarili = favoriMi(tarif)
                    ? await favoriKaldir(tarif)
                    : await favoriEkle({ id: tarif.id, isim: tarif.isim, gorsel: tarif.gorsel });
                  if (!basarili) goster(t('home.favError'), 'hata');
                }}
                onEksikEkle={(malzemeler) => { alisverisEkle(malzemeler); goster(t('home.addedToCart', { count: malzemeler.length }), 'basari'); }}
                onPlanEkle={() => {
                  if (!kullaniciAdi) { goster(t('home.planLoginPrompt'), 'bilgi'); return; }
                  setPlanModalTarif(tarif); setPlanModalGorunur(true);
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {planModalTarif && (
        <PlanEkleModal
          gorunur={planModalGorunur}
          onKapat={() => setPlanModalGorunur(false)}
          onEkle={async (tarih, ogun) => {
            const sonuc = await planEkle({ tarih, ogun, recipe_id: planModalTarif.id, recipe_isim: planModalTarif.isim, recipe_gorsel: planModalTarif.gorsel });
            // Plan eklenince beslenme verisini detail cache'e kaydet — plan ekranı kaloriyi anında görebilsin
            if (sonuc && planModalTarif.id && planModalTarif.beslenme) {
              detayKaydet({
                id: planModalTarif.id,
                isim: planModalTarif.isim,
                gorsel: planModalTarif.gorsel ?? null,
                sure_dakika: null,
                porsiyon: null,
                malzemeler: planModalTarif.kullanilan_malzemeler ?? [],
                adimlar: [],
                beslenme: planModalTarif.beslenme,
              });
            }
            goster(sonuc ? t('home.addedToPlan') : t('home.planError'), sonuc ? 'basari' : 'hata');
          }}
        />
      )}
      <Toast mesaj={toast.mesaj} tip={toast.tip} gorunur={toast.gorunur} />
    </GlassScreen>
  );
}

function makeStyles(G: GlassTokens) {
  return StyleSheet.create({
    container: { padding: 20, paddingTop: 56, paddingBottom: 32 },

    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    selamlama: { fontSize: 22, fontWeight: '800', color: G.textDark },
    altYazi: { fontSize: 13, color: G.textMid, marginTop: 2 },
    avatarBtn: {},
    avatarMini: { width: 42, height: 42, borderRadius: 21, backgroundColor: G.primary, alignItems: 'center', justifyContent: 'center' },
    avatarMiniMetin: { color: '#fff', fontSize: 18, fontWeight: '700' },

    // Sekme toggle
    sekmeSarici: { marginBottom: 14, padding: 4 },
    sekmeToggle: { flexDirection: 'row', backgroundColor: G.bgColor, borderRadius: G.radius.lg, padding: 4, marginBottom: 4, position: 'relative' },
    sekmeIndicator: { position: 'absolute', top: 4, bottom: 4, left: 4, width: '50%', backgroundColor: G.primary, borderRadius: G.radius.md },
    sekmeBtn: { flex: 1, paddingVertical: 10, borderRadius: G.radius.md, alignItems: 'center', zIndex: 1 },
    sekmeBtnMetin: { fontSize: 14, fontWeight: '700', color: G.textMid },
    sekmeIcerik: { padding: 8 },

    // Input
    input: {
      backgroundColor: G.bgColor, borderWidth: 1, borderColor: G.glassBorder,
      borderRadius: G.radius.md, padding: 14, marginBottom: 12,
      minHeight: 80, textAlignVertical: 'top', fontSize: 14, color: G.textDark,
    },
    analizBtn: { backgroundColor: G.primary, borderRadius: G.radius.pill, paddingVertical: 14, alignItems: 'center' },
    analizBtnMetni: { color: '#fff', fontSize: 15, fontWeight: '700' },

    onizleme: { width: '100%', height: 180, borderRadius: G.radius.md, marginBottom: 12, resizeMode: 'cover' },
    ikiliButon: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    ikiliBtnSol: { flex: 1, backgroundColor: G.primaryMuted, borderRadius: G.radius.pill, paddingVertical: 12, alignItems: 'center' },
    ikiliBtnMetni: { color: G.primary, fontSize: 14, fontWeight: '700' },

    // Diyet filtresi
    diyetScroll: { marginBottom: 16 },
    diyetSatiri: { gap: 8, paddingRight: 4 },
    diyetChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: G.radius.pill, backgroundColor: G.glassWhite, borderWidth: 1, borderColor: G.glassBorder },
    diyetChipAktif: { backgroundColor: G.primary, borderColor: G.primary },
    besinChip: { borderColor: G.accent, backgroundColor: G.accentMuted },
    besinChipAktif: { backgroundColor: G.accent, borderColor: G.accent },

    kisiselKutu: { marginBottom: 16 },
    kisiselBaslikSatiri: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 10 },
    kisiselBaslik: { fontSize: 16, fontWeight: '800', color: G.textDark },
    kisiselAlt: { fontSize: 11, color: G.textLight, flex: 1 },
    kisiselChipler: { gap: 10, paddingBottom: 4 },
    kisiselKart: { width: 150, backgroundColor: G.glassWhite, borderRadius: G.radius.md, borderWidth: 1, borderColor: G.glassBorder, padding: 14, shadowColor: G.shadow.color, shadowOffset: G.shadow.offset, shadowOpacity: G.shadow.opacity, shadowRadius: G.shadow.radius, elevation: G.shadow.elevation },
    kisiselKartIsim: { fontSize: 13, fontWeight: '700', color: G.primary, marginBottom: 6 },
    kisiselKartNeden: { fontSize: 11, color: G.textMid, lineHeight: 16 },

    gorselYukleniyor: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 12 },
    gorselYukleniyorMetin: { fontSize: 13, color: G.textMid, fontWeight: '500' },
    beslenmeChipSatiri: { flexDirection: 'row', gap: 6, marginBottom: 6 },
    beslenmeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: G.accentMuted, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
    beslenmeChipMetni: { fontSize: 11, color: G.accent, fontWeight: '600' },

    baslikSatiri: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    sonAramaSatiri: { marginBottom: 12 },
    sonAramaBaslik: { fontSize: 12, color: G.textLight, fontWeight: '600', marginBottom: 8 },
    sonAramaChipler: { gap: 8, paddingBottom: 2 },
    sonAramaChip: { backgroundColor: G.glassWhite, borderWidth: 1, borderColor: G.glassBorder, borderRadius: G.radius.pill, paddingHorizontal: 14, paddingVertical: 7, maxWidth: 180 },
    sonAramaChipMetin: { fontSize: 13, color: G.textDark, fontWeight: '500' },
    diyetChipMetin: { fontSize: 13, color: G.textMid, fontWeight: '600' },

    // Malzeme
    malzemeKutusu: { marginBottom: 16 },
    bolumBaslik: { fontSize: 16, fontWeight: '800', color: G.textDark, marginBottom: 10 },
    chipSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    malzemeChipGreen: { backgroundColor: G.primaryMuted, paddingHorizontal: 12, paddingVertical: 6, borderRadius: G.radius.pill },
    malzemeChipGreenMetni: { color: G.primary, fontSize: 13, fontWeight: '600' },

    // Sonuç header
    sonucHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sifirlaLink: { fontSize: 13, color: G.accent, fontWeight: '700' },
    onbellekBanner: { backgroundColor: '#FFF8E1', borderRadius: G.radius.md, padding: 10, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: G.warning },
    onbellekMetin: { fontSize: 13, color: G.warning, fontWeight: '600' },

    // Tarif kartı
    tarifKartContainer: { marginBottom: 14 },
    tarifKart: { overflow: 'hidden' },
    tarifGorselKutu: { width: '100%', height: 170, backgroundColor: G.glassGreen },
    tarifGorsel: { width: '100%', height: '100%', resizeMode: 'cover' },
    gorselGizli: { position: 'absolute', opacity: 0 },
    tarifPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    favoriButon: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.90)', borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

    tarifIcerik: { padding: 14 },
    tarifIsim: { fontSize: 16, fontWeight: '700', color: G.textDark, marginBottom: 4 },
    tarifNeden: { fontSize: 13, color: G.textMid, marginBottom: 10, lineHeight: 18 },

    tarifAlt: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    malzemeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: G.primaryMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: G.radius.pill },
    malzemeChipMetni: { color: G.primary, fontSize: 12, fontWeight: '600' },
    eksikChip: { backgroundColor: G.accentMuted },
    eksikChipMetni: { color: G.accent, fontSize: 12, fontWeight: '600' },

    tarifButonSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    planEkleBtn: { backgroundColor: G.primaryMuted, paddingHorizontal: 14, paddingVertical: 7, borderRadius: G.radius.pill },
    detayLink: { fontSize: 13, color: G.textMid, fontWeight: '600' },
  });
}

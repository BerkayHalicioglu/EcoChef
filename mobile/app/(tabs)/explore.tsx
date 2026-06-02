import Feather from '@expo/vector-icons/Feather';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { GlassCard } from '@/components/GlassCard';
import { GlassScreen } from '@/components/GlassScreen';
import { AnimatedButton } from '@/components/AnimatedButton';
import { useGlass } from '@/context/GlassContext';
import { useLocale } from '@/context/I18nContext';
import { type GlassTokens } from '@/constants/glass';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/Toast';
import { useFavorites } from '@/hooks/use-favorites';
import { useAuth } from '@/context/AuthContext';

import { LinearGradient } from 'expo-linear-gradient';
import { agHatasiMesaji, BASE_URL, langHeaders, NGROK_HEADER, parseHata } from '@/utils/api';

type DiscoverTarif = {
  id: number;
  isim: string;
  gorsel?: string;
  sure_dakika?: number;
  beslenme?: { kalori?: number; protein_g?: number } | null;
  kaynak?: string; // "spoonacular" | "themealdb"
};

const MUTFAKLAR = [
  { labelKey: 'explore.cuisine.turkish',     deger: 'turkish' },
  { labelKey: 'explore.cuisine.italian',     deger: 'italian' },
  { labelKey: 'explore.cuisine.asian',       deger: 'asian' },
  { labelKey: 'explore.cuisine.mediterranean', deger: 'mediterranean' },
  { labelKey: 'explore.cuisine.mexican',     deger: 'mexican' },
  { labelKey: 'explore.cuisine.french',      deger: 'french' },
  { labelKey: 'explore.cuisine.japanese',    deger: 'japanese' },
  { labelKey: 'explore.cuisine.indian',      deger: 'indian' },
];

function TarifMiniKart({
  tarif,
  styles,
  onPress,
}: {
  tarif: DiscoverTarif;
  styles: ReturnType<typeof makeStyles>;
  onPress: () => void;
}) {
  const G = useGlass();
  const { token } = useAuth();
  const { favoriMi, favoriEkle, favoriKaldir } = useFavorites();
  const { goster } = useToast();
  const [gorselYuklendi, setGorselYuklendi] = useState(false);
  const favori = favoriMi({ id: tarif.id });

  const favoriToggle = async () => {
    if (!token) { goster('Favorilere eklemek için giriş yapın.', 'bilgi'); return; }
    if (favori) {
      await favoriKaldir({ id: tarif.id });
    } else {
      await favoriEkle({ id: tarif.id, isim: tarif.isim, gorsel: tarif.gorsel });
    }
  };

  return (
    <TouchableOpacity style={styles.miniKart} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.miniGorselKutu}>
        <View style={styles.miniPlaceholder}>
          <Feather name="book-open" size={24} color={G.primary} />
        </View>
        {tarif.gorsel && (
          <Image
            source={{ uri: tarif.gorsel }}
            style={[styles.miniGorsel, !gorselYuklendi && { opacity: 0 }]}
            onLoad={() => setGorselYuklendi(true)}
            onError={() => setGorselYuklendi(true)}
          />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.62)']}
          style={styles.miniGradient}
          pointerEvents="none"
        />
        <TouchableOpacity style={styles.miniFavoriButon} onPress={favoriToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="heart" size={16} color={favori ? '#EF7B6B' : 'rgba(255,255,255,0.85)'} />
        </TouchableOpacity>
        <View style={styles.miniMetaOverlay}>
          {tarif.sure_dakika ? (
            <View style={styles.metaBadge}>
              <Feather name="clock" size={9} color="#fff" />
              <Text style={styles.miniMetaOverlayMetin}>{tarif.sure_dakika} dk</Text>
            </View>
          ) : null}
          {tarif.beslenme?.kalori ? (
            <View style={styles.metaBadge}>
              <Feather name="zap" size={9} color="#fff" />
              <Text style={styles.miniMetaOverlayMetin}>{tarif.beslenme.kalori} kcal</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.miniBilgi}>
        <Text style={styles.miniIsim} numberOfLines={2}>{tarif.isim}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function KesfetScreen() {
  const router = useRouter();
  const G = useGlass();
  const { t, locale } = useLocale();
  const styles = useMemo(() => makeStyles(G), [G]);
  const { toast, goster } = useToast();

  const [rastgeleTarifler, setRastgeleTarifler] = useState<DiscoverTarif[]>([]);
  const [rastgeleYukleniyor, setRastgeleYukleniyor] = useState(false);
  const [rastgeleHata, setRastgeleHata] = useState(false);
  const [seciliMutfak, setSeciliMutfak] = useState<string | null>(null);
  const [mutfakTarifler, setMutfakTarifler] = useState<DiscoverTarif[]>([]);
  const [mutfakYukleniyor, setMutfakYukleniyor] = useState(false);
  const [mutfakHata, setMutfakHata] = useState(false);
  const [yenileniyor, setYenileniyor] = useState(false);

  const rastgeleYukle = useCallback(async (sessiz = false) => {
    if (!sessiz) setRastgeleYukleniyor(true);
    setRastgeleHata(false);
    try {
      const res = await fetch(`${BASE_URL}/recipes/random?count=3`, { headers: { ...NGROK_HEADER, ...langHeaders(locale) } });
      if (res.ok) {
        const data = await res.json();
        setRastgeleTarifler(data.tarifler ?? []);
      } else {
        setRastgeleHata(true);
        if (!sessiz) goster(await parseHata(res, 'Tarifler yüklenemedi.'), 'hata');
      }
    } catch (err) {
      setRastgeleHata(true);
      if (!sessiz) goster(agHatasiMesaji(err), 'hata');
    } finally {
      setRastgeleYukleniyor(false);
    }
  }, []);

  const mutfakSec = async (deger: string) => {
    if (seciliMutfak === deger) {
      setSeciliMutfak(null);
      setMutfakTarifler([]);
      setMutfakHata(false);
      return;
    }
    setSeciliMutfak(deger);
    setMutfakTarifler([]);
    setMutfakHata(false);
    setMutfakYukleniyor(true);
    try {
      const res = await fetch(`${BASE_URL}/recipes/discover?cuisine=${deger}&count=6`, { headers: { ...NGROK_HEADER, ...langHeaders(locale) } });
      if (res.ok) {
        const data = await res.json();
        setMutfakTarifler(data.tarifler ?? []);
      } else {
        setMutfakHata(true);
        goster(await parseHata(res, 'Tarifler yüklenemedi.'), 'hata');
      }
    } catch (err) {
      setMutfakHata(true);
      goster(agHatasiMesaji(err), 'hata');
    } finally {
      setMutfakYukleniyor(false);
    }
  };

  const onYenile = async () => {
    setYenileniyor(true);
    await rastgeleYukle(true);
    setYenileniyor(false);
  };

  const tarifDetay = (tarif: DiscoverTarif) => {
    router.push({
      pathname: '/recipe/[id]',
      params: {
        id: String(tarif.id),
        isim: tarif.isim,
        gorsel: tarif.gorsel ?? '',
        kaynak: tarif.kaynak ?? 'spoonacular',
      },
    });
  };

  return (
    <GlassScreen>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={onYenile} tintColor={G.primary} />}
      >
        <Text style={styles.baslik}>{t('explore.title')}</Text>
        <Text style={styles.altBaslik}>{t('explore.subtitle')}</Text>

        {/* Canlı Tarama butonu */}
        <AnimatedButton
          style={styles.scanButon}
          onPress={() => {
            Alert.alert(
              'Canlı Tarama Hakkında',
              'En iyi sonuç için malzemelerinizi iyi aydınlatılmış bir ortamda, kameraya yakın ve net şekilde gösterin.\n\nKaranlık veya bulanık görüntülerde tanıma zorlaşabilir.',
              [
                { text: 'İptal', style: 'cancel' },
                { text: 'Tamam, Başlat', onPress: () => router.push('/live-scan' as any) },
              ],
            );
          }}
        >
          <Feather name="camera" size={18} color="#fff" />
          <Text style={styles.scanButonMetni}>{t('explore.liveScan')}</Text>
        </AnimatedButton>

        {/* Hibrit Mod (Çevrimdışı) */}
        <TouchableOpacity
          style={styles.offlineButon}
          activeOpacity={0.85}
          onPress={() => router.push('/hybrid' as any)}
        >
          <View style={styles.offlineIc}>
            <Feather name="wifi-off" size={22} color={G.textDark} />
            <View>
              <Text style={styles.offlineBaslik}>{t('explore.hybridMode')}</Text>
              <Text style={styles.offlineAlt}>{t('explore.hybridDesc')}</Text>
            </View>
            <Text style={styles.offlineOk}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Rastgele Tarifler */}
        <View style={styles.bolumBaslikSatir}>
          <Text style={styles.bolumBaslik}>{t('explore.randomRecipes')}</Text>
          <TouchableOpacity
            style={styles.yenileBtn}
            onPress={() => rastgeleYukle()}
            disabled={rastgeleYukleniyor}
          >
            <Text style={styles.yenileBtnMetin}>{rastgeleYukleniyor ? '...' : t('common.refresh')}</Text>
          </TouchableOpacity>
        </View>

        {rastgeleYukleniyor ? (
          <ActivityIndicator color={G.primary} style={styles.yukleniyorSpinner} />
        ) : rastgeleHata ? (
          <GlassCard style={styles.bosKart}>
            <Text style={styles.bosMetin}>{t('explore.loadError')}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => rastgeleYukle()}>
              <Text style={styles.retryMetin}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : rastgeleTarifler.length === 0 ? (
          <GlassCard style={styles.bosKart}>
            <Text style={styles.bosMetin}>{t('explore.refreshHint')}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => rastgeleYukle()}>
              <Text style={styles.retryMetin}>{t('common.refresh')}</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          rastgeleTarifler.map((t) => (
            <TarifMiniKart key={t.id} tarif={t} styles={styles} onPress={() => tarifDetay(t)} />
          ))
        )}

        {/* Mutfak Kategorileri */}
        <Text style={[styles.bolumBaslik, { marginTop: 24, marginBottom: 12 }]}>{t('explore.kitchenTypes')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mutfakSatir}>
          {MUTFAKLAR.map((m) => {
            const aktif = seciliMutfak === m.deger;
            return aktif ? (
              <LinearGradient
                key={m.deger}
                colors={[G.primary, G.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.mutfakChip, styles.mutfakChipAktif]}
              >
                <TouchableOpacity onPress={() => mutfakSec(m.deger)}>
                  <Text style={[styles.mutfakMetin, { color: '#fff' }]}>{t(m.labelKey)}</Text>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <TouchableOpacity
                key={m.deger}
                style={styles.mutfakChip}
                onPress={() => mutfakSec(m.deger)}
              >
                <Text style={styles.mutfakMetin}>{t(m.labelKey)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {mutfakYukleniyor && (
          <ActivityIndicator color={G.primary} style={styles.yukleniyorSpinner} />
        )}

        {!mutfakYukleniyor && mutfakTarifler.length > 0 && (
          <View style={styles.mutfakTarifler}>
            {mutfakTarifler.map((t) => (
              <TarifMiniKart key={t.id} tarif={t} styles={styles} onPress={() => tarifDetay(t)} />
            ))}
          </View>
        )}

        {!mutfakYukleniyor && seciliMutfak && mutfakHata && (
          <GlassCard style={styles.bosKart}>
            <Text style={styles.bosMetin}>{t('explore.loadError')}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => mutfakSec(seciliMutfak)}>
              <Text style={styles.retryMetin}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {!mutfakYukleniyor && seciliMutfak && !mutfakHata && mutfakTarifler.length === 0 && (
          <GlassCard style={styles.bosKart}>
            <Text style={styles.bosMetin}>{t('explore.noResult')}</Text>
          </GlassCard>
        )}

      </ScrollView>
      <Toast mesaj={toast.mesaj} tip={toast.tip} gorunur={toast.gorunur} />
    </GlassScreen>
  );
}

function makeStyles(G: GlassTokens) {
  return StyleSheet.create({
    container: { padding: 20, paddingTop: 60, paddingBottom: 48 },

    baslik: { fontSize: 32, fontWeight: '800', color: G.primary, marginBottom: 4 },
    altBaslik: { fontSize: 13, color: G.textMid, marginBottom: 20 },

    scanButon: {
      backgroundColor: G.primary,
      borderRadius: G.radius.pill,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 12,
    },
    scanButonMetni: { color: '#fff', fontSize: 15, fontWeight: '700' },

    offlineButon: {
      backgroundColor: G.glassGreen,
      borderRadius: G.radius.md,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: G.glassBorder,
    },
    offlineIc: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    offlineIkon: {},
    offlineBaslik: { fontSize: 14, fontWeight: '700', color: G.textDark },
    offlineAlt: { fontSize: 12, color: G.textLight, marginTop: 1 },
    offlineOk: { fontSize: 22, color: G.textLight, marginLeft: 'auto' },

    bolumBaslikSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    bolumBaslik: { fontSize: 17, fontWeight: '800', color: G.textDark },
    yenileBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: G.glassGreen, borderRadius: G.radius.pill },
    yenileBtnMetin: { fontSize: 13, fontWeight: '700', color: G.primary },

    yukleniyorSpinner: { marginVertical: 20 },

    bosKart: { padding: 24, alignItems: 'center' },
    bosMetin: { fontSize: 14, color: G.textLight, textAlign: 'center' },

    miniKart: {
      flexDirection: 'row',
      backgroundColor: G.glassWhite,
      borderRadius: G.radius.md,
      borderWidth: 1,
      borderColor: G.glassBorder,
      overflow: 'hidden',
      marginBottom: 10,
    },
    miniGorselKutu: { width: 100, height: 100, position: 'relative' },
    miniFavoriButon: { position: 'absolute', top: 6, right: 6, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 12, padding: 5 },
    miniGorsel: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode: 'cover' },
    miniPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: G.glassGreen },
    miniGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 44 },
    miniMetaOverlay: { position: 'absolute', bottom: 4, left: 4, right: 4, flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    miniMetaOverlayMetin: { fontSize: 10, color: '#fff', fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
    kaynakRozet: { position: 'absolute', top: 6, left: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    kaynakRozetMetin: { fontSize: 9, color: '#fff', fontWeight: '800' },
    miniBilgi: { flex: 1, padding: 12, justifyContent: 'center' },
    miniIsim: { fontSize: 14, fontWeight: '700', color: G.textDark, lineHeight: 20 },

    mutfakSatir: { gap: 8, paddingBottom: 4 },
    mutfakChip: {
      paddingHorizontal: 14, paddingVertical: 9,
      borderRadius: G.radius.pill,
      borderWidth: 1.5, borderColor: G.glassBorder,
      backgroundColor: G.glassGreen,
    },
    mutfakChipAktif: { backgroundColor: G.primary, borderColor: G.primary },
    mutfakMetin: { fontSize: 13, fontWeight: '600', color: G.textMid },

    mutfakTarifler: { marginTop: 16 },

    retryBtn: { marginTop: 12, backgroundColor: G.glassGreen, borderRadius: G.radius.pill, paddingHorizontal: 20, paddingVertical: 8 },
    retryMetin: { fontSize: 13, fontWeight: '700', color: G.primary },
  });
}

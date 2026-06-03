import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import React from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedButton } from '@/components/AnimatedButton';
import { useGlass } from '@/context/GlassContext';
import { useLocale } from '@/context/I18nContext';
import { useAuth } from '@/context/AuthContext';
import { type GlassTokens } from '@/constants/glass';
import { type Locale } from '@/i18n';
import {
  bedenKaydet,
  kaloriHesapla,
  type AktiviteSeviyesi,
  type BedenMetrikleri,
  type Cinsiyet,
} from '@/utils/kalori';

export const ONBOARDING_KEY = 'ecochef_onboarding_done';

const { width } = Dimensions.get('window');

const SLIDE_KEYS: { ikon: React.ComponentProps<typeof Feather>['name']; renk: string; key: string }[] = [
  { ikon: 'feather', renk: '#4EAF55', key: 'onboarding.slide0' },
  { ikon: 'camera',  renk: '#2196F3', key: 'onboarding.slide1' },
  { ikon: 'star',    renk: '#EF7B6B', key: 'onboarding.slide2' },
  { ikon: 'calendar',renk: '#4EAF55', key: 'onboarding.slide3' },
];

const AKTIVITELER: { key: AktiviteSeviyesi; ikon: React.ComponentProps<typeof Feather>['name'] }[] = [
  { key: 'hareketsiz', ikon: 'monitor' },
  { key: 'az',         ikon: 'wind' },
  { key: 'orta',       ikon: 'activity' },
  { key: 'cok',        ikon: 'zap' },
];

function LanguagePicker({
  onSelect,
  styles,
}: {
  onSelect: (l: Locale) => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  const { t } = useLocale();
  return (
    <View style={styles.dilEkrani}>
      <Feather name="globe" size={72} color="#4EAF55" style={{ marginBottom: 24 }} />
      <Text style={[styles.dilBaslik, { color: '#4EAF55' }]}>{t('language.title')}</Text>
      <Text style={styles.dilAltyazi}>{t('language.subtitle')}</Text>
      <View style={styles.dilButonlar}>
        <TouchableOpacity
          style={[styles.dilBtn, { borderColor: '#4EAF55' }]}
          activeOpacity={0.8}
          onPress={() => onSelect('tr')}
        >
          <Text style={styles.dilBtnMetni}>{t('language.tr')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dilBtn, { borderColor: '#2196F3' }]}
          activeOpacity={0.8}
          onPress={() => onSelect('en')}
        >
          <Text style={styles.dilBtnMetni}>{t('language.en')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Slide({
  item,
  index,
  scrollX,
  styles,
  baslik,
  aciklama,
}: {
  item: (typeof SLIDE_KEYS)[0];
  index: number;
  scrollX: Animated.Value;
  styles: ReturnType<typeof makeStyles>;
  baslik: string;
  aciklama: string;
}) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
  const iconTranslateX = scrollX.interpolate({ inputRange, outputRange: [width * 0.2, 0, -width * 0.2], extrapolate: 'clamp' });
  const iconScale = scrollX.interpolate({ inputRange, outputRange: [0.78, 1, 0.78], extrapolate: 'clamp' });
  const contentOpacity = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' });
  const contentTranslateY = scrollX.interpolate({ inputRange, outputRange: [28, 0, 28], extrapolate: 'clamp' });

  return (
    <View style={styles.slide}>
      <Animated.View style={[styles.ikonKutu, { backgroundColor: item.renk + '22', transform: [{ translateX: iconTranslateX }, { scale: iconScale }] }]}>
        <Feather name={item.ikon} size={74} color={item.renk} />
      </Animated.View>
      <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslateY }], alignItems: 'center' }}>
        <Text style={[styles.baslik, { color: item.renk }]}>{baslik}</Text>
        <Text style={styles.aciklama}>{aciklama}</Text>
      </Animated.View>
    </View>
  );
}

function Stepper({
  deger,
  onChange,
  min,
  max,
  G,
  styles,
}: {
  deger: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  G: GlassTokens;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity style={styles.stepperBtn} onPress={() => onChange(Math.max(min, deger - 1))}>
        <Feather name="minus" size={16} color={G.primary} />
      </TouchableOpacity>
      <Text style={styles.stepperDeger}>{deger}</Text>
      <TouchableOpacity style={styles.stepperBtn} onPress={() => onChange(Math.min(max, deger + 1))}>
        <Feather name="plus" size={16} color={G.primary} />
      </TouchableOpacity>
    </View>
  );
}

function FizikselBilgiAdimi({
  onBitir,
  onAtla,
  G,
  styles,
}: {
  onBitir: (m: BedenMetrikleri) => void;
  onAtla: () => void;
  G: GlassTokens;
  styles: ReturnType<typeof makeStyles>;
}) {
  const { t } = useLocale();
  const [cinsiyet, setCinsiyet] = useState<Cinsiyet>('erkek');
  const [yas, setYas] = useState(25);
  const [boy, setBoy] = useState(170);
  const [kilo, setKilo] = useState(70);
  const [aktivite, setAktivite] = useState<AktiviteSeviyesi>('orta');

  const metriks: BedenMetrikleri = { cinsiyet, yas, boy, kilo, aktivite };
  const hesaplanan = kaloriHesapla(metriks);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.fizikselIcerik}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Başlık */}
        <View style={styles.fizikselHeader}>
          <LinearGradient
            colors={[G.primary + '22', G.accent + '11']}
            style={styles.fizikselIkonKutu}
          >
            <Feather name="bar-chart-2" size={40} color={G.primary} />
          </LinearGradient>
          <Text style={styles.fizikselBaslik}>{t('bodyMetrics.title')}</Text>
          <Text style={styles.fizikselAltyazi}>{t('bodyMetrics.subtitle')}</Text>
        </View>

        {/* Cinsiyet */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>{t('bodyMetrics.gender')}</Text>
          <View style={styles.cinsiyetSatir}>
            {(['erkek', 'kadin'] as Cinsiyet[]).map((c) => {
              const aktif = cinsiyet === c;
              const renk = c === 'erkek' ? '#2196F3' : '#EF7B6B';
              const ikon: React.ComponentProps<typeof Feather>['name'] = c === 'erkek' ? 'user' : 'heart';
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.cinsiyetKart, aktif && { borderColor: renk, backgroundColor: renk + '18' }]}
                  onPress={() => setCinsiyet(c)}
                  activeOpacity={0.8}
                >
                  <Feather name={ikon} size={28} color={aktif ? renk : G.textLight} />
                  <Text style={[styles.cinsiyetMetin, aktif && { color: renk }]}>
                    {t(c === 'erkek' ? 'bodyMetrics.male' : 'bodyMetrics.female')}
                  </Text>
                  {aktif && (
                    <View style={[styles.cinsiyetSecili, { backgroundColor: renk }]}>
                      <Feather name="check" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Yas / Boy / Kilo */}
        <View style={styles.bolum}>
          {[
            { labelKey: 'bodyMetrics.age',    deger: yas,  onChange: setYas,  min: 10, max: 100 },
            { labelKey: 'bodyMetrics.height', deger: boy,  onChange: setBoy,  min: 100, max: 250 },
            { labelKey: 'bodyMetrics.weight', deger: kilo, onChange: setKilo, min: 30, max: 250 },
          ].map((item) => (
            <View key={item.labelKey} style={styles.olcuSatir}>
              <Text style={styles.olcuLabel}>{t(item.labelKey)}</Text>
              <Stepper
                deger={item.deger}
                onChange={item.onChange}
                min={item.min}
                max={item.max}
                G={G}
                styles={styles}
              />
            </View>
          ))}
        </View>

        {/* Aktivite Seviyesi */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>{t('bodyMetrics.activity')}</Text>
          <View style={styles.aktiviteGrid}>
            {AKTIVITELER.map((a) => {
              const aktif = aktivite === a.key;
              return (
                <TouchableOpacity
                  key={a.key}
                  style={[styles.aktiviteKart, aktif && styles.aktiviteKartAktif]}
                  onPress={() => setAktivite(a.key)}
                  activeOpacity={0.8}
                >
                  <Feather name={a.ikon} size={22} color={aktif ? '#fff' : G.textMid} />
                  <Text style={[styles.aktiviteMetin, aktif && { color: '#fff' }]}>
                    {t(`bodyMetrics.activity_${a.key}`)}
                  </Text>
                  <Text style={[styles.aktiviteAlt, aktif && { color: 'rgba(255,255,255,0.75)' }]}>
                    {t(`bodyMetrics.activity_${a.key}_desc`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Hesaplanan Sonuç */}
        <LinearGradient
          colors={[G.primary + 'CC', G.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.sonucKart}
        >
          <Feather name="zap" size={20} color="#fff" />
          <Text style={styles.sonucMetin}>
            {t('bodyMetrics.result', { kcal: String(hesaplanan) })}
          </Text>
        </LinearGradient>

        {/* Butonlar */}
        <AnimatedButton style={styles.hesaplaBtn} onPress={() => onBitir(metriks)}>
          <Text style={styles.hesaplaBtnMetni}>{t('bodyMetrics.calculate')}</Text>
        </AnimatedButton>
        <TouchableOpacity style={styles.atlaBtn} onPress={onAtla}>
          <Text style={styles.atlaBtnMetni}>{t('bodyMetrics.skip')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const G = useGlass();
  const styles = useMemo(() => makeStyles(G), [G]);
  const { bottom } = useSafeAreaInsets();
  const { t, setLocale } = useLocale();
  const { cikisYap } = useAuth();
  const [dilSecildi, setDilSecildi] = useState(false);
  const [fizikselAdim, setFizikselAdim] = useState(false);
  const [hesapAdimi, setHesapAdimi] = useState(false);
  const [aktifIndex, setAktifIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const bgTint = scrollX.interpolate({
    inputRange: SLIDE_KEYS.map((_, i) => i * width),
    outputRange: SLIDE_KEYS.map((s) => s.renk + '14'),
  });

  const dilSec = (l: Locale) => {
    setLocale(l);
    setDilSecildi(true);
  };

  // Onboarding'i tamamla ve ana sayfaya git (misafir veya login sonrası)
  const tamamla = async () => {
    await cikisYap();
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)');
  };

  // Slaytlardan "atla/devam" → önce hesap adımı göster
  const bitir = () => { setFizikselAdim(false); setHesapAdimi(true); };

  const fizikselKaydetVeBitir = async (m: BedenMetrikleri) => {
    await bedenKaydet(m);
    setFizikselAdim(false);
    setHesapAdimi(true);
  };

  const sonraki = () => {
    if (aktifIndex < SLIDE_KEYS.length - 1) {
      flatListRef.current?.scrollToIndex({ index: aktifIndex + 1, animated: true });
    } else {
      setFizikselAdim(true);
    }
  };

  if (!dilSecildi) {
    return (
      <View style={[styles.container, { backgroundColor: G.bgColor }]}>
        <LanguagePicker onSelect={dilSec} styles={styles} />
      </View>
    );
  }

  if (fizikselAdim) {
    return (
      <View style={[styles.container, { backgroundColor: G.bgColor, paddingTop: 60, paddingBottom: bottom + 16 }]}>
        <FizikselBilgiAdimi
          onBitir={fizikselKaydetVeBitir}
          onAtla={bitir}
          G={G}
          styles={styles}
        />
      </View>
    );
  }

  if (hesapAdimi) {
    return (
      <View style={[styles.container, { backgroundColor: G.bgColor }]}>
        <View style={styles.hesapEkrani}>
          <View style={[styles.hesapIkonKutu, { backgroundColor: G.primary + '22' }]}>
            <Feather name="user-check" size={52} color={G.primary} />
          </View>
          <Text style={styles.hesapBaslik}>{t('auth.subtitle')}</Text>
          <Text style={styles.hesapAciklama}>
            {t('home.favLoginPrompt')}
          </Text>

          <AnimatedButton
            style={styles.hesapGirisBtn}
            onPress={async () => {
              await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
              router.replace('/login' as any);
            }}
          >
            <Feather name="log-in" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.hesapGirisBtnMetni}>{t('common.login')} / {t('auth.registerTab')}</Text>
          </AnimatedButton>

          <TouchableOpacity style={styles.hesapMisafirBtn} onPress={tamamla}>
            <Text style={styles.hesapMisafirMetni}>{t('auth.guest')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: bgTint }]} pointerEvents="none" />

      <FlatList
        ref={flatListRef}
        data={SLIDE_KEYS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) =>
          setAktifIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item, index }) => (
          <Slide
            item={item}
            index={index}
            scrollX={scrollX}
            styles={styles}
            baslik={t(`${item.key}.title`)}
            aciklama={t(`${item.key}.description`)}
          />
        )}
      />

      {/* Nokta göstergesi */}
      <View style={styles.noktalar}>
        {SLIDE_KEYS.map((_, i) => {
          const genislik = scrollX.interpolate({ inputRange: [(i - 1) * width, i * width, (i + 1) * width], outputRange: [8, 28, 8], extrapolate: 'clamp' });
          const renkCikti = scrollX.interpolate({ inputRange: [(i - 1) * width, i * width, (i + 1) * width], outputRange: [G.glassBorder, SLIDE_KEYS[i].renk, G.glassBorder], extrapolate: 'clamp' });
          const opasite = scrollX.interpolate({ inputRange: [(i - 1) * width, i * width, (i + 1) * width], outputRange: [0.35, 1, 0.35], extrapolate: 'clamp' });
          return (
            <Animated.View key={i} style={[styles.nokta, { width: genislik, backgroundColor: renkCikti, opacity: opasite }]} />
          );
        })}
        {/* Son nokta: fiziksel adım göstergesi */}
        <Animated.View
          style={[
            styles.nokta,
            {
              width: 8,
              backgroundColor: scrollX.interpolate({
                inputRange: [0, (SLIDE_KEYS.length - 1) * width],
                outputRange: [G.glassBorder, G.glassBorder],
                extrapolate: 'clamp',
              }),
              opacity: 0.35,
            },
          ]}
        />
      </View>

      {/* Butonlar */}
      <View style={[styles.butonlar, { paddingBottom: bottom + 24 }]}>
        {aktifIndex < SLIDE_KEYS.length - 1 ? (
          <TouchableOpacity onPress={bitir} style={styles.atlaBtn}>
            <Text style={styles.atlaBtnMetni}>{t('common.skip')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.atlaBtn} />
        )}

        <AnimatedButton
          style={[styles.devamBtn, { backgroundColor: SLIDE_KEYS[aktifIndex].renk }]}
          onPress={sonraki}
        >
          <Text style={styles.devamBtnMetni}>
            {aktifIndex === SLIDE_KEYS.length - 1 ? t('common.continue') : t('common.continue')}
          </Text>
        </AnimatedButton>
      </View>
    </View>
  );
}

function makeStyles(G: GlassTokens) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: G.bgColor },

    // Dil seçimi
    dilEkrani: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    dilIkon: { marginBottom: 24 },
    dilBaslik: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
    dilAltyazi: { fontSize: 15, color: G.textMid, textAlign: 'center', marginBottom: 40, lineHeight: 22 },
    dilButonlar: { width: '100%', gap: 14 },
    dilBtn: { borderWidth: 2, borderRadius: G.radius.pill, paddingVertical: 16, alignItems: 'center', backgroundColor: G.glassGreen },
    dilBtnMetni: { fontSize: 18, fontWeight: '700', color: G.textDark },

    // Slaytlar
    slide: { width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    ikonKutu: { width: 148, height: 148, borderRadius: 74, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
    ikon: {},
    baslik: { fontSize: 34, fontWeight: '800', textAlign: 'center', marginBottom: 20, lineHeight: 42 },
    aciklama: { fontSize: 16, color: G.textMid, textAlign: 'center', lineHeight: 26 },

    noktalar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 28 },
    nokta: { height: 8, borderRadius: 4 },

    butonlar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
    atlaBtn: { paddingVertical: 12, paddingHorizontal: 16, minWidth: 60 },
    atlaBtnMetni: { fontSize: 15, color: G.textLight, fontWeight: '500', textAlign: 'center' },
    devamBtn: { borderRadius: G.radius.pill, paddingHorizontal: 32, paddingVertical: 14 },
    devamBtnMetni: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Fiziksel bilgi adımı
    fizikselIcerik: { paddingHorizontal: 24, paddingBottom: 32 },
    fizikselHeader: { alignItems: 'center', marginBottom: 28 },
    fizikselIkonKutu: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    fizikselBaslik: { fontSize: 22, fontWeight: '800', color: G.textDark, textAlign: 'center', marginBottom: 8 },
    fizikselAltyazi: { fontSize: 13, color: G.textLight, textAlign: 'center', lineHeight: 20 },

    bolum: { marginBottom: 24 },
    bolumBaslik: { fontSize: 13, fontWeight: '700', color: G.textLight, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },

    cinsiyetSatir: { flexDirection: 'row', gap: 12 },
    cinsiyetKart: {
      flex: 1, borderRadius: G.radius.lg, borderWidth: 1.5, borderColor: G.glassBorder,
      backgroundColor: G.glassGreen, paddingVertical: 18,
      alignItems: 'center', gap: 8,
    },
    cinsiyetMetin: { fontSize: 15, fontWeight: '700', color: G.textMid },
    cinsiyetSecili: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },

    olcuSatir: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: G.glassGreen, borderRadius: G.radius.md,
      paddingHorizontal: 16, paddingVertical: 14,
      borderWidth: 1, borderColor: G.glassBorder,
      marginBottom: 8,
    },
    olcuLabel: { fontSize: 15, fontWeight: '600', color: G.textDark },

    stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    stepperBtn: {
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: G.primaryMuted,
      alignItems: 'center', justifyContent: 'center',
    },
    stepperDeger: { width: 48, textAlign: 'center', fontSize: 18, fontWeight: '800', color: G.primary },

    aktiviteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    aktiviteKart: {
      width: '47%', borderRadius: G.radius.lg,
      borderWidth: 1.5, borderColor: G.glassBorder,
      backgroundColor: G.glassGreen,
      padding: 14, alignItems: 'center', gap: 4,
    },
    aktiviteKartAktif: { backgroundColor: G.primary, borderColor: G.primary },
    aktiviteMetin: { fontSize: 13, fontWeight: '700', color: G.textDark, textAlign: 'center' },
    aktiviteAlt: { fontSize: 11, color: G.textLight, textAlign: 'center' },

    sonucKart: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 10, borderRadius: G.radius.lg,
      paddingVertical: 16, paddingHorizontal: 20,
      marginBottom: 20,
    },
    sonucMetin: { fontSize: 15, fontWeight: '700', color: '#fff' },

    hesaplaBtn: {
      backgroundColor: G.primary, borderRadius: G.radius.pill,
      paddingVertical: 16, alignItems: 'center', marginBottom: 14,
    },
    hesaplaBtnMetni: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Hesap adımı
    hesapEkrani: {
      flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36,
    },
    hesapIkonKutu: {
      width: 110, height: 110, borderRadius: 55,
      alignItems: 'center', justifyContent: 'center', marginBottom: 28,
    },
    hesapBaslik: {
      fontSize: 24, fontWeight: '800', color: G.textDark,
      textAlign: 'center', marginBottom: 12,
    },
    hesapAciklama: {
      fontSize: 14, color: G.textMid, textAlign: 'center',
      lineHeight: 22, marginBottom: 36,
    },
    hesapGirisBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: G.primary, borderRadius: G.radius.pill,
      paddingVertical: 15, paddingHorizontal: 36,
      width: '100%', marginBottom: 14,
    },
    hesapGirisBtnMetni: { color: '#fff', fontSize: 16, fontWeight: '700' },
    hesapMisafirBtn: { paddingVertical: 12, paddingHorizontal: 24 },
    hesapMisafirMetni: { fontSize: 14, color: G.textLight, fontWeight: '500' },
  });
}

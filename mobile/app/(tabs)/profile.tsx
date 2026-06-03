import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import React from 'react';
import {
  Animated,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedButton } from '@/components/AnimatedButton';
import { GlassCard } from '@/components/GlassCard';
import { GlassScreen } from '@/components/GlassScreen';
import { useGlass, useTheme } from '@/context/GlassContext';
import { useLocale } from '@/context/I18nContext';
import { type GlassTokens } from '@/constants/glass';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/hooks/use-favorites';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, NGROK_HEADER } from '@/utils/api';
import { type Locale } from '@/i18n';
import { ONBOARDING_KEY } from '@/app/onboarding';
import { LOCALE_KEY } from '@/context/I18nContext';

const DIET_KEY_MAP: Record<string, string> = {
  vegetarian: 'profile.diet.vegetarian',
  vegan: 'profile.diet.vegan',
  'gluten free': 'profile.diet.glutenFree',
  'dairy free': 'profile.diet.dairyFree',
  ketogenic: 'profile.diet.ketogenic',
};

const MENU_ITEM_KEYS: { ikon: React.ComponentProps<typeof Feather>['name']; labelKey: string; hedef: string; renk: string }[] = [
  { ikon: 'edit-2',       labelKey: 'profile.editProfile',   hedef: '/edit-profile',       renk: '#4EAF55' },
  { ikon: 'heart',        labelKey: 'profile.favorites',     hedef: '/(tabs)/favorites',   renk: '#EF7B6B' },
  { ikon: 'calendar',     labelKey: 'profile.weeklyPlan',    hedef: '/(tabs)/plan',        renk: '#4EAF55' },
  { ikon: 'shopping-cart',labelKey: 'profile.shoppingList',  hedef: '/(tabs)/shopping',    renk: '#74C47A' },
  { ikon: 'clock',        labelKey: 'profile.searchHistory', hedef: '/search-history',     renk: '#F59E0B' },
];

type KullaniciBilgisi = { id: number; kullanici_adi: string };

export default function ProfileScreen() {
  const router = useRouter();
  const G = useGlass();
  const styles = useMemo(() => makeStyles(G), [G]);
  const { kullaniciAdi, token, cikisYap, diyetTercihleri } = useAuth();
  const { tema, setTema } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const { favoriler } = useFavorites();
  const [kullanici, setKullanici] = useState<KullaniciBilgisi | null>(null);
  const [planSayisi, setPlanSayisi] = useState<number | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  const TEMA_INDEX: Record<string, number> = { light: 0, sistem: 1, dark: 2 };
  const LOCALE_INDEX: Record<string, number> = { tr: 0, en: 1 };
  const [btnWidth, setBtnWidth] = useState(0);
  const [dilBtnWidth, setDilBtnWidth] = useState(0);
  const temaSlide = useRef(new Animated.Value(0)).current;
  const dilSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (btnWidth === 0) return;
    Animated.spring(temaSlide, {
      toValue: TEMA_INDEX[tema] * (btnWidth + 4),
      useNativeDriver: true,
      tension: 70,
      friction: 11,
    }).start();
  }, [tema, btnWidth]);

  useEffect(() => {
    if (dilBtnWidth === 0) return;
    Animated.spring(dilSlide, {
      toValue: LOCALE_INDEX[locale] * (dilBtnWidth + 4),
      useNativeDriver: true,
      tension: 70,
      friction: 11,
    }).start();
  }, [locale, dilBtnWidth]);

  useEffect(() => {
    if (!token) { setYukleniyor(false); return; }
    const headers = { ...NGROK_HEADER, Authorization: `Bearer ${token}` };
    const bugun = new Date();
    const gun = bugun.getDay();
    const pazartesiOffset = gun === 0 ? -6 : 1 - gun;
    const pazartesi = new Date(bugun);
    pazartesi.setDate(bugun.getDate() + pazartesiOffset);
    const y = pazartesi.getFullYear();
    const mo = String(pazartesi.getMonth() + 1).padStart(2, '0');
    const dy = String(pazartesi.getDate()).padStart(2, '0');
    const haftaBasi = `${y}-${mo}-${dy}`;

    Promise.all([
      fetch(`${BASE_URL}/auth/me`, { headers }).then(r => r.json()),
      fetch(`${BASE_URL}/meal-plan?hafta_basi=${haftaBasi}`, { headers }).then(r => r.json()),
    ])
      .then(([meData, planData]) => {
        setKullanici(meData);
        setPlanSayisi(Array.isArray(planData) ? planData.length : 0);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, [token]);

  const basTurveri = kullaniciAdi?.slice(0, 2).toUpperCase() ?? '??';

  const cikisYapVeYonlendir = async () => {
    await cikisYap();
    router.replace('/login' as any);
  };

  const demoSifirla = async () => {
    await cikisYap();
    await AsyncStorage.multiRemove([ONBOARDING_KEY, LOCALE_KEY]);
    router.replace('/onboarding' as any);
  };

  if (!token || !kullaniciAdi) {
    return (
      <GlassScreen>
        <View style={styles.merkez}>
          <Feather name="user" size={56} color={G.textLight} style={{ marginBottom: 16 }} />
          <Text style={styles.girisGerekli}>{t('profile.loginPrompt')}</Text>
          <AnimatedButton style={styles.girisBtn} onPress={() => router.push('/login' as any)}>
            <Text style={styles.girisBtnMetni}>{t('common.login')}</Text>
          </AnimatedButton>
          <TouchableOpacity style={styles.demoBtn} onPress={demoSifirla}>
            <Feather name="refresh-cw" size={14} color="#F59E0B" />
            <Text style={styles.demoBtnMetni}>Demoyu Yeniden Başlat</Text>
          </TouchableOpacity>
        </View>
      </GlassScreen>
    );
  }

  return (
    <GlassScreen>
      <ScrollView contentContainerStyle={styles.icerik} showsVerticalScrollIndicator={false}>

        {/* Avatar + Kullanıcı Bilgisi */}
        <View style={styles.headerKutu}>
          <LinearGradient
            colors={[G.primary, G.accent, G.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarRing}
          >
            <View style={styles.avatarIc}>
              <Text style={styles.avatarMetin}>{basTurveri}</Text>
            </View>
          </LinearGradient>

          <Text style={styles.kullaniciAdi}>{kullaniciAdi}</Text>
          {kullanici && (
            <Text style={styles.kullaniciId}>{t('profile.member', { id: kullanici.id })}</Text>
          )}

          {diyetTercihleri.length > 0 && (
            <View style={styles.badgeSatiri}>
              {diyetTercihleri.map((d) => (
                <View key={d} style={styles.badge}>
                  <Text style={styles.badgeMetin}>{t(DIET_KEY_MAP[d] ?? d)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* İstatistik Kartları */}
        {yukleniyor ? (
          <ActivityIndicator color={G.primary} style={{ marginVertical: 24 }} />
        ) : (
          <View style={styles.statSatiri}>
            <LinearGradient
              colors={[G.primary + 'CC', G.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statBlok}
            >
              <Feather name="heart" size={22} color="rgba(255,255,255,0.9)" style={{ marginBottom: 6 }} />
              <Text style={styles.statSayi}>{favoriler.length}</Text>
              <Text style={styles.statEtiket}>{t('profile.favCount')}</Text>
            </LinearGradient>
            <LinearGradient
              colors={[G.accent + 'CC', '#F4A697']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statBlok}
            >
              <Feather name="calendar" size={22} color="rgba(255,255,255,0.9)" style={{ marginBottom: 6 }} />
              <Text style={styles.statSayi}>{planSayisi ?? 0}</Text>
              <Text style={styles.statEtiket}>{t('profile.thisWeek')}</Text>
            </LinearGradient>
          </View>
        )}

        {/* Menü */}
        <GlassCard style={styles.menuKart}>
          {MENU_ITEM_KEYS.map((item, i) => (
            <View key={item.hedef}>
              {i > 0 && <View style={styles.satirAyirac} />}
              <TouchableOpacity
                style={styles.menuSatir}
                onPress={() => router.push(item.hedef as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIkonKutu, { backgroundColor: item.renk + '20' }]}>
                  <Feather name={item.ikon} size={18} color={item.renk} />
                </View>
                <Text style={styles.menuMetin}>{t(item.labelKey)}</Text>
                <Text style={styles.menuOk}>›</Text>
              </TouchableOpacity>
            </View>
          ))}
        </GlassCard>

        {/* Tema Seçimi */}
        <GlassCard style={styles.tercihKart}>
          <Text style={styles.tercihBaslik}>{t('profile.theme')}</Text>
          <View style={styles.toggle}>
            <Animated.View
              style={[styles.togglePill, btnWidth > 0 && { width: btnWidth, transform: [{ translateX: temaSlide }] }]}
            />
            {([
              { deger: 'light',  labelKey: 'profile.themeLight',  ikon: 'sun'     },
              { deger: 'sistem', labelKey: 'profile.themeSystem', ikon: 'monitor' },
              { deger: 'dark',   labelKey: 'profile.themeDark',   ikon: 'moon'    },
            ] as const).map((s, i) => {
              const aktif = tema === s.deger;
              return (
                <TouchableOpacity
                  key={s.deger}
                  style={styles.toggleBtn}
                  onPress={() => setTema(s.deger)}
                  onLayout={i === 0 ? (e) => setBtnWidth(e.nativeEvent.layout.width) : undefined}
                >
                  <Feather name={s.ikon} size={13} color={aktif ? '#fff' : G.textMid} />
                  <Text style={aktif ? { ...styles.toggleBtnMetin, color: '#fff' } : styles.toggleBtnMetin}>
                    {t(s.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* Dil Seçimi */}
        <GlassCard style={styles.tercihKart}>
          <Text style={styles.tercihBaslik}>{t('profile.language')}</Text>
          <View style={styles.toggle}>
            <Animated.View
              style={[styles.togglePill, dilBtnWidth > 0 && { width: dilBtnWidth, transform: [{ translateX: dilSlide }] }]}
            />
            {([
              { deger: 'tr' as Locale, label: '🇹🇷 Türkçe' },
              { deger: 'en' as Locale, label: '🇬🇧 English' },
            ]).map((s, i) => {
              const aktif = locale === s.deger;
              return (
                <TouchableOpacity
                  key={s.deger}
                  style={styles.toggleBtn}
                  onPress={() => setLocale(s.deger)}
                  onLayout={i === 0 ? (e) => setDilBtnWidth(e.nativeEvent.layout.width) : undefined}
                >
                  <Text style={aktif ? { ...styles.toggleBtnMetin, color: '#fff' } : styles.toggleBtnMetin}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* Demo Sıfırla */}
        <TouchableOpacity style={styles.demoBtn} onPress={demoSifirla}>
          <Feather name="refresh-cw" size={14} color="#F59E0B" />
          <Text style={styles.demoBtnMetni}>Demoyu Yeniden Başlat</Text>
        </TouchableOpacity>

        {/* Çıkış */}
        <AnimatedButton style={styles.cikisBtn} onPress={cikisYapVeYonlendir}>
          <LinearGradient
            colors={['#FF5F5F', '#E53935']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cikisBtnIc}
          >
            <Text style={styles.cikisBtnMetni}>{t('profile.logout')}</Text>
          </LinearGradient>
        </AnimatedButton>

      </ScrollView>
    </GlassScreen>
  );
}

function makeStyles(G: GlassTokens) {
  return StyleSheet.create({
    icerik: { padding: 24, paddingTop: 60, paddingBottom: 48, alignItems: 'center' },
    merkez: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

    headerKutu: { alignItems: 'center', marginBottom: 28 },

    avatarRing: {
      width: 100, height: 100, borderRadius: 50,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 14,
      shadowColor: G.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35, shadowRadius: 20, elevation: 10,
    },
    avatarIc: {
      width: 88, height: 88, borderRadius: 44,
      backgroundColor: G.glassWhite,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarMetin: { color: G.primary, fontSize: 34, fontWeight: '800' },

    kullaniciAdi: { fontSize: 22, fontWeight: '800', color: G.textDark, marginBottom: 2 },
    kullaniciId: { fontSize: 12, color: G.textLight, marginBottom: 12 },

    badgeSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
    badge: {
      paddingHorizontal: 10, paddingVertical: 4,
      borderRadius: 100,
      backgroundColor: G.primaryMuted,
      borderWidth: 1, borderColor: G.primary + '30',
    },
    badgeMetin: { fontSize: 12, color: G.primary, fontWeight: '600' },

    statSatiri: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 16 },
    statBlok: {
      flex: 1, borderRadius: G.radius.lg,
      paddingVertical: 20, alignItems: 'center',
    },
    statSayi: { fontSize: 32, fontWeight: '800', color: '#fff' },
    statEtiket: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4, fontWeight: '600' },

    menuKart: { width: '100%', marginBottom: 16 },
    menuSatir: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    menuIkonKutu: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    menuIkon: {},
    menuMetin: { flex: 1, fontSize: 15, fontWeight: '600', color: G.textDark },
    menuOk: { fontSize: 22, color: G.textLight },
    satirAyirac: { height: 1, backgroundColor: G.glassGreen, marginLeft: 64 },

    tercihKart: { width: '100%', padding: 16, marginBottom: 16 },
    tercihBaslik: { fontSize: 14, fontWeight: '700', color: G.textDark, marginBottom: 12 },
    toggle: { flexDirection: 'row', backgroundColor: G.glassGreen, borderRadius: G.radius.pill, padding: 4, gap: 4 },
    togglePill: {
      position: 'absolute',
      top: 4, left: 4, bottom: 4,
      borderRadius: G.radius.pill,
      backgroundColor: G.primary,
    },
    toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: G.radius.pill, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5 },
    toggleBtnAktif: {},
    toggleBtnMetin: { fontSize: 13, fontWeight: '600', color: G.textMid },

    cikisBtn: { width: '100%', borderRadius: G.radius.lg, overflow: 'hidden' },
    cikisBtnIc: { padding: 16, alignItems: 'center', borderRadius: G.radius.lg },
    cikisBtnMetni: { fontSize: 15, color: '#fff', fontWeight: '700', letterSpacing: 0.3 },

    girisGerekli: { fontSize: 16, color: G.textMid, marginBottom: 20, textAlign: 'center' },
    girisBtn: { backgroundColor: G.glassGreenStrong, borderRadius: G.radius.pill, paddingHorizontal: 32, paddingVertical: 13 },
    girisBtnMetni: { color: '#fff', fontSize: 15, fontWeight: '700' },

    demoBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 8, paddingVertical: 10, paddingHorizontal: 20, borderRadius: G.radius.pill, borderWidth: 1.5, borderColor: '#F59E0B', backgroundColor: '#FFF8E1' },
    demoBtnMetni: { fontSize: 14, fontWeight: '700', color: '#F59E0B' },
  });
}

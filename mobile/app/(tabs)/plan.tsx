import Feather from '@expo/vector-icons/Feather';
import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { AnimatedButton } from '@/components/AnimatedButton';
import { kaloriHedefiGetir } from '@/utils/kalori';
import { GlassCard } from '@/components/GlassCard';
import { GlassScreen } from '@/components/GlassScreen';
import { useGlass } from '@/context/GlassContext';
import { type GlassTokens } from '@/constants/glass';
import { useAuth } from '@/context/AuthContext';
import { useMealPlan, type OgunTipi, type PlanItem } from '@/hooks/use-meal-plan';
import { useRecipeCache } from '@/hooks/use-recipe-cache';
import { Toast } from '@/components/Toast';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/context/I18nContext';

const VARSAYILAN_KALORI = 2000;
const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
const NGROK_HEADER = { 'ngrok-skip-browser-warning': '1' };

const GUNLER_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const OGUNLER: { key: OgunTipi }[] = [
  { key: 'kahvalti' },
  { key: 'ogle' },
  { key: 'aksam' },
];

const OGUN_TRANSLATION_KEY: Record<OgunTipi, string> = {
  kahvalti: 'breakfast',
  ogle: 'lunch',
  aksam: 'dinner',
};

const OGUN_IKON: Record<OgunTipi, React.ComponentProps<typeof Feather>['name']> = {
  kahvalti: 'sun',
  ogle: 'cloud',
  aksam: 'moon',
};

function haftaBasiHesapla(tarih: Date): Date {
  const d = new Date(tarih);
  const gun = d.getDay();
  const fark = gun === 0 ? -6 : 1 - gun;
  d.setDate(d.getDate() + fark);
  d.setHours(0, 0, 0, 0);
  return d;
}

function gunEkle(tarih: Date, gun: number): Date {
  const d = new Date(tarih);
  d.setDate(d.getDate() + gun);
  return d;
}

function isoTarih(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const g = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${g}`;
}

function kisaTarih(d: Date, locale: string): string {
  return d.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' });
}

export default function PlanScreen() {
  const router = useRouter();
  const G = useGlass();
  const styles = useMemo(() => makeStyles(G), [G]);
  const { kullaniciAdi } = useAuth();
  const { plan, yukle, planKaldir } = useMealPlan();
  const { detayGetir, detayKaydet } = useRecipeCache();
  const { toast, goster } = useToast();
  const { t, locale } = useLocale();
  const [haftaBasi, setHaftaBasi] = useState(() => haftaBasiHesapla(new Date()));
  const [gunlukKalori, setGunlukKalori] = useState(0);
  const [kaloriHedefi, setKaloriHedefi] = useState(VARSAYILAN_KALORI);

  const bugunStr = isoTarih(new Date());

  useFocusEffect(useCallback(() => {
    kaloriHedefiGetir().then(setKaloriHedefi);
  }, []));

  useEffect(() => {
    yukle(isoTarih(haftaBasi));
  }, [yukle, haftaBasi]);

  // Plan yüklendiğinde cache'de olmayan tariflerin detaylarını arka planda çek
  useEffect(() => {
    const eksikIds = [...new Set(
      plan
        .filter((p) => p.recipe_id && !detayGetir(p.recipe_id))
        .map((p) => p.recipe_id!)
    )];
    for (const id of eksikIds) {
      fetch(`${BASE_URL}/recipes/${id}`, { headers: NGROK_HEADER })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (data) detayKaydet(data); })
        .catch(() => {});
    }
  }, [plan.map((p) => p.recipe_id).join(',')]);

  useEffect(() => {
    const bugunItems = plan.filter((p) => p.tarih === bugunStr && p.recipe_id);
    const toplam = bugunItems.reduce((acc, item) => {
      const detay = detayGetir(item.recipe_id!);
      return acc + (detay?.beslenme?.kalori ?? 0);
    }, 0);
    setGunlukKalori(toplam);
  }, [plan, detayGetir]);

  const planBul = (tarih: string, ogun: OgunTipi): PlanItem | undefined =>
    plan.find((p) => p.tarih === tarih && p.ogun === ogun);

  const oncekiHafta = () => {
    const d = new Date(haftaBasi);
    d.setDate(d.getDate() - 7);
    setHaftaBasi(d);
  };

  const sonrakiHafta = () => {
    const d = new Date(haftaBasi);
    d.setDate(d.getDate() + 7);
    setHaftaBasi(d);
  };

  const haftaBitisi = gunEkle(haftaBasi, 6);
  const haftaBaslikStr = `${kisaTarih(haftaBasi, locale)} – ${kisaTarih(haftaBitisi, locale)}`;

  if (!kullaniciAdi) {
    return (
      <GlassScreen>
        <View style={styles.merkez}>
          <Feather name="calendar" size={56} color={G.textLight} style={{ marginBottom: 16 }} />
          <Text style={styles.girisMetin}>{t('plan.loginPrompt')}</Text>
          <AnimatedButton style={styles.girisButon} onPress={() => router.push('/login' as any)}>
            <Text style={styles.girisButonMetin}>{t('common.login')}</Text>
          </AnimatedButton>
        </View>
      </GlassScreen>
    );
  }

  return (
    <GlassScreen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.baslik}>{t('plan.title')}</Text>

        <GlassCard style={styles.kaloriKart}>
          <View style={styles.kaloriUstSatir}>
            <Text style={styles.kaloriBaslik}>{t('plan.calorie')}</Text>
            <Text style={styles.kaloriDeger}>
              {gunlukKalori > 0 ? `${gunlukKalori} / ${kaloriHedefi} kcal` : `— / ${kaloriHedefi} kcal`}
            </Text>
          </View>
          <View style={styles.progressArka}>
            <View
              style={[
                styles.progressOn,
                { width: `${Math.min((gunlukKalori / kaloriHedefi) * 100, 100)}%` as any },
              ]}
            />
          </View>
          {gunlukKalori === 0 && (
            <Text style={styles.kaloriIpucu}>{t('plan.calorieHint')}</Text>
          )}
        </GlassCard>

        <GlassCard style={styles.haftaNav}>
          <TouchableOpacity style={styles.navButon} onPress={oncekiHafta}>
            <Text style={styles.navButonMetin}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.haftaMetin}>{haftaBaslikStr}</Text>
          <TouchableOpacity style={styles.navButon} onPress={sonrakiHafta}>
            <Text style={styles.navButonMetin}>›</Text>
          </TouchableOpacity>
        </GlassCard>

        {GUNLER_KEYS.map((gunKey, gunIndex) => {
          const gunTarihObj = gunEkle(haftaBasi, gunIndex);
          const gunTarihStr = isoTarih(gunTarihObj);
          const bugun = gunTarihStr === bugunStr;

          return (
            <GlassCard
              key={gunIndex}
              style={bugun ? { ...styles.gunKart, ...styles.bugunKart } : styles.gunKart}
            >
              <View style={styles.gunBaslik}>
                <Text style={bugun ? { ...styles.gunAdi, ...styles.bugunAdi } : styles.gunAdi}>
                  {t(`plan.days.${gunKey}`)}
                </Text>
                <Text style={bugun ? { ...styles.gunTarih, ...styles.bugunTarih } : styles.gunTarih}>
                  {kisaTarih(gunTarihObj, locale)}
                </Text>
                {bugun && (
                  <View style={styles.bugunRozet}>
                    <Text style={styles.bugunRozetMetin}>{t('plan.today')}</Text>
                  </View>
                )}
              </View>

              {OGUNLER.map((ogun) => {
                const item = planBul(gunTarihStr, ogun.key);
                return (
                  <View key={ogun.key} style={styles.ogunSatiri}>
                    <Feather name={OGUN_IKON[ogun.key]} size={18} color={G.textMid} style={styles.ogunIkon} />
                    {item ? (
                      <TouchableOpacity
                        style={styles.ogunDolu}
                        activeOpacity={0.8}
                        onPress={() =>
                          item.recipe_id
                            ? router.push({
                                pathname: '/recipe/[id]',
                                params: {
                                  id: String(item.recipe_id),
                                  isim: item.recipe_isim,
                                  gorsel: item.recipe_gorsel ?? '',
                                },
                              })
                            : undefined
                        }
                      >
                        {item.recipe_gorsel ? (
                          <Image source={{ uri: item.recipe_gorsel }} style={styles.ogunGorsel} />
                        ) : (
                          <View style={styles.ogunGorselPlaceholder}>
                            <Feather name="book-open" size={16} color={G.primary} />
                          </View>
                        )}
                        <Text style={styles.ogunIsim} numberOfLines={2}>{item.recipe_isim}</Text>
                        <TouchableOpacity
                          style={styles.kaldirButon}
                          onPress={async () => {
                            await planKaldir(item.id);
                            goster(t('plan.removed'), 'bilgi');
                          }}
                        >
                          <Feather name="x" size={14} color={G.danger} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.ogunBos}>
                        <Text style={styles.ogunBosMetin}>
                          {t('plan.mealEmpty', { meal: t(`plan.meals.${OGUN_TRANSLATION_KEY[ogun.key]}`) })}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </GlassCard>
          );
        })}

        <Text style={styles.ipucu}>{t('plan.tip')}</Text>
      </ScrollView>

      <Toast mesaj={toast.mesaj} tip={toast.tip} gorunur={toast.gorunur} />
    </GlassScreen>
  );
}

function makeStyles(G: GlassTokens) {
  return StyleSheet.create({
    container: { padding: 20, paddingTop: 60, paddingBottom: 48 },
    baslik: { fontSize: 32, fontWeight: '800', color: G.primary, marginBottom: 16 },

    merkez: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    girisMetin: { fontSize: 16, color: G.textMid, textAlign: 'center', marginBottom: 24, fontWeight: '600' },
    girisButon: { backgroundColor: G.glassGreenStrong, borderRadius: G.radius.pill, paddingHorizontal: 32, paddingVertical: 13 },
    girisButonMetin: { color: '#fff', fontSize: 15, fontWeight: '700' },

    haftaNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 4, marginBottom: 16 },
    navButon: { paddingHorizontal: 16, paddingVertical: 4 },
    navButonMetin: { fontSize: 28, color: G.primary, fontWeight: '300', lineHeight: 32 },
    haftaMetin: { fontSize: 15, fontWeight: '700', color: G.textDark },

    gunKart: { marginBottom: 12, padding: 14 },
    bugunKart: { borderColor: G.primary, borderWidth: 1.5 },

    gunBaslik: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    gunAdi: { fontSize: 17, fontWeight: '800', color: G.textDark },
    gunTarih: { fontSize: 13, color: G.textLight },
    bugunAdi: { color: G.primary },
    bugunTarih: { color: G.primary },
    bugunRozet: { backgroundColor: G.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
    bugunRozetMetin: { color: '#fff', fontSize: 11, fontWeight: '700' },

    ogunSatiri: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    ogunIkon: { width: 24, textAlign: 'center' },
    ogunDolu: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: G.glassGreen, borderRadius: 10, padding: 8 },
    ogunGorsel: { width: 40, height: 40, borderRadius: 8, resizeMode: 'cover' },
    ogunGorselPlaceholder: { width: 40, height: 40, borderRadius: 8, backgroundColor: G.glassGreenStrong, alignItems: 'center', justifyContent: 'center', opacity: 0.5 },
    ogunIsim: { flex: 1, fontSize: 13, fontWeight: '600', color: G.primary },
    kaldirButon: { paddingHorizontal: 6, paddingVertical: 4 },

    ogunBos: { flex: 1, backgroundColor: G.glassGreen, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: G.glassBorderDim, borderStyle: 'dashed' },
    ogunBosMetin: { fontSize: 13, color: G.textLight },

    ipucu: { fontSize: 12, color: G.textLight, textAlign: 'center', marginTop: 8 },

    kaloriKart: { padding: 16, marginBottom: 16 },
    kaloriUstSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    kaloriBaslik: { fontSize: 15, fontWeight: '700', color: G.textDark },
    kaloriDeger: { fontSize: 13, fontWeight: '600', color: G.primary },
    progressArka: { height: 8, backgroundColor: G.glassGreen, borderRadius: 4, overflow: 'hidden' },
    progressOn: { height: 8, backgroundColor: G.primary, borderRadius: 4 },
    kaloriIpucu: { fontSize: 11, color: G.textLight, marginTop: 8, textAlign: 'center' },
  });
}

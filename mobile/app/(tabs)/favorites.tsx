import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { GlassScreen } from '@/components/GlassScreen';
import { Toast } from '@/components/Toast';
import { useGlass } from '@/context/GlassContext';
import { type GlassTokens } from '@/constants/glass';
import { useAuth } from '@/context/AuthContext';
import { useFavorites, type FavoriTarif } from '@/hooks/use-favorites';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/context/I18nContext';

function FavoriKarti({ tarif, onKaldir, onPress, styles, locale }: {
  tarif: FavoriTarif;
  onKaldir: () => void;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  locale: string;
}) {
  const G = useGlass();
  const [gorselYuklendi, setGorselYuklendi] = useState(false);
  const tarih = new Date(tarif.kaydedilmeTarihi).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US');

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.kartSarici}>
      <GlassCard style={styles.kart}>
        <View style={styles.gorselKutu}>
          {!gorselYuklendi && (
            <View style={styles.placeholder}>
              <Feather name="book-open" size={28} color={G.primary} />
            </View>
          )}
          {tarif.gorsel && (
            <Image
              source={{ uri: tarif.gorsel }}
              style={[styles.gorsel, !gorselYuklendi && styles.gorselGizli]}
              onLoad={() => setGorselYuklendi(true)}
              onError={() => setGorselYuklendi(true)}
            />
          )}
        </View>
        <View style={styles.bilgi}>
          <Text style={styles.isim}>{tarif.isim}</Text>
          <View style={styles.tarihSatir}>
            <Feather name="clock" size={11} color={G.textLight} />
            <Text style={styles.tarih}>{tarih}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.kaldir} onPress={onKaldir}>
          <Feather name="x" size={16} color={G.danger} />
        </TouchableOpacity>
      </GlassCard>
    </TouchableOpacity>
  );
}

export default function FavorilerScreen() {
  const router = useRouter();
  const G = useGlass();
  const styles = useMemo(() => makeStyles(G), [G]);
  const { favoriler, yukleniyor, hata, yukle, favoriKaldir } = useFavorites();
  const { kullaniciAdi, yukleniyor: authYukleniyor } = useAuth();
  const { toast, goster } = useToast();
  const { t, locale } = useLocale();

  return (
    <GlassScreen>
      <ScrollView contentContainerStyle={styles.icerik}>
        <Text style={styles.baslik}>{t('favorites.title')}</Text>
        <View style={styles.altBaslikSatir}>
          <Feather name="user" size={13} color={G.textMid} />
          <Text style={styles.altBaslik}>
            {kullaniciAdi ?? t('favorites.guest')} · {t('favorites.count', { count: favoriler.length })}
          </Text>
        </View>

        {(yukleniyor || authYukleniyor) ? (
          <ActivityIndicator color={G.primary} style={{ marginTop: 40 }} />
        ) : hata ? (
          <GlassCard style={styles.bos}>
            <Feather name="alert-triangle" size={48} color={G.warning} style={{ marginBottom: 16 }} />
            <Text style={styles.bosMetin}>{t('favorites.loadError')}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={yukle}>
              <Text style={styles.retryMetin}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : favoriler.length === 0 ? (
          <GlassCard style={styles.bos}>
            <Feather name="heart" size={48} color={G.textLight} style={{ marginBottom: 16 }} />
            <Text style={styles.bosMetin}>{t('favorites.empty')}</Text>
            <Text style={styles.bosAlt}>{t('favorites.emptyHint')}</Text>
            <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/(tabs)' as any)}>
              <Text style={styles.ctaMetin}>{t('favorites.browse')}</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          favoriler.map((tarif, i) => (
            <FavoriKarti
              key={i}
              tarif={tarif}
              styles={styles}
              locale={locale}
              onKaldir={() => {
                Alert.alert(t('favorites.removeConfirm'), t('favorites.removeQuestion', { name: tarif.isim }), [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('favorites.removeAction'), style: 'destructive', onPress: async () => {
                    const basarili = await favoriKaldir(tarif);
                    if (!basarili) goster(t('favorites.removeError'), 'hata');
                  }},
                ]);
              }}
              onPress={() =>
                tarif.id
                  ? router.push({ pathname: '/recipe/[id]', params: { id: String(tarif.id), isim: tarif.isim, gorsel: tarif.gorsel ?? '' } })
                  : undefined
              }
            />
          ))
        )}
      </ScrollView>
      <Toast mesaj={toast.mesaj} tip={toast.tip} gorunur={toast.gorunur} />
    </GlassScreen>
  );
}

function makeStyles(G: GlassTokens) {
  return StyleSheet.create({
    icerik: { padding: 20, paddingTop: 60, paddingBottom: 40 },
    baslik: { fontSize: 32, fontWeight: '800', color: G.primary, marginBottom: 4 },
    altBaslikSatir: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 20 },
    altBaslik: { fontSize: 13, color: G.textMid },

    kartSarici: { marginBottom: 12 },
    kart: { flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
    gorselKutu: { width: 80, height: 80, backgroundColor: G.glassGreen, flexShrink: 0 },
    gorsel: { width: '100%', height: '100%', resizeMode: 'cover' },
    gorselGizli: { position: 'absolute', opacity: 0 },
    placeholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    placeholderIkon: { fontSize: 28 },

    bilgi: { flex: 1, paddingHorizontal: 12 },
    isim: { fontSize: 15, fontWeight: '700', color: G.primary, marginBottom: 4 },
    tarihSatir: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    tarih: { fontSize: 12, color: G.textLight },

    kaldir: { paddingHorizontal: 16, paddingVertical: 20 },

    bos: { padding: 40, alignItems: 'center', marginTop: 40 },
    bosMetin: { fontSize: 16, color: G.textDark, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
    bosAlt: { fontSize: 13, color: G.textLight, textAlign: 'center' },

    retryBtn: { marginTop: 12, backgroundColor: G.glassGreen, borderRadius: G.radius.pill, paddingHorizontal: 20, paddingVertical: 8 },
    retryMetin: { fontSize: 13, fontWeight: '700', color: G.primary },

    ctaBtn: { marginTop: 16, backgroundColor: G.primary, borderRadius: G.radius.pill, paddingHorizontal: 24, paddingVertical: 10 },
    ctaMetin: { fontSize: 14, fontWeight: '700', color: '#fff' },
  });
}

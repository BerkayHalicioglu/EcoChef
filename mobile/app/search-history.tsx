import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { GlassCard } from '@/components/GlassCard';
import { GlassScreen } from '@/components/GlassScreen';
import { AnimatedButton } from '@/components/AnimatedButton';
import { useGlass } from '@/context/GlassContext';
import { type GlassTokens } from '@/constants/glass';
import { useSearchHistory } from '@/hooks/use-search-history';
import { useLocale } from '@/context/I18nContext';

export default function SearchHistoryScreen() {
  const router = useRouter();
  const G = useGlass();
  const styles = useMemo(() => makeStyles(G), [G]);
  const { gecmis, yukleniyor, kaldir, tumunuSil } = useSearchHistory();
  const { t, locale } = useLocale();

  const formatTarih = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <GlassScreen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.geriBtn}>
            <Text style={styles.geriMetin}>{t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.baslik}>{t('searchHistory.title')}</Text>
          {gecmis.length > 0 && (
            <AnimatedButton onPress={() => {
              Alert.alert(t('searchHistory.confirmDeleteAll'), t('searchHistory.confirmDeleteAllMsg'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('searchHistory.deleteAll'), style: 'destructive', onPress: tumunuSil },
              ]);
            }} style={styles.temizleBtn}>
              <Text style={styles.temizleMetin}>{t('searchHistory.deleteAll')}</Text>
            </AnimatedButton>
          )}
        </View>

        {yukleniyor ? (
          <ActivityIndicator color={G.primary} style={{ marginTop: 40 }} />
        ) : gecmis.length === 0 ? (
          <GlassCard style={styles.bos}>
            <Feather name="search" size={48} color={G.textLight} style={{ marginBottom: 16 }} />
            <Text style={styles.bosMetin}>{t('searchHistory.empty')}</Text>
            <Text style={styles.bosAlt}>{t('searchHistory.emptyHint')}</Text>
            <TouchableOpacity style={styles.ctaBtn} onPress={() => router.replace('/(tabs)' as any)}>
              <Text style={styles.ctaMetin}>{t('searchHistory.search')}</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          gecmis.map((kayit) => (
            <GlassCard key={kayit.id} style={styles.kayitKart}>
              <TouchableOpacity
                style={styles.kayitIcerik}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/(tabs)', params: { canliMalzemeler: kayit.sorgu } } as any)}
              >
                <Feather name={kayit.mod === 'metin' ? 'edit-3' : 'camera'} size={18} color={G.textMid} style={styles.modIkon} />
                <View style={styles.kayitBilgi}>
                  <Text style={styles.sorgu} numberOfLines={2}>{kayit.sorgu}</Text>
                  <Text style={styles.tarih}>{formatTarih(kayit.tarih)}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.silBtn} onPress={() => {
                Alert.alert(t('searchHistory.confirmDeleteOne'), t('searchHistory.confirmDeleteOneMsg'), [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: 'Sil', style: 'destructive', onPress: () => kaldir(kayit.id) },
                ]);
              }}>
                <Feather name="x" size={16} color={G.textLight} />
              </TouchableOpacity>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </GlassScreen>
  );
}

function makeStyles(G: GlassTokens) {
  return StyleSheet.create({
    container: { padding: 20, paddingTop: 56, paddingBottom: 48 },

    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 8 },
    geriBtn: { paddingVertical: 4, paddingRight: 8 },
    geriMetin: { fontSize: 16, color: G.primary, fontWeight: '600' },
    baslik: { flex: 1, fontSize: 22, fontWeight: '800', color: G.textDark },
    temizleBtn: { backgroundColor: G.primaryMuted, borderRadius: G.radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
    temizleMetin: { fontSize: 12, color: G.danger, fontWeight: '700' },

    bos: { padding: 40, alignItems: 'center', marginTop: 40 },
    bosMetin: { fontSize: 16, color: G.textDark, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
    bosAlt: { fontSize: 13, color: G.textLight, textAlign: 'center', lineHeight: 20 },

    kayitKart: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    kayitIcerik: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    modIkon: { width: 28, textAlign: 'center' },
    kayitBilgi: { flex: 1 },
    sorgu: { fontSize: 15, fontWeight: '600', color: G.textDark, marginBottom: 3 },
    tarih: { fontSize: 12, color: G.textLight },
    silBtn: { paddingHorizontal: 16, paddingVertical: 20 },
    silMetin: {},

    ctaBtn: { marginTop: 16, backgroundColor: G.primary, borderRadius: G.radius.pill, paddingHorizontal: 24, paddingVertical: 10 },
    ctaMetin: { fontSize: 14, fontWeight: '700', color: '#fff' },
  });
}

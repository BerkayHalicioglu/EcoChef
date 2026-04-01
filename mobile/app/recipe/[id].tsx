import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

type RecipeStep = { numara: number; aciklama: string };

type RecipeDetail = {
  id: number;
  isim: string;
  gorsel: string | null;
  sure_dakika: number | null;
  porsiyon: number | null;
  malzemeler: string[];
  adimlar: RecipeStep[];
};

export default function RecipeDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // Expo Router parametreleri string | string[] dönebilir — her zaman string'e çekiyoruz
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const isim = Array.isArray(params.isim) ? params.isim[0] : params.isim;
  const gorsel = Array.isArray(params.gorsel) ? params.gorsel[0] : params.gorsel;

  const [detay, setDetay] = useState<RecipeDetail | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gorselYuklendi, setGorselYuklendi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`${BASE_URL}/recipes/${id}`)
      .then(r => r.json())
      .then(data => setDetay(data))
      .catch(() => setHata('Tarif detayı yüklenemedi.'))
      .finally(() => setYukleniyor(false));
  }, [id]);

  const gorselUrl = detay?.gorsel ?? (gorsel || null);

  return (
    <ScrollView style={styles.ekran} contentContainerStyle={styles.icerik}>

      {/* Geri butonu */}
      <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
        <Text style={styles.geriMetin}>← Geri</Text>
      </TouchableOpacity>

      {/* Başlık */}
      <Text style={styles.baslik}>{detay?.isim ?? isim}</Text>

      {/* Görsel — placeholder yükleme tamamlanana kadar gösterilir */}
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

      {yukleniyor && (
        <ActivityIndicator size="large" color={YESIL} style={{ marginTop: 32 }} />
      )}

      {hata && <Text style={styles.hataMetin}>{hata}</Text>}

      {detay && (() => {
        const malzemeler = detay.malzemeler ?? [];
        const adimlar = detay.adimlar ?? [];
        return (
          <>
            {/* Meta bilgiler */}
            <View style={styles.metaSatiri}>
              {detay.sure_dakika != null && (
                <View style={styles.metaKutu}>
                  <Text style={styles.metaIkon}>⏱</Text>
                  <Text style={styles.metaDeger}>{detay.sure_dakika} dk</Text>
                </View>
              )}
              {detay.porsiyon != null && (
                <View style={styles.metaKutu}>
                  <Text style={styles.metaIkon}>👤</Text>
                  <Text style={styles.metaDeger}>{detay.porsiyon} kişilik</Text>
                </View>
              )}
              {malzemeler.length > 0 && (
                <View style={styles.metaKutu}>
                  <Text style={styles.metaIkon}>🧂</Text>
                  <Text style={styles.metaDeger}>{malzemeler.length} malzeme</Text>
                </View>
              )}
            </View>

            {/* Malzemeler */}
            {malzemeler.length > 0 && (
              <View style={styles.bolum}>
                <Text style={styles.bolumBaslik}>Malzemeler</Text>
                {malzemeler.map((m, i) => (
                  <View key={i} style={styles.malzemeItem}>
                    <Text style={styles.malzemeNokta}>•</Text>
                    <Text style={styles.malzemeMetin}>{m}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Adımlar */}
            {adimlar.length > 0 && (
              <View style={styles.bolum}>
                <Text style={styles.bolumBaslik}>Yapılışı</Text>
                {adimlar.map((adim, i) => (
                  <View key={i} style={styles.adimKart}>
                    <View style={styles.adimNumaraKutu}>
                      <Text style={styles.adimNumara}>{adim.numara}</Text>
                    </View>
                    <Text style={styles.adimMetin}>{adim.aciklama}</Text>
                  </View>
                ))}
              </View>
            )}

            {adimlar.length === 0 && (
              <View style={styles.bolum}>
                <Text style={styles.adimYok}>Bu tarif için adım adım yapılış bilgisi mevcut değil.</Text>
              </View>
            )}
          </>
        );
      })()}
    </ScrollView>
  );
}

const YESIL = '#2e7d32';

const styles = StyleSheet.create({
  ekran: { flex: 1, backgroundColor: '#f1f8f1' },
  icerik: { padding: 20, paddingBottom: 48 },

  geriButon: { marginTop: 48, marginBottom: 12, alignSelf: 'flex-start' },
  geriMetin: { fontSize: 16, color: YESIL, fontWeight: '600' },

  baslik: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16, lineHeight: 30 },

  gorselKutu: { width: '100%', height: 220, borderRadius: 16, overflow: 'hidden', marginBottom: 16, backgroundColor: '#e8f5e9' },
  gorsel: { width: '100%', height: '100%' },
  gorselGizli: { position: 'absolute', opacity: 0 },
  gorselPlaceholder: {
    width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#e8f5e9',
  },
  placeholderIkon: { fontSize: 56 },

  metaSatiri: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  metaKutu: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12,
    alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  metaIkon: { fontSize: 20, marginBottom: 4 },
  metaDeger: { fontSize: 13, fontWeight: '600', color: '#333', textAlign: 'center' },

  bolum: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  bolumBaslik: { fontSize: 17, fontWeight: 'bold', color: YESIL, marginBottom: 12 },

  malzemeItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  malzemeNokta: { color: YESIL, fontSize: 16, fontWeight: 'bold', lineHeight: 22 },
  malzemeMetin: { fontSize: 14, color: '#444', flex: 1, lineHeight: 22 },

  adimKart: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  adimNumaraKutu: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: YESIL,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  adimNumara: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  adimMetin: { flex: 1, fontSize: 14, color: '#444', lineHeight: 22 },
  adimYok: { fontSize: 14, color: '#999', textAlign: 'center', paddingVertical: 8 },

  hataMetin: { color: '#c62828', textAlign: 'center', marginTop: 24, fontSize: 15 },
});

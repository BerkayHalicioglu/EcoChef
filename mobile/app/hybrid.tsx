import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AnimatedButton } from '@/components/AnimatedButton';
import { GlassCard } from '@/components/GlassCard';
import { GlassScreen } from '@/components/GlassScreen';
import { useGlass } from '@/context/GlassContext';
import { type GlassTokens } from '@/constants/glass';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
const NGROK_HEADER = { 'ngrok-skip-browser-warning': '1' };

type NLPOneri = { isim: string; neden: string };
type HibritSonuc = { tespit_edilen_malzemeler: string[]; nlp_onerileri: NLPOneri[]; mesaj: string };

export default function HibritModScreen() {
  const router = useRouter();
  const G = useGlass();
  const styles = useMemo(() => makeStyles(G), [G]);
  const [secilenGorsel, setSecilenGorsel] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuc, setSonuc] = useState<HibritSonuc | null>(null);

  const gorselSec = async (kaynak: 'galeri' | 'kamera') => {
    const izin =
      kaynak === 'kamera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!izin.granted) {
      Alert.alert('İzin Gerekli', `${kaynak === 'kamera' ? 'Kamera' : 'Galeri'} erişim izni verilmedi.`);
      return;
    }

    const result =
      kaynak === 'kamera'
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.8 });

    if (!result.canceled) {
      setSecilenGorsel(result.assets[0].uri);
      setSonuc(null);
    }
  };

  const hibritAnalizEt = async () => {
    if (!secilenGorsel) return;
    setYukleniyor(true);
    const formData = new FormData();
    formData.append('file', { uri: secilenGorsel, name: 'malzeme.jpg', type: 'image/jpeg' } as any);

    try {
      const response = await fetch(`${BASE_URL}/hybrid-suggest/`, {
        method: 'POST', body: formData, headers: { ...NGROK_HEADER, 'Content-Type': 'multipart/form-data' },
      });
      const data: HibritSonuc = await response.json();
      if (response.ok) setSonuc(data);
      else Alert.alert('Hata', data.mesaj ?? 'Analiz başarısız oldu.');
    } catch {
      Alert.alert('Bağlantı Hatası', 'Backend\'e ulaşılamadı.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <GlassScreen>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.geriBtn}>
            <Text style={styles.geriMetin}>← Geri</Text>
          </TouchableOpacity>
          <View style={styles.baslikSatir}>
            <Text style={styles.baslik}>Hibrit Mod</Text>
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineMetin}>✈ Çevrimdışı</Text>
            </View>
          </View>
        </View>
        <Text style={styles.aciklama}>
          Görselini yükle — YOLO malzemeleri tespit etsin, yerel yapay zeka Türkçe tarif önersin.
        </Text>

        <GlassCard style={styles.kart}>
          {secilenGorsel
            ? <Image source={{ uri: secilenGorsel }} style={styles.onizleme} />
            : (
              <View style={styles.boslukAlani}>
                <Text style={styles.boslukIkon}>🥦</Text>
                <Text style={styles.boslukMetin}>Bir fotoğraf seç</Text>
              </View>
            )
          }
          <View style={styles.ikiliButon}>
            <AnimatedButton style={styles.butonGri} onPress={() => gorselSec('galeri')}>
              <Text style={styles.butonMetni}>🖼 Galeri</Text>
            </AnimatedButton>
            <AnimatedButton style={styles.butonGri} onPress={() => gorselSec('kamera')}>
              <Text style={styles.butonMetni}>📷 Kamera</Text>
            </AnimatedButton>
          </View>

          {secilenGorsel && (
            <AnimatedButton
              style={yukleniyor ? { ...styles.butonAktif, ...styles.butonDisabled } : styles.butonAktif}
              onPress={hibritAnalizEt}
              disabled={yukleniyor}
            >
              {yukleniyor
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.butonMetni}>⚡ Hibrit Analiz Başlat</Text>
              }
            </AnimatedButton>
          )}
        </GlassCard>

        {sonuc && (
          <>
            <GlassCard style={styles.malzemeKutusu}>
              <Text style={styles.bolumBaslik}>🔍 Tespit Edilen Malzemeler</Text>
              <View style={styles.chipSatiri}>
                {sonuc.tespit_edilen_malzemeler.map((m, i) => (
                  <View key={i} style={styles.chip}>
                    <Text style={styles.chipMetni}>{m}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            <Text style={styles.sonucBaslik}>💡 Yapay Zeka Önerileri</Text>
            <GlassCard style={styles.oneriListeKutu}>
              {sonuc.nlp_onerileri.map((oneri, i) => (
                <View key={i} style={[styles.oneriKart, i < sonuc.nlp_onerileri.length - 1 && styles.oneriAyirac]}>
                  <View style={styles.oneriSiraKutu}>
                    <Text style={styles.oneriSira}>{i + 1}</Text>
                  </View>
                  <View style={styles.oneriIcerik}>
                    <Text style={styles.oneriIsim}>{oneri.isim}</Text>
                    <Text style={styles.oneriNeden}>{oneri.neden}</Text>
                  </View>
                </View>
              ))}
            </GlassCard>

            <AnimatedButton style={styles.sifirlaButon} onPress={() => { setSecilenGorsel(null); setSonuc(null); }}>
              <Text style={styles.butonMetni}>🔄 Sıfırla</Text>
            </AnimatedButton>
          </>
        )}
      </ScrollView>
    </GlassScreen>
  );
}

function makeStyles(G: GlassTokens) {
  return StyleSheet.create({
    container: { padding: 20, paddingTop: 56, paddingBottom: 40, alignItems: 'center' },

    header: { width: '100%', marginBottom: 8 },
    geriBtn: { marginBottom: 12 },
    geriMetin: { fontSize: 16, color: G.accent, fontWeight: '600' },
    baslikSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    baslik: { fontSize: 32, fontWeight: '800', color: G.accent },
    offlineBadge: { backgroundColor: G.glassGreen, borderRadius: G.radius.pill, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: G.glassBorder },
    offlineMetin: { fontSize: 12, color: G.accent, fontWeight: '700' },
    aciklama: { fontSize: 13, color: G.textMid, textAlign: 'center', marginBottom: 20, lineHeight: 20, width: '100%' },

    kart: { width: '100%', padding: 16, marginBottom: 16 },
    boslukAlani: {
      width: '100%', height: 160, backgroundColor: G.glassGreen, borderRadius: G.radius.md,
      alignItems: 'center', justifyContent: 'center', marginBottom: 12,
      borderWidth: 1.5, borderColor: G.glassBorder, borderStyle: 'dashed',
    },
    boslukIkon: { fontSize: 40, marginBottom: 8 },
    boslukMetin: { color: G.accent, fontWeight: '600', fontSize: 14 },
    onizleme: { width: '100%', height: 200, borderRadius: G.radius.md, marginBottom: 12, resizeMode: 'cover' },

    ikiliButon: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    butonGri: { flex: 1, padding: 13, borderRadius: G.radius.pill, alignItems: 'center', justifyContent: 'center', minHeight: 48, backgroundColor: G.glassGreenStrong },
    butonAktif: { padding: 13, borderRadius: G.radius.pill, alignItems: 'center', justifyContent: 'center', minHeight: 48, backgroundColor: G.accent },
    butonDisabled: { opacity: 0.6 },
    butonMetni: { color: '#fff', fontSize: 15, fontWeight: '600' },

    bolumBaslik: { fontSize: 15, fontWeight: '700', color: G.textDark, marginBottom: 10 },
    malzemeKutusu: { width: '100%', padding: 14, marginBottom: 14 },
    chipSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    chip: { backgroundColor: G.accent, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    chipMetni: { color: '#fff', fontSize: 13, fontWeight: '500' },

    sonucBaslik: { fontSize: 18, fontWeight: '800', color: G.textDark, marginBottom: 10, alignSelf: 'flex-start' },
    oneriListeKutu: { width: '100%', padding: 4, marginBottom: 14 },
    oneriKart: { width: '100%', padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    oneriAyirac: { borderBottomWidth: 1, borderBottomColor: G.glassBorder },
    oneriSiraKutu: { width: 36, height: 36, borderRadius: 18, backgroundColor: G.accent, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    oneriSira: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    oneriIcerik: { flex: 1 },
    oneriIsim: { fontSize: 16, fontWeight: '700', color: G.accent, marginBottom: 4 },
    oneriNeden: { fontSize: 13, color: G.textMid, lineHeight: 18 },

    sifirlaButon: { width: '100%', padding: 13, borderRadius: G.radius.pill, alignItems: 'center', backgroundColor: G.glassGreenStrong, marginTop: 8 },
  });
}

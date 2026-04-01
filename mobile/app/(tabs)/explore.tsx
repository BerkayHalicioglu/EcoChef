import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
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

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

type NLPOneri = {
  isim: string;
  neden: string;
};

type HibritSonuc = {
  tespit_edilen_malzemeler: string[];
  nlp_onerileri: NLPOneri[];
  mesaj: string;
};

export default function HibritModScreen() {
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
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data: HibritSonuc = await response.json();
      if (response.ok) {
        setSonuc(data);
      } else {
        Alert.alert('Hata', data.mesaj ?? 'Analiz başarısız oldu.');
      }
    } catch {
      Alert.alert('Bağlantı Hatası', 'Backend\'e ulaşılamadı.');
    } finally {
      setYukleniyor(false);
    }
  };

  const sifirla = () => {
    setSecilenGorsel(null);
    setSonuc(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.baslik}>Hibrit Mod</Text>
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineMetin}>✈ Çevrimdışı Çalışır</Text>
        </View>
      </View>
      <Text style={styles.aciklama}>
        Görselini yükle — YOLO malzemeleri tespit etsin, yerel yapay zeka Türkçe tarif önersin.
        İnternet bağlantısı gerekmez.
      </Text>

      {/* GÖRSEL SEÇİCİ */}
      <View style={styles.kart}>
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
          <TouchableOpacity style={[styles.buton, styles.butonGri]} onPress={() => gorselSec('galeri')}>
            <Text style={styles.butonMetni}>🖼 Galeri</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.buton, styles.butonGri]} onPress={() => gorselSec('kamera')}>
            <Text style={styles.butonMetni}>📷 Kamera</Text>
          </TouchableOpacity>
        </View>

        {secilenGorsel && (
          <TouchableOpacity
            style={[styles.buton, styles.butonMor, yukleniyor && styles.butonDisabled]}
            onPress={hibritAnalizEt}
            disabled={yukleniyor}
          >
            {yukleniyor
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.butonMetni}>⚡ Hibrit Analiz Başlat</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      {/* SONUÇLAR */}
      {sonuc && (
        <>
          {/* Tespit edilen malzemeler */}
          <View style={styles.malzemeKutusu}>
            <Text style={styles.bolumBaslik}>🔍 Tespit Edilen Malzemeler</Text>
            <View style={styles.chipSatiri}>
              {sonuc.tespit_edilen_malzemeler.map((m, i) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipMetni}>{m}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* NLP Önerileri */}
          <Text style={styles.sonucBaslik}>💡 Yapay Zeka Önerileri</Text>
          {sonuc.nlp_onerileri.map((oneri, i) => (
            <View key={i} style={styles.oneriKart}>
              <View style={styles.oneriSiraKutu}>
                <Text style={styles.oneriSira}>{i + 1}</Text>
              </View>
              <View style={styles.oneriIcerik}>
                <Text style={styles.oneriIsim}>{oneri.isim}</Text>
                <Text style={styles.oneriNeden}>{oneri.neden}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity style={[styles.buton, styles.butonGri, { marginTop: 8 }]} onPress={sifirla}>
            <Text style={styles.butonMetni}>🔄 Sıfırla</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const MOR = '#6a1b9a';
const GRI = '#546e7a';

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f3e5f5', alignItems: 'center', paddingBottom: 40 },

  header: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 48, marginBottom: 8 },
  baslik: { fontSize: 32, fontWeight: 'bold', color: MOR },
  offlineBadge: { backgroundColor: '#ce93d8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  offlineMetin: { fontSize: 12, color: '#4a148c', fontWeight: '600' },
  aciklama: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 20, lineHeight: 20 },

  kart: {
    width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8,
  },
  boslukAlani: {
    width: '100%', height: 160, backgroundColor: '#f8f0ff', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 2, borderColor: '#e1bee7', borderStyle: 'dashed',
  },
  boslukIkon: { fontSize: 40, marginBottom: 8 },
  boslukMetin: { color: '#ab47bc', fontWeight: '600' },
  onizleme: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12, resizeMode: 'cover' },

  ikiliButon: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  buton: { flex: 1, padding: 13, borderRadius: 25, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  butonGri: { backgroundColor: GRI },
  butonMor: { backgroundColor: MOR },
  butonDisabled: { opacity: 0.6 },
  butonMetni: { color: '#fff', fontSize: 15, fontWeight: '600' },

  bolumBaslik: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 10 },
  malzemeKutusu: { width: '100%', backgroundColor: '#ede7f6', borderRadius: 14, padding: 14, marginBottom: 14 },
  chipSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { backgroundColor: MOR, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  chipMetni: { color: '#fff', fontSize: 13, fontWeight: '500' },

  sonucBaslik: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, alignSelf: 'flex-start' },

  oneriKart: {
    width: '100%', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6,
  },
  oneriSiraKutu: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: MOR,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  oneriSira: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  oneriIcerik: { flex: 1 },
  oneriIsim: { fontSize: 16, fontWeight: 'bold', color: MOR, marginBottom: 4 },
  oneriNeden: { fontSize: 13, color: '#666', lineHeight: 18 },
});

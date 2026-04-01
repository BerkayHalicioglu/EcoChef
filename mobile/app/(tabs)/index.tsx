import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

type Tarif = {
  id?: number;
  isim: string;
  gorsel?: string;
  kullanilan_malzemeler?: string[];
  eksik_malzemeler?: string[];
  neden?: string;
};

type GorselSonuc = {
  tespit_edilen_malzemeler: string[];
  bulunan_tarifler: Tarif[];
};

type MetinSonuc = {
  sonuclar: Tarif[];
};

function TarifKarti({ tarif, onPress }: { tarif: Tarif; onPress: () => void }) {
  const [gorselYuklendi, setGorselYuklendi] = useState(false);

  return (
    <TouchableOpacity style={styles.tarifKart} onPress={onPress} activeOpacity={0.85}>
      {/* Görsel + placeholder */}
      <View style={styles.tarifGorselKutu}>
        {!gorselYuklendi && (
          <View style={styles.tarifPlaceholder}>
            <Text style={styles.tarifPlaceholderIkon}>🍽</Text>
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
      </View>

      <Text style={styles.tarifIsim}>{tarif.isim}</Text>

      {tarif.neden && (
        <Text style={styles.tarifNeden}>{tarif.neden}</Text>
      )}

      {(tarif.kullanilan_malzemeler ?? []).length > 0 && (
        <View style={styles.malzemeSatiri}>
          <Text style={styles.malzemeEtiket}>✅ Elinizde var:</Text>
          <Text style={styles.malzemeListe}>{tarif.kullanilan_malzemeler!.join(', ')}</Text>
        </View>
      )}

      {(tarif.eksik_malzemeler ?? []).length > 0 && (
        <View style={styles.malzemeSatiri}>
          <Text style={styles.eksikEtiket}>🛒 Eksik:</Text>
          <Text style={styles.malzemeListe}>{tarif.eksik_malzemeler!.join(', ')}</Text>
        </View>
      )}

      {tarif.id && (
        <Text style={styles.detayLink}>Tarifi görüntüle →</Text>
      )}
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [secilenGorsel, setSecilenGorsel] = useState<string | null>(null);
  const [kullaniciMetni, setKullaniciMetni] = useState('');
  const [gorselYukleniyor, setGorselYukleniyor] = useState(false);
  const [metinYukleniyor, setMetinYukleniyor] = useState(false);
  const [tespitEdilenMalzemeler, setTespitEdilenMalzemeler] = useState<string[]>([]);
  const [tarifler, setTarifler] = useState<Tarif[]>([]);
  const [mod, setMod] = useState<'gorsel' | 'metin' | null>(null);

  const gorselSec = async (kaynak: 'galeri' | 'kamera') => {
    const izin =
      kaynak === 'kamera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!izin.granted) {
      Alert.alert('İzin Gerekli', `${kaynak === 'kamera' ? 'Kamera' : 'Galeri'} erişim izni verilmedi.`);
      return;
    }

    const sonuc =
      kaynak === 'kamera'
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.8 });

    if (!sonuc.canceled) {
      setSecilenGorsel(sonuc.assets[0].uri);
      setTarifler([]);
      setTespitEdilenMalzemeler([]);
    }
  };

  const gorselAnalizEt = async () => {
    if (!secilenGorsel) return;
    setGorselYukleniyor(true);
    setMod('gorsel');

    const formData = new FormData();
    formData.append('file', { uri: secilenGorsel, name: 'malzeme.jpg', type: 'image/jpeg' } as any);

    try {
      const response = await fetch(`${BASE_URL}/detect-ingredients/`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data: GorselSonuc = await response.json();
      if (response.ok) {
        setTespitEdilenMalzemeler(data.tespit_edilen_malzemeler ?? []);
        setTarifler(data.bulunan_tarifler ?? []);
      } else {
        Alert.alert('Hata', 'Analiz başarısız oldu.');
      }
    } catch {
      Alert.alert('Bağlantı Hatası', 'Backend\'e ulaşılamadı.');
    } finally {
      setGorselYukleniyor(false);
    }
  };

  const metinAnalizEt = async () => {
    if (!kullaniciMetni.trim()) return;
    setMetinYukleniyor(true);
    setMod('metin');
    setTespitEdilenMalzemeler([]);

    try {
      const response = await fetch(`${BASE_URL}/analyze-text-ingredients/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: kullaniciMetni }),
      });
      const data: MetinSonuc = await response.json();
      if (response.ok) {
        setTarifler(data.sonuclar ?? []);
      } else {
        Alert.alert('Hata', 'NLP analizi başarısız oldu.');
      }
    } catch {
      Alert.alert('Bağlantı Hatası', 'Backend\'e ulaşılamadı.');
    } finally {
      setMetinYukleniyor(false);
    }
  };

  const sifirla = () => {
    setSecilenGorsel(null);
    setKullaniciMetni('');
    setTarifler([]);
    setTespitEdilenMalzemeler([]);
    setMod(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.baslik}>EcoChef</Text>
      <Text style={styles.altBaslik}>Mutfağındaki malzemeleri keşfet</Text>

      {/* --- GÖRSEL BÖLÜMÜ --- */}
      <View style={styles.kart}>
        <Text style={styles.bolumBaslik}>📸 Görsel Analiz</Text>
        {secilenGorsel && (
          <Image source={{ uri: secilenGorsel }} style={styles.onizleme} />
        )}
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
            style={[styles.buton, styles.butonTuruncu, gorselYukleniyor && styles.butonDisabled]}
            onPress={gorselAnalizEt}
            disabled={gorselYukleniyor}
          >
            {gorselYukleniyor
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.butonMetni}>Görseli Analiz Et</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.ayirac}>
        <View style={styles.ayiracCizgi} />
        <Text style={styles.ayiracMetin}>VEYA</Text>
        <View style={styles.ayiracCizgi} />
      </View>

      {/* --- METİN BÖLÜMÜ --- */}
      <View style={styles.kart}>
        <Text style={styles.bolumBaslik}>✍️ Metin ile Öneri Al</Text>
        <TextInput
          style={styles.input}
          placeholder="Örn: Evde tavuk, mantar ve soğan var..."
          placeholderTextColor="#aaa"
          value={kullaniciMetni}
          onChangeText={setKullaniciMetni}
          multiline
          numberOfLines={3}
        />
        <TouchableOpacity
          style={[styles.buton, styles.butonYesil, metinYukleniyor && styles.butonDisabled]}
          onPress={metinAnalizEt}
          disabled={metinYukleniyor}
        >
          {metinYukleniyor
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.butonMetni}>Öneri Al</Text>
          }
        </TouchableOpacity>
      </View>

      {/* --- TESPİT EDİLEN MALZEMELER --- */}
      {tespitEdilenMalzemeler.length > 0 && (
        <View style={styles.malzemeKutusu}>
          <Text style={styles.bolumBaslik}>Tespit Edilen Malzemeler</Text>
          <View style={styles.chipSatiri}>
            {tespitEdilenMalzemeler.map((malzeme, i) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipMetni}>{malzeme}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* --- SONUÇLAR --- */}
      {tarifler.length > 0 && (
        <View style={styles.sonucBolum}>
          <Text style={styles.sonucBaslik}>
            {mod === 'gorsel' ? '🍽 Bulunan Tarifler' : '💡 Önerilen Tarifler'}
          </Text>
          {tarifler.map((tarif, i) => (
            <TarifKarti
              key={i}
              tarif={tarif}
              onPress={() => tarif.id
                ? router.push({ pathname: '/recipe/[id]', params: { id: String(tarif.id), isim: tarif.isim, gorsel: tarif.gorsel ?? '' } })
                : null
              }
            />
          ))}

          <TouchableOpacity style={[styles.buton, styles.butonGri, { marginTop: 8 }]} onPress={sifirla}>
            <Text style={styles.butonMetni}>🔄 Sıfırla</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const YESIL = '#2e7d32';
const TURUNCU = '#e65100';
const GRI = '#546e7a';

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f1f8f1', alignItems: 'center', paddingBottom: 40 },
  baslik: { fontSize: 36, fontWeight: 'bold', color: YESIL, marginTop: 48, letterSpacing: 1 },
  altBaslik: { fontSize: 14, color: '#777', marginBottom: 24, marginTop: 4 },

  kart: {
    width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8,
  },
  bolumBaslik: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },

  onizleme: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12, resizeMode: 'cover' },

  ikiliButon: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  buton: { flex: 1, padding: 13, borderRadius: 25, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  butonGri: { backgroundColor: GRI },
  butonTuruncu: { backgroundColor: TURUNCU },
  butonYesil: { backgroundColor: YESIL },
  butonDisabled: { opacity: 0.6 },
  butonMetni: { color: '#fff', fontSize: 15, fontWeight: '600' },

  input: {
    backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd',
    borderRadius: 10, padding: 12, marginBottom: 10, minHeight: 80,
    textAlignVertical: 'top', fontSize: 14, color: '#333',
  },

  ayirac: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 4 },
  ayiracCizgi: { flex: 1, height: 1, backgroundColor: '#ddd' },
  ayiracMetin: { marginHorizontal: 12, color: '#aaa', fontSize: 12, fontWeight: '600' },

  malzemeKutusu: {
    width: '100%', backgroundColor: '#e8f5e9', borderRadius: 14,
    padding: 14, marginBottom: 12,
  },
  chipSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { backgroundColor: YESIL, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  chipMetni: { color: '#fff', fontSize: 13, fontWeight: '500' },

  sonucBolum: { width: '100%' },
  sonucBaslik: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 12 },

  tarifKart: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6,
  },
  tarifGorselKutu: { width: '100%', height: 160, borderRadius: 10, marginBottom: 10, overflow: 'hidden', backgroundColor: '#e8f5e9' },
  tarifGorsel: { width: '100%', height: '100%', resizeMode: 'cover' },
  gorselGizli: { position: 'absolute', opacity: 0 },
  tarifPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  tarifPlaceholderIkon: { fontSize: 40 },
  tarifIsim: { fontSize: 17, fontWeight: 'bold', color: YESIL, marginBottom: 4 },
  detayLink: { fontSize: 13, color: YESIL, fontWeight: '600', marginTop: 10, textAlign: 'right' },
  tarifNeden: { fontSize: 13, color: '#666', marginBottom: 8, lineHeight: 18 },
  malzemeSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  malzemeEtiket: { fontSize: 12, fontWeight: '700', color: '#388e3c' },
  eksikEtiket: { fontSize: 12, fontWeight: '700', color: '#e65100' },
  malzemeListe: { fontSize: 12, color: '#555', flexShrink: 1 },
});

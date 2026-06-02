import { CameraView, useCameraPermissions } from 'expo-camera';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedButton } from '@/components/AnimatedButton';
import { useGlass } from '@/context/GlassContext';
import { type GlassTokens } from '@/constants/glass';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
const NGROK_HEADER = { 'ngrok-skip-browser-warning': '1' };
const TARAMA_ARALIĞI_MS = 3000;

export default function LiveScanScreen() {
  const router = useRouter();
  const G = useGlass();
  const styles = useMemo(() => makeStyles(G), [G]);
  const insets = useSafeAreaInsets();
  const [izin, izinIste] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const [taramaAktif, setTaramaAktif] = useState(false);
  const [analizediliyor, setAnalizEdiIyor] = useState(false);
  const [malzemeler, setMalzemeler] = useState<string[]>([]);
  const [hata, setHata] = useState<string | null>(null);
  const [duzenlemeModu, setDuzenlemeModu] = useState(false);
  const [yeniMalzeme, setYeniMalzeme] = useState('');
  const [flaşAktif, setFlaşAktif] = useState(false);

  // Çerçeve renk animasyonu: 0=beyaz, 0.5=sarı(analiz), 1=yeşil(bulundu)
  const koseRenkAnim = useRef(new Animated.Value(0)).current;
  const prevMalzemeCount = useRef(0);

  const koseRenk = koseRenkAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['rgba(255,255,255,0.85)', '#FFD600', '#4EAF55'],
  });
  const koseBorderWidth = koseRenkAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [3, 3, 4],
  });

  useEffect(() => {
    if (analizediliyor) {
      Animated.timing(koseRenkAnim, { toValue: 0.5, duration: 250, useNativeDriver: false }).start();
    } else {
      Animated.timing(koseRenkAnim, { toValue: 0, duration: 400, useNativeDriver: false }).start();
    }
  }, [analizediliyor]);

  useEffect(() => {
    if (malzemeler.length > prevMalzemeCount.current) {
      Animated.sequence([
        Animated.timing(koseRenkAnim, { toValue: 1, duration: 150, useNativeDriver: false }),
        Animated.delay(700),
        Animated.timing(koseRenkAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
      ]).start();
    }
    prevMalzemeCount.current = malzemeler.length;
  }, [malzemeler.length]);

  useEffect(() => {
    if (!taramaAktif) return;
    const interval = setInterval(async () => {
      if (analizediliyor) return;
      await cekveAnaliz();
    }, TARAMA_ARALIĞI_MS);
    return () => clearInterval(interval);
  }, [taramaAktif, analizediliyor]);

  const cekveAnaliz = async () => {
    if (!cameraRef.current) return;
    setAnalizEdiIyor(true);
    setHata(null);
    try {
      const foto = await cameraRef.current.takePictureAsync({ quality: 0.5, skipProcessing: true });
      if (!foto) return;
      const formData = new FormData();
      formData.append('file', { uri: foto.uri, name: 'canli.jpg', type: 'image/jpeg' } as any);
      const response = await fetch(`${BASE_URL}/detect-ingredients/`, {
        method: 'POST',
        body: formData,
        headers: { ...NGROK_HEADER, 'Content-Type': 'multipart/form-data' },
      });
      if (response.ok) {
        const data = await response.json();
        const yeni: string[] = data.tespit_edilen_malzemeler ?? [];
        setMalzemeler((onceki) => [...new Set([...onceki, ...yeni])]);
      }
    } catch {
      setHata('Backend\'e ulaşılamadı');
    } finally {
      setAnalizEdiIyor(false);
    }
  };

  const malzemeEkle = () => {
    const temiz = yeniMalzeme.trim();
    if (temiz && !malzemeler.includes(temiz)) setMalzemeler((p) => [...p, temiz]);
    setYeniMalzeme('');
  };

  if (!izin) {
    return (
      <View style={[styles.merkez, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={G.primary} />
      </View>
    );
  }

  if (!izin.granted) {
    return (
      <View style={[styles.merkez, { paddingTop: insets.top }]}>
        <Feather name="camera-off" size={56} color={G.textLight} style={{ marginBottom: 16 }} />
        <Text style={styles.izinMetin}>Kamera erişimi gerekli.</Text>
        <AnimatedButton style={styles.izinButon} onPress={izinIste}>
          <Text style={styles.butonMetni}>İzin Ver</Text>
        </AnimatedButton>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.kamera} facing="back" enableTorch={flaşAktif} />

      {/* Üst bar */}
      <View style={[styles.ustBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.ikonButon}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="x" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.durumKutu}>
          {taramaAktif ? (
            <View style={styles.aktifGostergesi}>
              {analizediliyor
                ? <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
                : <View style={styles.kirmizi} />
              }
              <Text style={styles.durumMetin}>
                {analizediliyor ? 'Analiz ediliyor...' : 'Canlı Tarama'}
              </Text>
            </View>
          ) : (
            <View style={styles.aktifGostergesi}>
              <Feather name="pause-circle" size={14} color="rgba(255,255,255,0.7)" style={{ marginRight: 6 }} />
              <Text style={styles.durumMetin}>Hazır</Text>
            </View>
          )}
        </View>

        {/* Flaş toggle */}
        <TouchableOpacity
          style={[styles.ikonButon, flaşAktif && styles.ikonButonAktif]}
          onPress={() => setFlaşAktif((v) => !v)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name={flaşAktif ? 'zap' : 'zap-off'} size={20} color={flaşAktif ? '#FFD600' : '#fff'} />
        </TouchableOpacity>
      </View>

      {/* Tarama çerçevesi */}
      {!duzenlemeModu && (
        <View style={styles.cerceveSarici} pointerEvents="none">
          <Animated.View style={[styles.cerceve, taramaAktif && { opacity: pulseAnim }]}>
            <Animated.View style={[styles.kose, styles.koseSolUst, { borderColor: koseRenk, borderTopWidth: koseBorderWidth, borderLeftWidth: koseBorderWidth }]} />
            <Animated.View style={[styles.kose, styles.koseSagUst, { borderColor: koseRenk, borderTopWidth: koseBorderWidth, borderRightWidth: koseBorderWidth }]} />
            <Animated.View style={[styles.kose, styles.koseSolAlt, { borderColor: koseRenk, borderBottomWidth: koseBorderWidth, borderLeftWidth: koseBorderWidth }]} />
            <Animated.View style={[styles.kose, styles.koseSagAlt, { borderColor: koseRenk, borderBottomWidth: koseBorderWidth, borderRightWidth: koseBorderWidth }]} />
          </Animated.View>
          <Text style={styles.cerceveMesaj}>
            {taramaAktif ? 'Malzemeleri çerçeve içine al' : 'Başlatmak için aşağıdaki butona bas'}
          </Text>
        </View>
      )}

      {/* Alt panel */}
      <View style={[styles.altPanel, { paddingBottom: insets.bottom + 16 }]}>
        {duzenlemeModu ? (
          <>
            <View style={styles.satirBaslik}>
              <Text style={styles.malzemeBaslik}>Malzemeleri Düzenle</Text>
              <TouchableOpacity
                onPress={() => setDuzenlemeModu(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.temizle}>← Geri</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chipSatiri}>
              {malzemeler.map((m, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.chipSilinebilir}
                  onPress={() => setMalzemeler((prev) => prev.filter((_, idx) => idx !== i))}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Text style={styles.chipMetni}>{m}</Text>
                  <Feather name="x" size={12} color="#fff" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.ekleSatiri}>
              <TextInput
                style={styles.malzemeInput}
                placeholder="Malzeme ekle..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={yeniMalzeme}
                onChangeText={setYeniMalzeme}
                onSubmitEditing={malzemeEkle}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.ekleButon} onPress={malzemeEkle}>
                <Feather name="plus" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <AnimatedButton
              style={[styles.buton, styles.butonTarif, { marginTop: 12 }]}
              onPress={() => {
                if (malzemeler.length === 0) return;
                setDuzenlemeModu(false);
                router.push({ pathname: '/(tabs)', params: { canliMalzemeler: malzemeler.join(', ') } });
              }}
            >
              <Feather name="search" size={16} color="#fff" />
              <Text style={styles.butonMetni}>Tarif Ara  ({malzemeler.length} malzeme)</Text>
            </AnimatedButton>
          </>
        ) : (
          <>
            {malzemeler.length > 0 && (
              <View style={styles.malzemeAlani}>
                <View style={styles.satirBaslik}>
                  <Text style={styles.malzemeBaslik}>Tespit edilenler ({malzemeler.length})</Text>
                  <TouchableOpacity
                    onPress={() => setMalzemeler([])}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.temizle}>Temizle</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.chipSatiri}>
                  {malzemeler.map((m, i) => (
                    <View key={i} style={styles.chip}>
                      <Text style={styles.chipMetni}>{m}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {hata && (
              <View style={styles.hataSatiri}>
                <Feather name="alert-triangle" size={14} color={G.danger} style={{ marginRight: 6 }} />
                <Text style={styles.hataMetin}>{hata}</Text>
              </View>
            )}

            <View style={styles.butonSatiri}>
              <AnimatedButton
                style={[styles.buton, taramaAktif ? styles.butonDur : styles.butonBaslat]}
                onPress={() => setTaramaAktif((v) => !v)}
              >
                <Feather name={taramaAktif ? 'pause' : 'play'} size={16} color="#fff" />
                <Text style={styles.butonMetni}>
                  {taramaAktif ? 'Durdur' : 'Taramayı Başlat'}
                </Text>
              </AnimatedButton>

              {malzemeler.length > 0 && (
                <AnimatedButton
                  style={[styles.buton, styles.butonTarif]}
                  onPress={() => { setTaramaAktif(false); setDuzenlemeModu(true); }}
                >
                  <Feather name="edit-2" size={16} color="#fff" />
                  <Text style={styles.butonMetni}>Düzenle & Ara</Text>
                </AnimatedButton>
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function makeStyles(G: GlassTokens) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    merkez: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: G.bgColor, padding: 32 },
    kamera: { flex: 1 },

    // Üst bar
    ustBar: {
      position: 'absolute', top: 0, left: 0, right: 0,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20,
    },
    ikonButon: {
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: 'rgba(0,0,0,0.45)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center', justifyContent: 'center',
    },
    ikonButonAktif: {
      backgroundColor: 'rgba(255,214,0,0.18)',
      borderColor: 'rgba(255,214,0,0.5)',
    },
    durumKutu: {
      backgroundColor: 'rgba(0,0,0,0.45)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
      borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8,
    },
    aktifGostergesi: { flexDirection: 'row', alignItems: 'center' },
    kirmizi: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f44336', marginRight: 6 },
    durumMetin: { color: '#fff', fontSize: 13, fontWeight: '600' },

    // Tarama çerçevesi
    cerceveSarici: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
    cerceve: { width: 260, height: 260, position: 'relative' },
    kose: { position: 'absolute', width: 28, height: 28, borderRadius: 4 },
    koseSolUst: { top: 0, left: 0 },
    koseSagUst: { top: 0, right: 0 },
    koseSolAlt: { bottom: 0, left: 0 },
    koseSagAlt: { bottom: 0, right: 0 },
    cerceveMesaj: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 16, textAlign: 'center' },

    // Alt panel
    altPanel: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: 'rgba(8,20,8,0.88)',
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      borderTopWidth: 1, borderColor: 'rgba(80,170,80,0.2)',
      paddingTop: 20, paddingHorizontal: 20,
    },
    satirBaslik: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    malzemeAlani: { marginBottom: 14 },
    malzemeBaslik: { color: 'rgba(255,255,255,0.92)', fontWeight: '700', fontSize: 14 },
    temizle: { color: G.danger, fontSize: 13, fontWeight: '600' },
    chipSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
    chip: {
      backgroundColor: 'rgba(46,125,50,0.85)',
      borderWidth: 1, borderColor: 'rgba(100,200,100,0.3)',
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    },
    chipSilinebilir: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: 'rgba(183,28,28,0.75)',
      borderWidth: 1, borderColor: 'rgba(255,100,100,0.3)',
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    },
    chipMetni: { color: '#fff', fontSize: 13, fontWeight: '500' },
    hataSatiri: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    hataMetin: { color: G.danger, fontSize: 12 },

    butonSatiri: { flexDirection: 'row', gap: 10 },
    buton: { flex: 1, flexDirection: 'row', gap: 8, paddingVertical: 15, borderRadius: G.radius.pill, alignItems: 'center', justifyContent: 'center' },
    butonBaslat: { backgroundColor: G.primary },
    butonDur: { backgroundColor: '#b71c1c' },
    butonTarif: { backgroundColor: '#1565c0' },
    butonMetni: { color: '#fff', fontSize: 15, fontWeight: '700' },

    // Malzeme düzenleme
    ekleSatiri: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 4 },
    malzemeInput: {
      flex: 1, backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
      color: '#fff', fontSize: 14,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    ekleButon: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: G.primary, alignItems: 'center', justifyContent: 'center',
    },

    // İzin ekranı
    izinMetin: { color: G.textDark, fontSize: 16, marginBottom: 24, textAlign: 'center', fontWeight: '500' },
    izinButon: { backgroundColor: G.primary, borderRadius: G.radius.pill, paddingHorizontal: 36, paddingVertical: 14 },
  });
}

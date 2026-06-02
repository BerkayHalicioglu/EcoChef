import Feather from '@expo/vector-icons/Feather';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NetworkDurum } from '@/hooks/use-network-status';

type Props = { durum: NetworkDurum };

const MESAJLAR: Record<Exclude<NetworkDurum, 'online'>, { ikon: 'wifi-off' | 'alert-triangle'; baslik: string; alt: string }> = {
  cevrimdisi: {
    ikon: 'wifi-off',
    baslik: 'Çevrimdışısınız',
    alt: 'İnternet bağlantısı yok — önbellek gösteriliyor',
  },
  backend_kapali: {
    ikon: 'alert-triangle',
    baslik: 'Sunucuya ulaşılamıyor',
    alt: 'Bağlantı kesildi — önbellek gösteriliyor',
  },
};

const KART_YUKSEKLIK = 72;

export function OfflineBanner({ durum }: Props) {
  const { top } = useSafeAreaInsets();
  const [kapali, setKapali] = useState(false);

  // Durum değişince (yeniden çevrimdışı olunca) kartı tekrar göster
  const oncekiDurum = useRef(durum);
  useEffect(() => {
    if (durum !== 'online' && oncekiDurum.current !== durum) {
      setKapali(false);
    }
    oncekiDurum.current = durum;
  }, [durum]);

  const translateY = useRef(new Animated.Value(-(KART_YUKSEKLIK + 20))).current;
  const gorunur = durum !== 'online' && !kapali;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: gorunur ? top + 8 : -(KART_YUKSEKLIK + 20),
      useNativeDriver: true,
      damping: 16,
      stiffness: 180,
    }).start();
  }, [gorunur, top]);

  if (durum === 'online') return null;

  const info = MESAJLAR[durum];
  const renkler = durum === 'cevrimdisi'
    ? { bg: '#C62828', border: '#E53935' }
    : { bg: '#E65100', border: '#F57C00' };

  return (
    <Animated.View
      style={[
        styles.kart,
        {
          backgroundColor: renkler.bg,
          borderColor: renkler.border,
          transform: [{ translateY }],
          height: KART_YUKSEKLIK,
        },
      ]}
    >
      <Feather name={info.ikon} size={20} color="#fff" />
      <Animated.View style={styles.metinKutu}>
        <Text style={styles.baslik}>{info.baslik}</Text>
        <Text style={styles.alt}>{info.alt}</Text>
      </Animated.View>
      <TouchableOpacity
        style={styles.kapat}
        onPress={() => setKapali(true)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="x" size={14} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  kart: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  ikon: {},
  metinKutu: { flex: 1 },
  baslik: { color: '#fff', fontSize: 13, fontWeight: '700' },
  alt: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 1 },
  kapat: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kapatMetin: {},
});

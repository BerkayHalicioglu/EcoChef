import Feather from '@expo/vector-icons/Feather';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlass } from '@/context/GlassContext';

export type ToastTipi = 'hata' | 'basari' | 'bilgi';

type Props = {
  mesaj: string;
  tip: ToastTipi;
  gorunur: boolean;
};

const IKONLAR: Record<ToastTipi, 'x' | 'check' | 'info'> = {
  hata: 'x',
  basari: 'check',
  bilgi: 'info',
};

export function Toast({ mesaj, tip, gorunur }: Props) {
  const G = useGlass();
  const { bottom } = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const RENKLER: Record<ToastTipi, string> = {
    hata: G.danger,
    basari: G.primary,
    bilgi: G.warning,
  };

  useEffect(() => {
    if (gorunur) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 80, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [gorunur]);

  // Tab bar yüksekliği: 60 + safe area bottom + biraz boşluk
  const bottomOffset = 60 + bottom + 12;

  return (
    <Animated.View
      style={[
        styles.kutu,
        { backgroundColor: RENKLER[tip], bottom: bottomOffset, transform: [{ translateY }], opacity },
      ]}
      pointerEvents="none"
    >
      <Feather name={IKONLAR[tip]} size={16} color="#fff" />
      <Text style={styles.metin}>{mesaj}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  kutu: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    zIndex: 999,
  },
  ikon: { width: 20, alignItems: 'center' },
  metin: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
});

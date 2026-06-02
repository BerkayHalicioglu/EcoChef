import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useGlass } from '@/context/GlassContext';

function SkeletonKutu({ genislik, yukseklik, borderRadius = 8, baseColor, shimColor }: {
  genislik: number | string;
  yukseklik: number;
  borderRadius?: number;
  baseColor: string;
  shimColor: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: [baseColor, shimColor] });

  return (
    <Animated.View
      style={[{ width: genislik as any, height: yukseklik, borderRadius, backgroundColor: bg }]}
    />
  );
}

function TekSkeleton() {
  const G = useGlass();
  const base = G.glassGreen;
  const shim = G.glassBorder;

  return (
    <View style={[styles.kart, { backgroundColor: G.glassWhite, borderColor: G.glassBorder }]}>
      <SkeletonKutu genislik="100%" yukseklik={160} borderRadius={10} baseColor={base} shimColor={shim} />
      <View style={{ height: 12 }} />
      <SkeletonKutu genislik="65%" yukseklik={18} baseColor={base} shimColor={shim} />
      <View style={{ height: 8 }} />
      <SkeletonKutu genislik="100%" yukseklik={12} baseColor={base} shimColor={shim} />
      <View style={{ height: 6 }} />
      <SkeletonKutu genislik="80%" yukseklik={12} baseColor={base} shimColor={shim} />
      <View style={{ height: 14 }} />
      <View style={styles.chipSatiri}>
        <SkeletonKutu genislik={96} yukseklik={28} borderRadius={100} baseColor={base} shimColor={shim} />
        <SkeletonKutu genislik={80} yukseklik={28} borderRadius={100} baseColor={base} shimColor={shim} />
      </View>
    </View>
  );
}

export function RecipeSkeleton({ adet = 3 }: { adet?: number }) {
  return (
    <>
      {Array.from({ length: adet }).map((_, i) => (
        <TekSkeleton key={i} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  kart: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  chipSatiri: { flexDirection: 'row', gap: 8 },
});

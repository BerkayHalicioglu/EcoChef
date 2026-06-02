import { View, type ViewStyle } from 'react-native';
import { useGlass } from '@/context/GlassContext';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;  // kept for API compat
  strong?: boolean;
};

export function GlassCard({ children, style, strong = false }: Props) {
  const G = useGlass();

  const cardStyle: ViewStyle = {
    backgroundColor: strong ? G.glassWhiteStrong : G.glassWhite,
    borderRadius: G.radius.lg,
    borderWidth: strong ? 1.5 : 1,
    borderColor: strong ? G.primary + '30' : G.glassBorder,
    overflow: 'hidden',
    shadowColor: G.shadow.color,
    shadowOffset: G.shadow.offset,
    shadowOpacity: strong ? G.shadow.opacity * 1.6 : G.shadow.opacity,
    shadowRadius: G.shadow.radius,
    elevation: strong ? G.shadow.elevation + 2 : G.shadow.elevation,
  };

  // Üst yüzey parlaklık çizgisi (cam efekti)
  const highlightStyle: ViewStyle = {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
    zIndex: 1,
  };

  return (
    <View style={[cardStyle, style]}>
      <View style={highlightStyle} pointerEvents="none" />
      {children}
    </View>
  );
}

import { View, type ViewStyle } from 'react-native';
import { useGlass } from '@/context/GlassContext';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  dark?: boolean;
};

export function GlassScreen({ children, style }: Props) {
  const G = useGlass();
  return (
    <View style={[{ flex: 1, backgroundColor: G.bgColor }, style]}>
      {children}
    </View>
  );
}

import { TouchableOpacity, type TouchableOpacityProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type Props = TouchableOpacityProps;

export function AnimatedButton({ onPressIn, onPressOut, disabled, style, ...rest }: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimTouchable
      {...rest}
      disabled={disabled}
      style={[style, animStyle]}
      onPressIn={(e) => {
        if (!disabled) scale.value = withSpring(0.94, { damping: 14, stiffness: 300 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1.0, { damping: 12, stiffness: 200 });
        onPressOut?.(e);
      }}
      activeOpacity={rest.activeOpacity ?? 0.9}
    />
  );
}

import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useGlass } from '@/context/GlassContext';
import { useLocale } from '@/context/I18nContext';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useShoppingList } from '@/hooks/use-shopping-list';

export default function TabLayout() {
  const G = useGlass();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { durum } = useNetworkStatus();
  const { bekleyenSayisi } = useShoppingList();

  const tabBarHeight = 60 + insets.bottom;

  return (
    <>
    <OfflineBanner durum={durum} />
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: G.primary,
        tabBarInactiveTintColor: G.textLight,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: G.glassWhite,
          borderTopColor: G.glassBorder,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: insets.bottom,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t('tabs.favorites'),
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="heart.fill" color={color} />,
        }}
      />
      {/* Orta — özel kamera butonu */}
      <Tabs.Screen
        name="explore"
        options={{
          title: t('tabs.explore'),
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="safari.fill" color={color} />,
          tabBarButton: (props) => (
            <HapticTab {...props} />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: t('tabs.shopping'),
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="cart.fill" color={color} />,
          tabBarBadge: bekleyenSayisi > 0 ? bekleyenSayisi : undefined,
          tabBarBadgeStyle: { backgroundColor: G.accent, fontSize: 10, minWidth: 18, height: 18 },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.fill" color={color} />,
        }}
      />
      {/* Plan gizli tab — içeride bağlantıyla erişilir */}
      <Tabs.Screen
        name="plan"
        options={{
          href: null,
        }}
      />
    </Tabs>
    </>
  );
}

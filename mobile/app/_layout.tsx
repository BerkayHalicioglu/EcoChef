import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/context/AuthContext';
import { GlassProvider } from '@/context/GlassContext';
import { I18nProvider } from '@/context/I18nContext';
import { ShoppingListProvider } from '@/context/ShoppingListContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { MealPlanProvider } from '@/context/MealPlanContext';
import { bildirimIzniIste } from '@/hooks/use-notifications';
import { ONBOARDING_KEY } from './onboarding';
import { LOCALE_KEY } from '@/context/I18nContext';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function OnboardingGate() {
  const router = useRouter();

  useEffect(() => {
    const baslat = async () => {
      if (__DEV__) {
        await AsyncStorage.multiRemove([ONBOARDING_KEY, LOCALE_KEY]);
      }
      const done = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (!done) router.replace('/onboarding' as any);
      await SplashScreen.hideAsync();
    };
    baslat();
    bildirimIzniIste();
  }, []);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <I18nProvider>
    <AuthProvider>
      <ShoppingListProvider>
      <MealPlanProvider>
      <FavoritesProvider>
      <GlassProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <OnboardingGate />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="live-scan" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
            <Stack.Screen name="recipe/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="search-history" options={{ headerShown: false }} />
            <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
            <Stack.Screen name="hybrid" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </GlassProvider>
      </FavoritesProvider>
      </MealPlanProvider>
      </ShoppingListProvider>
    </AuthProvider>
    </I18nProvider>
  );
}

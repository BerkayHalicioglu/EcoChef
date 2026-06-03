// AsyncStorage mock
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// expo-secure-store mock
jest.mock('expo-secure-store', () => {
  const store = {};
  return {
    getItemAsync: jest.fn((key) => Promise.resolve(store[key] ?? null)),
    setItemAsync: jest.fn((key, value) => { store[key] = value; return Promise.resolve(); }),
    deleteItemAsync: jest.fn((key) => { delete store[key]; return Promise.resolve(); }),
  };
});

// expo-router mock
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  usePathname: () => '/',
}));

// expo-linear-gradient mock
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});

// @expo/vector-icons mock
jest.mock('@expo/vector-icons/Feather', () => {
  const { Text } = require('react-native');
  return (props) => <Text testID={`icon-${props.name}`} />;
});

// react-native-safe-area-context mock
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

// react-native-reanimated mock
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// expo-image-picker mock
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  launchCameraAsync: jest.fn(() => Promise.resolve({ canceled: true })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true })),
}));

// expo-splash-screen mock
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

// expo-localization mock
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'tr', regionCode: 'TR' }],
}));

// Global fetch mock (varsayılan olarak başarılı)
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    clone: () => ({
      json: () => Promise.resolve({}),
    }),
    headers: { get: () => null },
  })
);

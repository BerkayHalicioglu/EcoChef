import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { lightTokens, darkTokens, type GlassTokens } from '@/constants/glass';

const THEME_KEY = 'ecochef_tema';
type TemaSecim = 'sistem' | 'light' | 'dark';

type GlassContextValue = {
  tokens: GlassTokens;
  tema: TemaSecim;
  isDark: boolean;
  setTema: (t: TemaSecim) => void;
};

const GlassContext = createContext<GlassContextValue>({
  tokens: lightTokens,
  tema: 'sistem',
  isDark: false,
  setTema: () => {},
});

export function GlassProvider({ children }: { children: React.ReactNode }) {
  const sistemScheme = useColorScheme();
  const [tema, setTemaState] = useState<TemaSecim>('sistem');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'sistem') setTemaState(v);
    });
  }, []);

  const setTema = useCallback((t: TemaSecim) => {
    setTemaState(t);
    AsyncStorage.setItem(THEME_KEY, t);
  }, []);

  const isDark = tema === 'dark' || (tema === 'sistem' && sistemScheme === 'dark');
  const tokens = useMemo(() => (isDark ? darkTokens : lightTokens), [isDark]);

  const value = useMemo(() => ({ tokens, tema, isDark, setTema }), [tokens, tema, isDark, setTema]);

  return <GlassContext.Provider value={value}>{children}</GlassContext.Provider>;
}

export function useGlass(): GlassTokens {
  return useContext(GlassContext).tokens;
}

export function useTheme() {
  const { tema, isDark, setTema } = useContext(GlassContext);
  return { tema, isDark, setTema };
}

export type GlassTokens = {
  // Backgrounds
  bgColor: string;
  bgGradient: string[];
  bgGradientDeep: string[];

  // Card surfaces
  glassWhite: string;
  glassWhiteStrong: string;
  glassHighlight: string;
  glassBorder: string;
  glassBorderDim: string;
  glassGreen: string;
  glassGreenStrong: string;
  glassDark: string;

  // Brand
  primary: string;
  primaryLight: string;
  primaryMuted: string;
  accent: string;       // coral — active/food toggle
  accentMuted: string;
  danger: string;
  warning: string;

  // Text
  textDark: string;
  textMid: string;
  textLight: string;
  textOnDark: string;
  textOnDarkMid: string;

  // Shadows
  shadow: { color: string; offset: { width: number; height: number }; opacity: number; radius: number; elevation: number };
  shadowSm: { color: string; offset: { width: number; height: number }; opacity: number; radius: number; elevation: number };

  // Shape
  radius: { sm: number; md: number; lg: number; xl: number; pill: number };

  // Spacing
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number };

  // Blur (kept for API compat — 0 in flat mode)
  blurIntensity: number;
  blurIntensityStrong: number;
};

export const lightTokens: GlassTokens = {
  bgColor: '#F4F6F4',
  bgGradient: ['#F4F6F4', '#F2F5F2', '#F4F6F4'],
  bgGradientDeep: ['#F4F6F4', '#F2F5F2', '#F4F6F4'],

  glassWhite: '#FFFFFF',
  glassWhiteStrong: '#FFFFFF',
  glassHighlight: 'transparent',
  glassBorder: 'rgba(0, 0, 0, 0.06)',
  glassBorderDim: 'rgba(0, 0, 0, 0.04)',
  glassGreen: '#EEF7EE',
  glassGreenStrong: '#4EAF55',
  glassDark: 'rgba(0, 0, 0, 0.55)',

  primary: '#4EAF55',
  primaryLight: '#74C47A',
  primaryMuted: '#EEF7EE',
  accent: '#EF7B6B',      // coral
  accentMuted: '#FDF0EE',
  danger: '#E53935',
  warning: '#F59E0B',

  textDark: '#2D3436',
  textMid: '#636E72',
  textLight: '#B2BEC3',
  textOnDark: '#FFFFFF',
  textOnDarkMid: 'rgba(255, 255, 255, 0.75)',

  shadow: { color: '#000', offset: { width: 0, height: 4 }, opacity: 0.07, radius: 14, elevation: 4 },
  shadowSm: { color: '#000', offset: { width: 0, height: 2 }, opacity: 0.05, radius: 6, elevation: 2 },

  radius: { sm: 12, md: 16, lg: 20, xl: 28, pill: 100 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 20, xl: 24, xxl: 48 },
  blurIntensity: 0,
  blurIntensityStrong: 0,
};

export const darkTokens: GlassTokens = {
  bgColor: '#181C18',
  bgGradient: ['#181C18', '#1A1E1A', '#181C18'],
  bgGradientDeep: ['#101210', '#141614', '#101210'],

  glassWhite: '#242824',
  glassWhiteStrong: '#2C302C',
  glassHighlight: 'transparent',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderDim: 'rgba(255, 255, 255, 0.04)',
  glassGreen: 'rgba(78, 175, 85, 0.12)',
  glassGreenStrong: '#4EAF55',
  glassDark: 'rgba(0, 0, 0, 0.70)',

  primary: '#74C47A',
  primaryLight: '#95D49A',
  primaryMuted: 'rgba(78, 175, 85, 0.18)',
  accent: '#EF9A8E',
  accentMuted: 'rgba(239, 123, 107, 0.18)',
  danger: '#EF5350',
  warning: '#FFCA28',

  textDark: 'rgba(255, 255, 255, 0.93)',
  textMid: 'rgba(255, 255, 255, 0.60)',
  textLight: 'rgba(255, 255, 255, 0.35)',
  textOnDark: 'rgba(255, 255, 255, 0.93)',
  textOnDarkMid: 'rgba(255, 255, 255, 0.65)',

  shadow: { color: '#000', offset: { width: 0, height: 4 }, opacity: 0.35, radius: 14, elevation: 6 },
  shadowSm: { color: '#000', offset: { width: 0, height: 2 }, opacity: 0.22, radius: 6, elevation: 3 },

  radius: { sm: 12, md: 16, lg: 20, xl: 28, pill: 100 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 20, xl: 24, xxl: 48 },
  blurIntensity: 0,
  blurIntensityStrong: 0,
};

export const G = lightTokens;

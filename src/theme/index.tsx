// theme/index.ts
import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export const LightColors = {
  // Surfaces
  background: '#F5F8FF',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF3FF',
  card: '#FFFFFF',
  border: '#D6E0F5',
  shadow: 'rgba(18, 38, 102, 0.10)',

  // Brand
  navy: '#1A3A8F',
  navyDim: 'rgba(26, 58, 143, 0.12)',
  cobalt: '#2563D4',
  cobaltDim: 'rgba(37, 99, 212, 0.12)',
  green: '#3DB34A',
  greenDim: 'rgba(61, 179, 74, 0.14)',
  limeGreen: '#5FD46A',
  limeGreenDim: 'rgba(95, 212, 106, 0.14)',
  skyBlue: '#5B9BD5',
  skyBlueDim: 'rgba(91, 155, 213, 0.12)',
  orange: '#E8842A',
  orangeDim: 'rgba(232, 132, 42, 0.12)',
  white: '#FFFFFF',

  // Text
  text: '#0D1F52',
  textSoft: '#2B4080',
  muted: '#6B7EB8',
  caption: '#A8B5D8',
} as const;

export const DarkColors = {
  // Surfaces
  background: '#080F24',
  surface: '#111A35',
  surfaceAlt: '#172040',
  card: '#1A2545',
  border: '#263260',
  shadow: 'rgba(0, 0, 0, 0.40)',

  // Brand — same hues, slightly brighter so they pop on dark bg
  navy: '#4A72D4',
  navyDim: 'rgba(74, 114, 212, 0.18)',
  cobalt: '#5B8FEF',
  cobaltDim: 'rgba(91, 143, 239, 0.16)',
  green: '#4DCC5A',
  greenDim: 'rgba(77, 204, 90, 0.18)',
  limeGreen: '#72E07C',
  limeGreenDim: 'rgba(114, 224, 124, 0.16)',
  skyBlue: '#7AB8F0',
  skyBlueDim: 'rgba(122, 184, 240, 0.14)',
  orange: '#F09942',
  orangeDim: 'rgba(240, 153, 66, 0.18)',
  white: '#FFFFFF',

  // Text
  text: '#E8EEFF',
  textSoft: '#A8B8E8',
  muted: '#6B7EB8',
  caption: '#3D4F80',
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 19,
  xl: 24,
  xxl: 30,
} as const;

export const Radius = {
  sm: 12,
  md: 18,
  lg: 24,
  pill: 999,
} as const;

export const Space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const CardShadow = {
  shadowColor: '#1A3A8F',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 3,
} as const;

export type AppColors = typeof LightColors;

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  setMode: () => {},
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('system');
  const scheme = useColorScheme();
  const isDark = mode === 'system' ? scheme === 'dark' : mode === 'dark';
  const value = useMemo(() => ({ mode, setMode, isDark }), [mode, isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  return useContext(ThemeContext);
}

// Hook — use this anywhere in your app
export function useAppTheme() {
  const scheme = useColorScheme();
  const { mode } = useContext(ThemeContext);
  const resolved = mode === 'system' ? scheme : mode;
  return {
    colors: resolved === 'dark' ? DarkColors : LightColors,
    isDark: resolved === 'dark',
    scheme: resolved,
  };
}
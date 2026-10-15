import { darkColors, lightColors, type ColorScheme } from './colors';
import { radius, spacing } from './spacing';
import { typography } from './typography';

export interface Theme {
  colors: ColorScheme;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
}

export const lightTheme: Theme = {
  colors: lightColors,
  spacing,
  radius,
  typography,
};

export const darkTheme: Theme = {
  colors: darkColors,
  spacing,
  radius,
  typography,
};

export type ColorMode = 'light' | 'dark';

export const themes: Record<ColorMode, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};

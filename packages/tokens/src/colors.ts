// Palette portée depuis l'app Flutter (lib/core/colors/app_colors.dart).
// Valeurs pures (hex) — chaque plateforme les applique à sa façon.

/** Couleurs sémantiques communes aux deux thèmes. */
export const semanticColors = {
  success: '#5EA377',
  warning: '#CA6702',
  danger: '#780000',
  info: '#01497C',
  borderInput: '#E5E5E5',
} as const;

export const lightColors = {
  primary: '#2D4F44',
  secondary: '#2B181F',
  tertiary: '#7F5539',
  background: '#FFFFFF',
  /** Texte sur `primary` (label de bouton, onglet actif). */
  text: '#F8F9FA',
  /** Texte courant posé sur `background`. */
  onBackground: '#182C24',
  ...semanticColors,
} as const;

export const darkColors = {
  primary: '#D6D0C9',
  secondary: '#2B181F',
  tertiary: '#7F5539',
  background: '#182C24',
  /** Texte sur `primary` (label de bouton, onglet actif). */
  text: '#1C1C1C',
  /** Texte courant posé sur `background`. */
  onBackground: '#D6D0C9',
  ...semanticColors,
} as const;

export type ColorName = keyof typeof lightColors;
/** Valeurs élargies à `string` pour que light et dark partagent le même type. */
export type ColorScheme = Record<ColorName, string>;

// Typographie portée depuis l'app Flutter (lib/core/typo/app_typography.dart).
// Anton pour les titres, Poppins pour le corps. Tailles pures (px / points logiques).

export const fontFamilies = {
  heading: 'Anton',
  body: 'Poppins',
} as const;

export interface TextStyleToken {
  fontFamily: (typeof fontFamilies)[keyof typeof fontFamilies];
  fontSize: number;
  fontStyle?: 'normal' | 'italic';
}

export const typography = {
  displayExtraLarge: { fontFamily: fontFamilies.heading, fontSize: 48 },
  displayLarge: { fontFamily: fontFamilies.heading, fontSize: 40 },
  headingLarge: { fontFamily: fontFamilies.heading, fontSize: 32 },
  headingMedium: { fontFamily: fontFamilies.heading, fontSize: 28 },
  headingSmall: { fontFamily: fontFamilies.heading, fontSize: 24 },
  subheadingLarge: { fontFamily: fontFamilies.body, fontSize: 20 },
  subheadingMedium: { fontFamily: fontFamilies.body, fontSize: 18 },
  subheadingSmall: { fontFamily: fontFamilies.body, fontSize: 16 },
  bodyMedium: { fontFamily: fontFamilies.body, fontSize: 16 },
  bodySmall: { fontFamily: fontFamilies.body, fontSize: 14 },
  label: { fontFamily: fontFamilies.body, fontSize: 12 },
  caption: { fontFamily: fontFamilies.body, fontSize: 12, fontStyle: 'italic' },
} as const satisfies Record<string, TextStyleToken>;

export type TypographyToken = keyof typeof typography;

// Déclaration pour importer les .svg comme composants React (react-native-svg-transformer).
// Fichier séparé car expo régénère expo-env.d.ts et écraserait cette déclaration.
declare module '*.svg' {
  import type { FC } from 'react';
  import type { SvgProps } from 'react-native-svg';
  const content: FC<SvgProps>;
  export default content;
}

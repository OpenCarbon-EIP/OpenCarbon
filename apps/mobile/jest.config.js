// Tests de composants (jest-expo + Testing Library). Les alias reprennent ceux du tsconfig ;
// les .svg (react-native-svg-transformer côté Metro) sont remplacés par un composant vide.
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/test/svg-mock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@assets/(.*)$': '<rootDir>/assets/$1',
  },
};

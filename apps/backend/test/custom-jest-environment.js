try {
  if (typeof globalThis.localStorage !== 'undefined') {
    try {
      void globalThis.localStorage;
    } catch (e) {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
          clear: () => {},
        },
      });
    }
  }
} catch (e) {
}

const env = require('jest-environment-node');
module.exports = env.TestEnvironment || env.default || env;

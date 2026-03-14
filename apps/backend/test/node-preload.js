if (typeof globalThis !== 'undefined') {
  try {
    const test = globalThis.localStorage;
  } catch (e) {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        key: () => null,
        length: 0,
      },
    });
  }

  try {
    const test = globalThis.sessionStorage;
  } catch (e) {
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        key: () => null,
        length: 0,
      },
    });
  }
}

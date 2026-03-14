if (typeof globalThis !== 'undefined') {
  try {
    const existingStorage = globalThis.localStorage;
    if (existingStorage === undefined) {
      throw new Error('localStorage is undefined, will be stubbed');
    }
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
        key: () => null,
        length: 0,
      },
    });
  }
}

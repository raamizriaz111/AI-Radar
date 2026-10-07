import '@testing-library/jest-dom';

// Ensure localStorage is safely mocked in jsdom if missing
if (typeof window !== 'undefined' && (!window.localStorage || typeof window.localStorage.getItem !== 'function')) {
  const storage: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => { storage[key] = String(value); },
    removeItem: (key: string) => { delete storage[key]; },
    clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
    key: (index: number) => Object.keys(storage)[index] ?? null,
    get length() { return Object.keys(storage).length; },
  };
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
}


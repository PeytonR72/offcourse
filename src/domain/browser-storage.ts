/** Keeps a session copy of accessed records if browser storage becomes unavailable. */
export function createBrowserStorage(resolve: () => Storage) {
  const memory = new Map<string, string>();
  let storage: Storage | undefined;
  try {
    storage = resolve();
  } catch {
    // Storage access itself can throw in restricted browser contexts.
  }
  return {
    get persistent() {
      return storage !== undefined;
    },
    getItem(key: string): string | null {
      if (storage) {
        try {
          const value = storage.getItem(key);
          if (value === null) memory.delete(key);
          else memory.set(key, value);
          return value;
        } catch {
          storage = undefined;
        }
      }
      return memory.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      if (storage) {
        try {
          storage.setItem(key, value);
        } catch {
          storage = undefined;
        }
      }
      memory.set(key, value);
    },
  };
}

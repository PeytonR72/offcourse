"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import { createBrowserStorage } from "../domain/browser-storage";

type BrowserStorage = ReturnType<typeof createBrowserStorage>;
const ProgressStorage = createContext<(() => BrowserStorage) | null>(null);

/** One browser/session adapter survives client-side navigation between modes. */
export function ProgressStorageProvider({ children }: { children: ReactNode }) {
  const getStorage = useProgressStorage();
  return (
    <ProgressStorage.Provider value={getStorage}>
      {children}
    </ProgressStorage.Provider>
  );
}

// Resolve only from client effects; no browser state is shared by server requests.
export function useProgressStorage() {
  const shared = useContext(ProgressStorage);
  const local = useRef<BrowserStorage | null>(null);
  return useCallback(() => {
    if (shared) return shared();
    return (local.current ??= createBrowserStorage(() => window.localStorage));
  }, [shared]);
}

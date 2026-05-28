import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useLocalStorage — persist state to localStorage with cross-tab sync.
 *
 * Keeps the API of useState but writes through to localStorage on every change.
 * Reads are lazy (only on mount). Writes are JSON-serialized.
 * Listens to the `storage` event so other tabs stay in sync.
 *
 * If JSON parse fails, falls back to `initialValue` rather than throwing.
 */
export function useLocalStorage(key, initialValue) {
  const initialRef = useRef(initialValue);

  const read = useCallback(() => {
    if (typeof window === "undefined") return initialRef.current;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initialRef.current;
      return JSON.parse(raw);
    } catch {
      return initialRef.current;
    }
  }, [key]);

  const [value, setValue] = useState(read);

  // Persist on change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota exceeded or serialization error — silently ignore.
    }
  }, [key, value]);

  // Cross-tab sync.
  useEffect(() => {
    if (typeof window === "undefined") return;
    function onStorage(e) {
      if (e.key !== key) return;
      try {
        setValue(e.newValue === null ? initialRef.current : JSON.parse(e.newValue));
      } catch {
        /* ignore */
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    setValue(initialRef.current);
  }, [key]);

  return [value, setValue, remove];
}

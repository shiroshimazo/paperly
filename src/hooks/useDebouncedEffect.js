import { useEffect, useRef } from "react";

/**
 * Run an effect after `delay` ms of stillness.
 * Resets the timer whenever any item in `deps` changes.
 * Cancels on unmount.
 */
export function useDebouncedEffect(fn, delay, deps) {
  const cb = useRef(fn);
  cb.current = fn;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const id = setTimeout(() => cb.current?.(), delay);
    return () => clearTimeout(id);
  }, deps);
}

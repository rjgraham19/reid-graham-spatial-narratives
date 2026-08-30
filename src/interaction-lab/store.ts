import { useCallback, useEffect, useState } from "react";

/**
 * Shortlist state, persisted to localStorage so it survives moving between
 * sections and full page reloads. Keyed per-experiment-id. SSR-safe: starts
 * empty on the server and hydrates from storage in an effect.
 */
const KEY = "rgd:interaction-lab:shortlist:v1";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* private mode / quota — shortlist just won't persist this session */
  }
}

/** Module-level subscribers so every mounted component stays in sync. */
const listeners = new Set<(ids: string[]) => void>();
let current: string[] | null = null;

function getCurrent(): string[] {
  if (current === null) current = read();
  return current;
}
function setCurrent(next: string[]) {
  current = next;
  write(next);
  listeners.forEach((l) => l(next));
}

export function useShortlist() {
  const [ids, setIds] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : getCurrent(),
  );

  useEffect(() => {
    // hydrate + subscribe
    setIds(getCurrent());
    const l = (next: string[]) => setIds(next);
    listeners.add(l);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setCurrent(read());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const now = getCurrent();
    setCurrent(now.includes(id) ? now.filter((x) => x !== id) : [...now, id]);
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const clear = useCallback(() => setCurrent([]), []);

  return { ids, toggle, has, clear };
}

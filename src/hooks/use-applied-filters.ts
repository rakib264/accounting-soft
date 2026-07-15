import { useCallback, useState } from "react";

export function useAppliedFilters<T extends Record<string, unknown>>(initial: T) {
  const [draft, setDraft] = useState<T>(initial);
  const [applied, setApplied] = useState<T>(initial);

  const apply = useCallback(() => {
    setApplied({ ...draft });
  }, [draft]);

  const reset = useCallback(() => {
    setDraft(initial);
    setApplied(initial);
  }, [initial]);

  const patchDraft = useCallback((patch: Partial<T>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  return { draft, setDraft, applied, apply, reset, patchDraft };
}

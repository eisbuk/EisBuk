import { useEffect, useState } from "react";

import { PASTE_COOLDOWN_MS } from "@/store/actions/copyPaste";

/**
 * Tracks a paste in progress, to disable the slot buttons while it lasts.
 *
 * A paste normally ends when the displayed slots change. They may never change, for
 * example if the aggregation fails or the client is offline, so a paste also ends
 * after a timeout. This can't cause a duplicate: the paste target stays locked at
 * least as long (see `commitPasteOnce`).
 */
export const usePasteInProgress = (slots: unknown) => {
  const [pasteInProgress, setPasteInProgress] = useState(false);

  useEffect(() => {
    setPasteInProgress(false);
  }, [slots]);

  useEffect(() => {
    if (!pasteInProgress) return undefined;
    const timeout = setTimeout(
      () => setPasteInProgress(false),
      PASTE_COOLDOWN_MS,
    );
    return () => clearTimeout(timeout);
  }, [pasteInProgress]);

  return [pasteInProgress, setPasteInProgress] as const;
};

import { useEffect, useRef } from "react";

/**
 * Global selection highlighter that forces a consistent paint path (CSS Highlights API)
 * across the app, so native `::selection` differences (WebKit) don't cause perceived
 * mismatches vs decoration-based highlights (e.g. search).
 */
export function GlobalSelectionHighlighter() {
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    const w = window as any;
    const highlightName = "app-selection";
    const highlightNameTop = "app-selection-top";
    const highlightNameBottom = "app-selection-bottom";
    const canCssHighlight =
      typeof w.CSS !== "undefined" &&
      typeof w.CSS.highlights !== "undefined" &&
      typeof w.Highlight !== "undefined";

    if (!canCssHighlight) return;

    document.body.dataset.customSelection = "true";

    const clear = () => {
      try {
        w.CSS.highlights.delete(highlightName);
        w.CSS.highlights.delete(highlightNameTop);
        w.CSS.highlights.delete(highlightNameBottom);
      } catch {
        // ignore
      }
      lastKeyRef.current = "";
    };

    const onSelectionChange = () => {
      try {
        const sel = document.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
          clear();
          return;
        }

        // Don't interfere with text inputs/textarea selection (Ranges don't map to their value).      
        const range = sel.getRangeAt(0).cloneRange();
        const key = `${range.startContainer.nodeType}:${range.startOffset}-${range.endContainer.nodeType}:${range.endOffset}`;
        if (key === lastKeyRef.current) return;
        lastKeyRef.current = key;

        // Use single highlight with gradient-like color (average of gradient stops)
        w.CSS.highlights.set(highlightName, new w.Highlight(range));
      } catch {
        clear();
      }
    };

    document.addEventListener("selectionchange", onSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
      clear();
      delete document.body.dataset.customSelection;
    };
  }, []);

  return null;
}


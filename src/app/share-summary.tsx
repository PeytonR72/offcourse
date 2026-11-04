"use client";

import { useRef, useState } from "react";

export function ShareSummary({ text }: { text: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const field = useRef<HTMLTextAreaElement>(null);
  const preview = useRef<HTMLDetailsElement>(null);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Summary copied.");
    } catch {
      setMessage(
        "Copy unavailable. Select the summary below and copy it manually."
      );
      if (preview.current) preview.current.open = true;
      field.current?.focus();
      field.current?.select();
    }
  };
  const share = async (copyOnly = false) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      if (copyOnly || typeof navigator.share !== "function") {
        await copy();
      } else {
        try {
          await navigator.share({ text });
          setMessage("Summary shared.");
        } catch (error) {
          if (
            error &&
            typeof error === "object" &&
            "name" in error &&
            error.name === "AbortError"
          )
            setMessage(
              "Sharing canceled. Your summary is ready whenever you are."
            );
          else await copy();
        }
      }
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap gap-3">
        <button
          className="primary-button grow"
          disabled={busy}
          onClick={() => void share()}
        >
          Share daily summary
        </button>
        <button
          className="secondary-button grow"
          disabled={busy}
          onClick={() => void share(true)}
        >
          Copy summary
        </button>
      </div>
      <details ref={preview} className="share-preview">
        <summary>View share text</summary>
        <label className="block text-sm text-[var(--muted)]">
          Daily share text
          <textarea
            ref={field}
            readOnly
            value={text}
            rows={text.split("\n").length}
            className="share-text"
          />
        </label>
      </details>
      <p aria-live="polite">{message}</p>
    </div>
  );
}

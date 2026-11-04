"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <main id="main-content" tabIndex={-1} className="game-page">
      <h1 ref={heading} tabIndex={-1} className="text-4xl font-bold">
        Flight interrupted
      </h1>
      <p className="mt-4 leading-relaxed text-[var(--muted)]">
        The flight view could not load. Try again to recover saved progress, or
        open demo practice. An unsaved practice round may need to restart.
      </p>
      <button className="primary-button mt-6 w-full" onClick={reset}>
        Try again
      </button>
      <Link
        href="/"
        className="secondary-button mt-3 flex items-center justify-center"
      >
        Open demo practice
      </Link>
    </main>
  );
}

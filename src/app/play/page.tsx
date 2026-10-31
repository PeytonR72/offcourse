import Link from "next/link";
import type { Metadata } from "next";
import { playEnabled } from "../../server/play-runtime";
import { ServerPlay } from "./server-play";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Server play preview",
  description:
    "The optional server-backed Offcourse play preview. The illustrative demo stays available while qualified poll content is prepared.",
  alternates: { canonical: "/play" },
  robots: { index: false, follow: false },
};

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const mode = (await searchParams).mode === "endless" ? "endless" : "daily";
  return (
    <main id="main-content" tabIndex={-1} className="game-page">
      <Link href="/" className="back-link">
        Offcourse · Demo practice
      </Link>
      <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
        {mode === "daily" ? "Daily Expedition" : "Endless Voyage"}
      </h1>
      <p className="mt-4 text-[#b4c2d1]">
        Server-backed play preview. New expeditions open when seven daily
        expeditions and at least 100 qualified endless questions are ready. A
        random browser installation key tracks participation; records do not
        sync across devices. Gameplay choices are not added to poll votes.
      </p>
      {playEnabled() ? (
        <ServerPlay key={mode} mode={mode} />
      ) : (
        <p role="status" className="mt-6">
          Server-backed play is unavailable. The demo remains playable with
          clearly labeled illustrative results.
        </p>
      )}
    </main>
  );
}

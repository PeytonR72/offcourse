import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy & storage",
  description:
    "How Offcourse saves browser-local progress and preferences, handles optional server play, and keeps illustrative demo results clearly labeled.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main id="main-content" tabIndex={-1} className="game-page">
      <Link href="/" className="back-link">
        Back to demo practice
      </Link>
      <h1 className="mt-4 text-4xl font-bold">Privacy &amp; storage</h1>
      <p className="mt-4 leading-relaxed text-[#c4d1dd]">
        Offcourse is an account-free demo. Illustrative results are simulated,
        not real crowd votes. Records do not sync across devices.
      </p>
      <h2 className="mt-8 text-2xl font-bold">On this browser</h2>
      <p className="mt-3 leading-relaxed text-[#c4d1dd]">
        Local storage saves daily attempts, endless progress and bests, your
        answers and predictions, and sound, motion and haptics preferences. The
        optional server-play preview also saves a random installation key and
        pending predictions to recover interrupted requests. This key is not a
        browser fingerprint. Practice progress lasts only while the page is
        open.
      </p>
      <p className="mt-3 leading-relaxed text-[#c4d1dd]">
        Clearing this site’s browser data resets local records, preferences and
        the installation key. Use your browser’s site settings to clear data for
        this address. This does not delete any server records. If storage is
        blocked, demo progress lasts only for the session; server play requires
        working storage to recover locks safely.
      </p>
      <h2 className="mt-8 text-2xl font-bold">
        Optional server play and polls
      </h2>
      <p className="mt-3 leading-relaxed text-[#c4d1dd]">
        When enabled, server play sends the installation key, personal answer
        and locked prediction to validate scores and prevent duplicate credit.
        The server stores a keyed hash of the installation key, run and question
        identifiers, predictions, results and timestamps. Gameplay choices are
        not added to poll votes. Separate poll collection requires explicit
        consent and stores a keyed voter hash, answer, consent version and time.
        These records remain until removed by the operator; there is currently
        no automatic deletion schedule. Published poll snapshots contain
        aggregate percentages and sample sizes.
      </p>
      <h2 className="mt-8 text-2xl font-bold">Hosting and diagnostics</h2>
      <p className="mt-3 leading-relaxed text-[#c4d1dd]">
        No advertising trackers, session replay or browser fingerprinting are
        added by the game. Vercel hosts the site and may process connection
        data, including IP addresses and request metadata, in its infrastructure
        logs. Operational checks report service availability without player
        records or unrevealed answers. Sharing uses your device’s share sheet or
        clipboard only when you select it; the summary omits personal answers
        and identifiers.
      </p>
    </main>
  );
}

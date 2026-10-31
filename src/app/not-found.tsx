import Link from "next/link";
import type { Metadata } from "next";
import { FlightIcon } from "./flight-icon";

export const metadata: Metadata = {
  title: "Destination not found",
  description:
    "This destination is off the map. Return to the Offcourse launchpad and start a daily expedition or endless voyage.",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main id="main-content" tabIndex={-1} className="game-page lost-page">
      <p className="lost-number">404</p>
      <h1>A little off course.</h1>
      <p className="game-intro mx-auto">
        There’s no destination at these coordinates.
        <br />
        Your next expedition is back at the launchpad.
      </p>
      <Link className="primary-button" href="/">
        Back to the launchpad <FlightIcon kind="arrow" />
      </Link>
    </main>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlightIcon } from "./flight-icon";

export function SiteNav() {
  const path = usePathname();
  return (
    <div className="navigation-bar">
      <Link href="/" className="brand" aria-label="Offcourse home">
        <FlightIcon />
        <span>offcourse</span>
      </Link>
      <nav aria-label="Main navigation">
        <Link
          href="/daily"
          aria-current={path === "/daily" ? "page" : undefined}
        >
          Daily<span className="nav-long"> Expedition</span>
        </Link>
        <Link
          href="/endless"
          aria-current={path === "/endless" ? "page" : undefined}
        >
          Endless<span className="nav-long"> Voyage</span>
        </Link>
        <Link href="/#how-to-play">How to play</Link>
      </nav>
    </div>
  );
}

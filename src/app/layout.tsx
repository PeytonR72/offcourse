import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ExperienceProvider } from "./experience";
import { ProgressStorageProvider } from "./progress-storage";
import Link from "next/link";
import { bodyFont, displayFont } from "./fonts";
import { site } from "../data/site";
import { FlightIcon } from "./flight-icon";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Offcourse", template: "%s | Offcourse" },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Offcourse",
    description: site.description,
    url: site.url,
    siteName: "Offcourse",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Offcourse: a little rocket, a lot of humanity",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Offcourse",
    description: site.description,
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  themeColor: "#091321",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>
        <ProgressStorageProvider>
          <ExperienceProvider>
            {children}
            <footer className="site-footer">
              <div>
                <Link href="/" className="brand">
                  <FlightIcon />
                  <span>offcourse</span>
                </Link>
                <p>A good guess can take you a long way.</p>
              </div>
              <div className="footer-storage">
                <p>
                  Progress and preferences are saved in this browser.
                  <br />
                  Clearing site data resets local records.
                </p>
                <Link href="/privacy" className="footer-link">
                  Privacy &amp; storage
                </Link>
              </div>
            </footer>
          </ExperienceProvider>
        </ProgressStorageProvider>
      </body>
    </html>
  );
}

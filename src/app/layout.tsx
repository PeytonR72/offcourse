import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ExperienceProvider } from "./experience";
import { ProgressStorageProvider } from "./progress-storage";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offcourse",
  description:
    "Guess what humanity thinks to steer a tiny rocket through space.",
};

export const viewport: Viewport = {
  themeColor: "#101927",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ProgressStorageProvider>
          <ExperienceProvider>
            {children}
            <footer className="mx-auto max-w-3xl border-t border-[#344354] px-5 py-6 text-sm leading-relaxed text-[#c4d1dd] sm:px-10">
              <p>
                Progress and preferences are saved in this browser. Clearing
                site data resets local records.
              </p>
              <Link
                href="/privacy"
                className="mt-2 inline-flex min-h-11 items-center text-[#b4cbd0] underline"
              >
                Privacy &amp; storage
              </Link>
            </footer>
          </ExperienceProvider>
        </ProgressStorageProvider>
      </body>
    </html>
  );
}

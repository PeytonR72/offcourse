import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ExperienceProvider } from "./experience";
import { ProgressStorageProvider } from "./progress-storage";

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
          <ExperienceProvider>{children}</ExperienceProvider>
        </ProgressStorageProvider>
      </body>
    </html>
  );
}

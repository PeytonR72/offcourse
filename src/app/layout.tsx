import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ExperienceProvider } from "./experience";

export const metadata: Metadata = {
  title: "Offcourse",
  description:
    "Guess what humanity thinks to steer a tiny rocket through space.",
};

export const viewport: Viewport = {
  themeColor: "#101927",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ExperienceProvider>{children}</ExperienceProvider>
      </body>
    </html>
  );
}

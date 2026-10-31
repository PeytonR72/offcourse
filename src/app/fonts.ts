import localFont from "next/font/local";

export const displayFont = localFont({
  src: "../fonts/silkscreen-400-normal.woff2",
  weight: "400",
  variable: "--font-display",
  display: "swap",
});
export const bodyFont = localFont({
  src: "../fonts/dm-sans-400_700-normal.woff2",
  weight: "400 700",
  variable: "--font-body",
  display: "swap",
});

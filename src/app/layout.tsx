import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Resultatjakten | Tips för Fotboll",
  description: "Tippa fotbollsturneringar med vänner. Skapa privata grupper och klättra på leaderboarden.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Resultatjakten"
  }
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="sv"
      className={`${inter.variable} font-sans antialiased bg-zinc-950`}
    >
      <body className="min-h-[100dvh] flex flex-col text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-950 selection:bg-indigo-500/30">
        {children}
      </body>
    </html>
  );
}

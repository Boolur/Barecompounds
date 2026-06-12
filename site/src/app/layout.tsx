import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AgeGate from "@/components/AgeGate";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bare Compounds — Research-grade peptides",
    template: "%s — Bare Compounds",
  },
  description:
    "A study in restraint. Third-party verified, research-grade peptides at 99% purity. For research use only.",
  metadataBase: new URL("https://barecompounds.com"),
  openGraph: {
    title: "Bare Compounds",
    description:
      "A study in restraint. Research-grade peptides at 99% purity.",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4efe6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="preconnect"
          href="https://api.fontshare.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=general-sans@200,300,400,500,600,700&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col grain bg-cream text-ink">
        <AgeGate />
        {children}
      </body>
    </html>
  );
}

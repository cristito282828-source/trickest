import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";

const urbanist = Urbanist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trickest - Skateboarding Challenge Platform",
  description: "Skate, record and post your best tricks. Compete with skaters from around the world.",
  keywords: 'skateboarding, skate, tricks, challenges, competition, skaters, skateboard',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/logo-main.png', sizes: 'any', type: 'image/png' },
      { url: '/logo-main.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo-main.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/logo-main.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/logo-main.png',
  },
  openGraph: {
    title: 'Trickest - Skateboarding Challenge Platform',
    description: 'Skate, record and post your best tricks. Compete with skaters from around the world.',
    type: 'website',
    images: [
      {
        url: '/logo-main.png',
        width: 512,
        height: 512,
        alt: 'Trickest Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trickest - Skateboarding Challenge Platform',
    description: 'Skate, record and post your best tricks',
    images: ['/logo-main.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Root layout is minimal - just passes children through
  // The actual HTML structure is in [locale]/layout.tsx
  return children;
}

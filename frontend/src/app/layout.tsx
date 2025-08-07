import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthModal } from "@/components/auth/AuthModal";
import { Toast } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyTube - Share Your World",
  description: "A YouTube clone built with Next.js - Upload, watch, and share videos with the world",
  keywords: ["video", "streaming", "youtube", "clone", "nextjs"],
  authors: [{ name: "MyTube Team" }],
  creator: "MyTube",
  publisher: "MyTube",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: "MyTube - Share Your World",
    description: "Upload, watch, and share videos with the world",
    url: "http://localhost:3000",
    siteName: "MyTube",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MyTube - Share Your World",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyTube - Share Your World",
    description: "Upload, watch, and share videos with the world",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen`}
      >
        {children}
        <AuthModal />
        <Toast />
      </body>
    </html>
  );
}

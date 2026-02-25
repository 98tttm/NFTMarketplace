import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NetworkBannerWrapper } from "@/components/NetworkBannerWrapper";
import { TransactionPanelWrapper } from "@/components/TransactionPanelWrapper";
import { NotificationPanelWrapper } from "@/components/NotificationPanelWrapper";
import { MobileBottomNavWrapper } from "@/components/layout/MobileBottomNavWrapper";
import { PageTransitionWrapper } from "@/components/layout/PageTransitionWrapper";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://nft-marketplace.vercel.app"),
  title: {
    default: "NFT Marketplace — Tạo, Mua Bán & Đấu Giá NFT",
    template: "%s | NFT Marketplace",
  },
  description:
    "Sàn giao dịch NFT - Tạo, mua bán và đấu giá tài sản số trên blockchain Ethereum.",
  keywords: ["NFT", "marketplace", "ethereum", "blockchain", "digital art", "crypto", "web3", "defi"],
  authors: [{ name: "NFT Marketplace Team" }],
  openGraph: {
    title: "NFT Marketplace",
    description: "Discover, Collect & Sell Extraordinary NFTs",
    type: "website",
    siteName: "NFT Marketplace",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "NFT Marketplace",
    description: "Discover, Collect & Sell Extraordinary NFTs",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "NFT Marketplace",
  description: "The premier NFT marketplace for discovering, collecting, and selling extraordinary digital assets on Ethereum.",
  applicationCategory: "Marketplace",
  operatingSystem: "Web",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background text-text-primary`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <NetworkBannerWrapper />
            <main className="flex-1">
              <PageTransitionWrapper>{children}</PageTransitionWrapper>
            </main>
            <Footer />
          </div>
          <MobileBottomNavWrapper />
          <TransactionPanelWrapper />
          <NotificationPanelWrapper />
        </Providers>
      </body>
    </html>
  );
}

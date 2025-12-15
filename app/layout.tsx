import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LocationProvider } from "./contexts/LocationContext";
import { DistanceProvider } from "./contexts/DistanceContext";
import { AuthProvider } from "./contexts/AuthContext";
import { AgentAuthProvider } from "./contexts/AgentAuthContext";
import { SearchProvider } from "./contexts/SearchContext";
import Toaster from "./components/Toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: "8 Rupiya - Find Best Local Shops & Businesses Near You | Patna Business Directory",
    template: "%s | 8 Rupiya - Local Business Directory",
  },
  description: "Find the best local shops, businesses, and services near you in Patna. Search by category, pincode, or area. Contact details, addresses, and directions for thousands of local businesses.",
  keywords: [
    "local businesses",
    "shops near me",
    "Patna business directory",
    "find shops",
    "local services",
    "business directory",
    "shop search",
    "nearby shops",
    "Patna shops",
    "local directory",
  ],
  authors: [{ name: "8 Rupiya" }],
  creator: "8 Rupiya",
  publisher: "8 Rupiya",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: '8 Rupiya - Local Business Directory',
    title: '8 Rupiya - Find Best Local Shops & Businesses Near You',
    description: 'Find the best local shops, businesses, and services near you in Patna. Search by category, pincode, or area.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '8 Rupiya - Local Business Directory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '8 Rupiya - Find Best Local Shops & Businesses Near You',
    description: 'Find the best local shops, businesses, and services near you in Patna.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION_CODE,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <LocationProvider>
          <DistanceProvider>
            <AuthProvider>
              <AgentAuthProvider>
                <SearchProvider>
                  {children}
                  <Toaster />
                </SearchProvider>
              </AgentAuthProvider>
            </AuthProvider>
          </DistanceProvider>
        </LocationProvider>
      </body>
    </html>
  );
}

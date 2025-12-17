import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { LocationProvider } from "./contexts/LocationContext";
import { DistanceProvider } from "./contexts/DistanceContext";
import { AuthProvider } from "./contexts/AuthContext";
import { AgentAuthProvider } from "./contexts/AgentAuthContext";
import { SearchProvider } from "./contexts/SearchContext";
import Toaster from "./components/Toaster";
import PerformanceOptimizations from "./components/PerformanceOptimizations";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
  // Optimize font size - limit weights to reduce file size (< 100 KB target)
  weight: ['400', '500', '600', '700'], // Only load essential weights
  // Inter is a variable font, so this keeps file size small
});

export const metadata: Metadata = {
  title: {
    default: "8 Rupiya - Find Best Local Shops & Businesses Near You | Patna Business Directory",
    template: "%s | 8 Rupiya - Local Business Directory",
  },
  description: "8 Rupiya - Find best local shops, businesses, and services near you. Search shops near me, nearby stores, restaurants, hotels, salons, and more. Trusted local business directory in Patna with contact details, addresses, and directions.",
  keywords: [
    // Brand Keywords
    "8 rupiya",
    "8rupiya",
    "8 rupiya com",
    "8rupiya com",
    "8rupiya.com",
    "8 rupiya website",
    "8rupiya website",
    "8 rupiya directory",
    "8rupiya directory",
    "8 rupiya business",
    "8rupiya business",
    "8 rupiya local",
    "8rupiya local",
    "8 rupiya shops",
    "8rupiya shops",
    "8 rupiya near me",
    "8rupiya near me",
    "8 rupiya app",
    "8rupiya app",
    "8 rupiya login",
    "8rupiya login",
    // Generic Local Search (Near Me)
    "local shops near me",
    "shops near me",
    "nearby shops",
    "best local shops",
    "trusted local shops",
    "local businesses near me",
    "small businesses near me",
    "near me services",
    "nearby stores",
    "open now shops",
    "shops open now near me",
    "grocery near me",
    "medical store near me",
    "mobile shop near me",
    "electronics near me",
    "hardware near me",
    "restaurant near me",
    "hotel near me",
    "salon near me",
    "tailoring near me",
    "computer shop near me",
    "coaching center near me",
    "tuition near me",
    "repair shop near me",
    "plumber near me",
    "electrician near me",
    "mechanic near me",
    "bike service near me",
    "car service near me",
    "gym near me",
    "fitness near me",
    "pharmacy near me",
    "clinic near me",
    "diagnostic center near me",
    // General Keywords
    "local businesses",
    "Patna business directory",
    "find shops",
    "local services",
    "business directory",
    "shop search",
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
  other: {
    // Resource hints for performance
    'dns-prefetch': 'https://res.cloudinary.com, https://images.unsplash.com',
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
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <PerformanceOptimizations />
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
        {/* External script removed for performance - uncomment only if needed */}
        {/* <Script
          src="https://8rupiya.com/script.js"
          strategy="afterInteractive"
        /> */}
      </body>
    </html>
  );
}

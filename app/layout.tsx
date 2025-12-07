import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LocationProvider } from "./contexts/LocationContext";
import { DistanceProvider } from "./contexts/DistanceContext";
import { AuthProvider } from "./contexts/AuthContext";
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
  title: "KVL Business - Find Local Businesses",
  description: "Discover and connect with local businesses, shops, and services in your area",
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
              {children}
              <Toaster />
            </AuthProvider>
          </DistanceProvider>
        </LocationProvider>
      </body>
    </html>
  );
}

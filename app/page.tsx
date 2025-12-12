"use client";

import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import CategoryGrid from "./components/CategoryGrid";
import OffersStrip from "./components/OffersStrip";
import FeaturedBusinesses from "./components/FeaturedBusinesses";
import LatestOffers from "./components/LatestOffers";
import TopRatedBusinesses from "./components/TopRatedBusinesses";
import NewBusinesses from "./components/NewBusinesses";
import NearbyBusinesses from "./components/NearbyBusinesses";
import { safeJsonParse } from "./utils/fetchHelpers";

interface HomepageSettings {
  sections: {
    hero: boolean;
    categories: boolean;
    offers: boolean;
    featuredBusinesses: boolean;
    topRated: boolean;
    newBusinesses: boolean;
  };
  layout: {
    theme: string;
    primaryColor: string;
    secondaryColor: string;
    containerWidth: string;
    sectionSpacing: string;
  };
}

export default function Home() {
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchHomepageSettings();
  }, []);
  
  // Inject custom CSS after mount and when settings change
  useEffect(() => {
    if (!mounted || !settings) return;
    
    const styleId = 'homepage-theme-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = `
      :root {
        --primary-color: ${settings.layout.primaryColor};
        --secondary-color: ${settings.layout.secondaryColor};
        --section-spacing: ${settings.layout.sectionSpacing || '40px'};
      }
    `;
  }, [mounted, settings]);

  const fetchHomepageSettings = async () => {
    try {
      const response = await fetch('/api/homepage');
      const data = await safeJsonParse<{ success: boolean; settings: HomepageSettings }>(response);
      
      if (data?.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching homepage settings:', error);
      // Use default settings on error
      setSettings({
        sections: {
          hero: true,
          categories: true,
          offers: true,
          featuredBusinesses: true,
          topRated: true,
          newBusinesses: true,
        },
        layout: {
          theme: 'light',
          primaryColor: '#3b82f6',
          secondaryColor: '#8b5cf6',
          containerWidth: '98%',
          sectionSpacing: '40px',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // Use settings or defaults
  const homepageSettings = settings || {
    sections: {
      hero: true,
      categories: true,
      offers: true,
      featuredBusinesses: true,
      topRated: true,
      newBusinesses: true,
    },
    layout: {
      theme: 'light',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      containerWidth: '98%',
      sectionSpacing: '40px',
    },
  };

  const { sections, layout } = homepageSettings;
  const theme = layout.theme || 'light';
  const bgColor = theme === 'dark' ? '#111827' : '#f9fafb';
  const footerBg = theme === 'dark' ? '#1f2937' : '#ffffff';
  const borderColor = theme === 'dark' ? '#374151' : '#e5e7eb';
  const sectionSpacing = layout.sectionSpacing || '40px';
  const containerWidth = layout.containerWidth || '98%';

  // Show default layout until mounted to avoid hydration mismatch
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar hideSearch={true} />
        <main className="max-w-[98%] mx-auto px-2 sm:px-3 lg:px-4 pt-0 pb-4 sm:pb-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </main>
        <footer className="bg-white border-t border-gray-200 mt-8 sm:mt-16">
          <div className="max-w-[98%] mx-auto px-2 sm:px-3 lg:px-4 py-4 sm:py-6">
            <div className="text-center text-xs sm:text-sm text-gray-600">
              <p>© 2024 KVL Business. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: bgColor }}
    >
      <Navbar hideSearch={true} />

      <main 
        className="mx-auto px-2 sm:px-3 lg:px-4 pt-0 pb-4 sm:pb-6"
        style={{ maxWidth: containerWidth }}
      >
        {/* Hero Section */}
        {sections.hero && (
          <div style={{ marginBottom: sectionSpacing }}>
            <HeroSection />
          </div>
        )}

        {/* Categories Section */}
        {sections.categories && (
          <div style={{ marginBottom: sectionSpacing }}>
            <CategoryGrid />
          </div>
        )}

        {/* Offers Section */}
        {sections.offers && (
          <div style={{ marginBottom: sectionSpacing }}>
            <LatestOffers />
          </div>
        )}

        {/* Featured Businesses */}
        {sections.featuredBusinesses && (
          <div style={{ marginBottom: sectionSpacing }}>
            <FeaturedBusinesses />
          </div>
        )}

        {/* Top Rated Businesses */}
        {sections.topRated && (
          <div style={{ marginBottom: sectionSpacing }}>
            <TopRatedBusinesses />
          </div>
        )}

        {/* New Businesses */}
        {sections.newBusinesses && (
          <div style={{ marginBottom: sectionSpacing }}>
            <NewBusinesses />
          </div>
        )}

        {/* Nearby Businesses Section - Bottom Strip - Shows shops based on current location and distance */}
        <div style={{ marginBottom: sectionSpacing }}>
          <NearbyBusinesses limit={12} />
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="border-t mt-8 sm:mt-16"
        style={{
          backgroundColor: footerBg,
          borderColor: borderColor,
        }}
      >
        <div 
          className="mx-auto px-2 sm:px-3 lg:px-4 py-4 sm:py-6"
          style={{ maxWidth: containerWidth }}
        >
          <div 
            className="text-center text-xs sm:text-sm"
            style={{ 
              color: theme === 'dark' ? '#9ca3af' : '#4b5563' 
            }}
          >
            <p>© 2024 KVL Business. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Custom CSS for theme - injected via useEffect to avoid hydration mismatch */}
    </div>
  );
}

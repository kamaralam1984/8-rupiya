'use client';

import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import CategoryGrid from './components/CategoryGrid';
import OffersStrip from './components/OffersStrip';
import FeaturedBusinesses from './components/FeaturedBusinesses';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-[98%] mx-auto px-2 sm:px-3 lg:px-4 pt-0 pb-6">
        {/* Hero Section */}
        <HeroSection />
        

        {/* Categories Section */}
        <CategoryGrid />

        {/* Offers Section */}
        <OffersStrip />

        {/* Featured Businesses */}
        <FeaturedBusinesses />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-[98%] mx-auto px-2 sm:px-3 lg:px-4 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>© 2024 KVL Business. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

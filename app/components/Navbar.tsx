'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import ProfileDropdown from './ProfileDropdown';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  hideSearch?: boolean;
}

export default function Navbar({ hideSearch = false }: NavbarProps) {
  const { isAuthenticated } = useAuth();
  
  // Animated text effects for navbar
  const [currentTextEffect, setCurrentTextEffect] = useState(0);
  const navbarTexts = [
    '8 Rupiya Digital Shop',
    'Online Business Made Easy',
    'आपका डिजिटल बिजनेस साथी',
    'Grow Your Business Online',
  ];
  
  // Rotate navbar text every 3 seconds
  useEffect(() => {
    const textInterval = setInterval(() => {
      setCurrentTextEffect((prev) => (prev + 1) % navbarTexts.length);
    }, 3000);
    return () => clearInterval(textInterval);
  }, []);


  return (
    <nav className="sticky top-0 z-50 w-full bg-gray-900/95 backdrop-blur-md shadow-md border-b border-amber-500/40">
      <div className="max-w-[98%] mx-auto px-2 sm:px-3 lg:px-4">
        <div className="flex items-center justify-between h-8 md:h-10 gap-2 sm:gap-4 py-1">
          {/* Left: Logo with enhanced design */}
          <div className="flex items-center shrink-0">
            <Link href="/" className="flex items-center group">
              <div className="relative w-[86px] h-[32px] sm:w-[108px] sm:h-[44px] md:w-[130px] md:h-[54px]">
                <Image
                  src="/Assets/logo 8rupiya.png"
                  alt="8rupiya.com logo"
                  fill
                  sizes="400px"
                  priority
                  className="object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </Link>
          </div>

          {/* Animated Text Section - Desktop */}
          <div className="flex-1 hidden lg:flex items-center justify-center mx-2 overflow-hidden">
            <h2 className="text-xs lg:text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 navbar-text-glow transition-all duration-500">
              {navbarTexts[currentTextEffect]}
            </h2>
          </div>

          {/* Animated Text Section - Mobile/Tablet (shortened) */}
          <div className="flex-1 flex lg:hidden items-center justify-center mx-1 overflow-hidden">
            <h2 className="text-[9px] sm:text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 navbar-text-glow transition-all duration-500">
              {navbarTexts[currentTextEffect].length > 25 
                ? navbarTexts[currentTextEffect].substring(0, 22) + '...' 
                : navbarTexts[currentTextEffect]
              }
            </h2>
          </div>


          {/* Right: CTAs */}
           <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
            {/* Mobile CTAs */}
            <div className="flex lg:hidden items-center gap-1.5">
              {/* Shop Directory - Mobile */}
              <Link
                href="/shop-directory"
                className="flex items-center gap-1 px-2 py-1 text-[9px] sm:text-[10px] font-semibold text-white bg-indigo-600 rounded-md sm:rounded-lg shadow-md transition-all hover:shadow-lg hover:opacity-90 group"
                title="Shop Directory"
              >
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="font-medium">Shop</span>
              </Link>
              {/* Promote - Mobile */}
              <Link
                href="/shopper/login"
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-1.5 text-[10px] sm:text-xs font-bold text-white bg-custom-gradient rounded-md sm:rounded-lg transition-all shadow-md hover:shadow-lg hover:opacity-90 hover:scale-105 active:scale-95 shrink-0"
                title="Promote Your Business"
              >
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 hidden sm:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                <span className="sm:hidden text-[9px]">Promote</span>
                <span className="hidden sm:inline">Promote</span>
              </Link>
            </div>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Shop Directory */}
              <Link
                href="/shop-directory"
                className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-white bg-indigo-600 rounded-lg shadow-md transition-all hover:shadow-lg hover:opacity-90 group"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="font-medium">Shop Directory</span>
              </Link>
              {/* Promote Business - Shopper Panel */}
              <Link
                href="/shopper/login"
                className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-white bg-custom-gradient rounded-lg shadow-md transition-all hover:shadow-lg hover:opacity-90 group"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                <span className="font-medium">Promote</span>
              </Link>

              {/* Notifications removed as requested */}
            </div>

            {/* Login / Sign Up Button or Profile Dropdown */}
            {isAuthenticated ? (
              <ProfileDropdown />
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-1.5 text-[10px] sm:text-xs font-bold text-white bg-custom-gradient rounded-md sm:rounded-lg transition-all shadow-md hover:shadow-lg hover:opacity-90 hover:scale-105 active:scale-95 shrink-0"
              >
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 hidden sm:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden text-[9px]">Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

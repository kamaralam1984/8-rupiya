'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

// Real-time Clock Component
function RealTimeClock() {
  const { isDarkMode } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className={`hidden md:flex flex-col items-end px-2 py-1 rounded-lg border ${
      isDarkMode
        ? 'bg-gray-800 border-gray-700'
        : 'bg-gradient-to-r from-red-100 to-amber-100 border-red-200'
    }`}>
      <div className={`text-sm font-bold font-mono ${
        isDarkMode ? 'text-red-400' : 'text-red-700'
      }`}>
        {formatTime(currentTime)}
      </div>
      <div className={`text-[10px] font-medium ${
        isDarkMode ? 'text-amber-400' : 'text-amber-700'
      }`}>
        {formatDate(currentTime)}
      </div>
    </div>
  );
}

// Role-based navigation menu - Defined outside component to prevent recreation
// allowedRoles: ['admin', 'editor', 'operator'] - sab ko access
// allowedRoles: ['admin', 'editor'] - admin aur editor ko access
// allowedRoles: ['admin'] - sirf admin ko access
const NAVIGATION_ITEMS = [
  { name: 'Dashboard', href: '/admin', icon: '📊', color: 'blue', allowedRoles: ['admin', 'editor', 'operator'] },
  { name: 'Homepage', href: '/admin/homepage', icon: '🏠', color: 'orange', allowedRoles: ['admin', 'editor'] },
  { name: 'Banners', href: '/admin/banners', icon: '🖼️', color: 'amber', allowedRoles: ['admin', 'editor'] },
  { name: 'Logo Maker', href: '/admin/logo-maker', icon: '🎨', color: 'pink', allowedRoles: ['admin', 'editor'] },
  { name: 'Categories', href: '/admin/categories', icon: '📁', color: 'purple', allowedRoles: ['admin', 'editor'] },
  { name: 'Offers', href: '/admin/offers', icon: '🎁', color: 'rose', allowedRoles: ['admin', 'editor'] },
  { name: 'Businesses', href: '/admin/businesses', icon: '🏪', color: 'green', allowedRoles: ['admin', 'editor', 'operator'] },
  { name: 'New Shop (Image)', href: '/admin/shops/new-from-image', icon: '📸', color: 'cyan', allowedRoles: ['admin', 'editor'] },
  { name: 'Renew Shops', href: '/admin/shops/renew', icon: '🔄', color: 'orange', allowedRoles: ['admin', 'editor'] },
  { name: 'Reports & Analytics', href: '/admin/reports', icon: '📊', color: 'indigo', allowedRoles: ['admin', 'editor', 'operator'] },
  { name: 'Database', href: '/admin/database', icon: '🗄️', color: 'slate', allowedRoles: ['admin'] }, // Sirf Admin
  { name: 'Restore', href: '/admin/restore', icon: '🔄', color: 'red', allowedRoles: ['admin'] }, // Sirf Admin
  { name: 'Google Business', href: '/admin/google-business', icon: '🏢', color: 'blue', allowedRoles: ['admin', 'editor', 'operator'] }, // Admin, Editor, Operator
  { name: 'Hero Section', href: '/admin/hero-section', icon: '🎯', color: 'purple', allowedRoles: ['admin', 'editor'] }, // Admin, Editor
  { name: 'Pages', href: '/admin/pages', icon: '📄', color: 'pink', allowedRoles: ['admin', 'editor'] },
  { name: 'SEO Management', href: '/admin/seo', icon: '🔍', color: 'emerald', allowedRoles: ['admin', 'editor'] }, // Admin, Editor
  { name: 'Analytics', href: '/admin/analytics', icon: '📊', color: 'blue', allowedRoles: ['admin', 'editor'] }, // Admin, Editor
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token, updateUser, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/login?redirect=/admin');
  };

  useEffect(() => {
    // Cache auth check to prevent rate limiting
    const authCheckCache = {
      lastCheck: 0,
      cacheDuration: 5 * 60 * 1000, // 5 minutes cache
      data: null as any,
    };

    const checkAdminAccess = async (retryCount = 0) => {
      // First, check if operator token exists - operators should not access admin panel
      if (typeof window !== 'undefined') {
        const operatorToken = localStorage.getItem('operator_token');
        if (operatorToken) {
          toast.error('Operators cannot access admin panel. Redirecting to operator dashboard...');
          router.push('/operator/dashboard');
          return;
        }
      }

      // Check if user is logged in
      if (!token) {
        router.push('/login?redirect=/admin');
        return;
      }

      // Check cache first to avoid rate limiting
      const now = Date.now();
      if (authCheckCache.data && (now - authCheckCache.lastCheck) < authCheckCache.cacheDuration) {
        const cachedUser = authCheckCache.data;
        if (cachedUser && cachedUser.role && ['admin', 'editor'].includes(cachedUser.role)) {
          setIsLoading(false);
          return;
        }
      }

      // Verify user role from server (in case it was updated in DB)
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          // Handle rate limiting (429) with retry
          if (res.status === 429) {
            const retryAfter = parseInt(res.headers.get('Retry-After') || '60');
            if (retryCount < 2) {
              // Wait and retry once
              await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
              return checkAdminAccess(retryCount + 1);
            } else {
              // Use cached data if available, otherwise show error
              if (authCheckCache.data) {
                const cachedUser = authCheckCache.data;
                if (cachedUser && cachedUser.role && ['admin', 'editor'].includes(cachedUser.role)) {
                  setIsLoading(false);
                  return;
                }
              }
              setError('Too many requests. Please wait a moment and refresh the page.');
              setIsLoading(false);
              return;
            }
          }

          // Silently handle auth errors - don't show toast for expected failures
          if (res.status === 401 || res.status === 403) {
            router.push('/login?redirect=/admin');
            return;
          }
          // Only log unexpected errors, don't show toast
          let errorData: any = {};
          try {
            const text = await res.text();
            if (text) {
              errorData = JSON.parse(text);
            }
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
            errorData = { error: `Server error (${res.status})`, details: 'Unable to parse error response' };
          }
          
          console.error('Auth check failed:', res.status, errorData);
          console.error('Response headers:', Object.fromEntries(res.headers.entries()));
          
          setError(errorData.error || errorData.message || `Failed to verify admin access (${res.status})`);
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        const currentUser = data.user || data; // Handle both response formats

        if (!currentUser || !currentUser.role) {
          console.error('Invalid user data received:', data);
          router.push('/login?redirect=/admin');
          return;
        }

        // Cache the result to avoid rate limiting
        authCheckCache.lastCheck = Date.now();
        authCheckCache.data = currentUser;

        // Update user in context if role changed
        if (currentUser.role !== user?.role) {
          updateUser(currentUser);
        }

        // STRICTLY: Only admin and editor can access admin panel
        // Operators should be redirected to operator panel
        if (currentUser.role === 'operator') {
          toast.error('Operators cannot access admin panel. Redirecting to operator dashboard...');
          router.push('/operator/dashboard');
          return;
        }

        // Check if user is admin or editor (ONLY these two roles allowed)
        if (!['admin', 'editor'].includes(currentUser.role)) {
          setError('Access Denied: Admin or Editor privileges required');
          // Only show toast once, not multiple times
          if (!error) {
            toast.error('You need admin or editor privileges to access this page');
          }
          setTimeout(() => {
            router.push('/');
          }, 2000);
          return;
        }

        setIsLoading(false);
      } catch (error: any) {
        console.error('Error checking admin access:', error);
        setError(error?.message || 'Failed to verify admin access. Please check your connection.');
        setIsLoading(false);
        // Don't redirect immediately on network errors - let user see the error
        setTimeout(() => {
          router.push('/login?redirect=/admin');
        }, 3000);
      }
    };

    checkAdminAccess();
    // Only run when token or user changes, not on every error update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, router]);

  // Filter navigation based on user role - MUST be before early returns (Rules of Hooks)
  const isOperatorsPage = pathname === '/admin/operators' || pathname?.startsWith('/admin/operators/');
  
  // Use useMemo to ensure hooks order consistency - MUST be before early returns
  // Always call useMemo, even if user is null (return empty array)
  const filteredNavigation = useMemo(() => {
    if (!user) return [];
    
    return NAVIGATION_ITEMS.filter((item) => {
      const isAllowed = (item.allowedRoles as readonly string[]).includes(user.role);
      
      // On operators page, show only Revenue and Operators (remove Agents)
      if (isOperatorsPage) {
        const allowedItems = ['Revenue', 'Operators'];
        return isAllowed && allowedItems.includes(item.name);
      }
      
      return isAllowed;
    });
  }, [user, isOperatorsPage]);

  // Debug: Log navigation items (remove in production) - MUST be before early returns
  useEffect(() => {
    if (user && filteredNavigation.length > 0) {
      console.log('User role:', user.role);
      console.log('Navigation items:', filteredNavigation.map(n => n.name));
    }
  }, [user, filteredNavigation]);

  // Early returns AFTER all hooks are called
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl font-semibold mb-2">Access Denied</div>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-4">Redirecting to homepage...</p>
        </div>
      </div>
    );
  }

  // Only admin and editor can access admin panel
  if (!user || !['admin', 'editor'].includes(user.role)) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className={`relative min-h-screen w-full overflow-hidden ${
      isDarkMode 
        ? 'bg-gray-900' 
        : 'bg-gradient-to-br from-red-50 via-amber-50 to-yellow-50'
    }`}>
      {/* Backdrop Blur Overlay - Windows Media Player Style */}
      {(leftSidebarOpen || rightSidebarOpen) && (
        <div
          onClick={() => {
            setLeftSidebarOpen(false);
            setRightSidebarOpen(false);
          }}
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-all duration-500 ease-in-out"
        />
      )}

      {/* Top Bar - Always Fixed and Visible */}
      <header className={`fixed top-0 left-0 right-0 z-40 h-16 shadow-lg backdrop-blur-md flex items-center justify-between px-4 sm:px-6 ${
        isDarkMode
          ? 'bg-gray-800 border-b border-gray-700'
          : 'bg-gradient-to-r from-red-50 via-amber-50 to-yellow-50 border-b border-red-200'
      }`}>
        {/* Left Sidebar Toggle Button */}
        <button
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          className="px-3 py-2 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 text-white hover:from-red-700 hover:to-amber-700 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
          aria-label="Toggle Navigation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="hidden sm:inline text-sm font-medium">Menu</span>
        </button>

        {/* Top Bar Navigation Items */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {/* All Payments */}
          <Link
            href="/admin/payments"
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-sm flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              pathname === '/admin/payments'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'text-red-700 hover:text-red-600 hover:bg-red-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="hidden sm:inline">All Payments</span>
            <span className="sm:hidden">Payments</span>
          </Link>

          {/* Revenue */}
          <Link
            href="/admin/revenue"
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-sm flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              pathname === '/admin/revenue'
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : isDarkMode
                  ? 'text-amber-300 hover:text-amber-200 hover:bg-amber-900/30'
                  : 'text-amber-700 hover:text-amber-600 hover:bg-amber-50'
            }`}
          >
            <span>💰</span>
            <span className="hidden sm:inline">Revenue</span>
            <span className="sm:hidden">Revenue</span>
          </Link>

          {/* Shoppers */}
          <Link
            href="/admin/shoppers"
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-sm flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              pathname === '/admin/shoppers'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : isDarkMode
                  ? 'text-red-300 hover:text-red-200 hover:bg-red-900/30'
                  : 'text-red-700 hover:text-red-600 hover:bg-red-50'
            }`}
          >
            <span>🛍️</span>
            <span className="hidden sm:inline">Shoppers</span>
            <span className="sm:hidden">Shoppers</span>
          </Link>

          {/* Shops */}
          <Link
            href="/admin/shops"
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-sm flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              pathname === '/admin/shops' || pathname?.startsWith('/admin/shops/')
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : isDarkMode
                  ? 'text-amber-300 hover:text-amber-200 hover:bg-amber-900/30'
                  : 'text-amber-700 hover:text-amber-600 hover:bg-amber-50'
            }`}
          >
            <span>🏬</span>
            <span className="hidden sm:inline">Shops</span>
            <span className="sm:hidden">Shops</span>
          </Link>

          {/* Shop Directory */}
          <Link
            href="/admin/shops/directory"
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-sm flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              pathname === '/admin/shops/directory'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : isDarkMode
                  ? 'text-red-300 hover:text-red-200 hover:bg-red-900/30'
                  : 'text-red-700 hover:text-red-600 hover:bg-red-50'
            }`}
          >
            <span>📂</span>
            <span className="hidden sm:inline">Directory</span>
            <span className="sm:hidden">Dir</span>
          </Link>

          {/* Pending Shops */}
          <Link
            href="/admin/shops/pending"
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-sm flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              pathname === '/admin/shops/pending'
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : isDarkMode
                  ? 'text-amber-300 hover:text-amber-200 hover:bg-amber-900/30'
                  : 'text-amber-700 hover:text-amber-600 hover:bg-amber-50'
            }`}
          >
            <span>⏳</span>
            <span className="hidden sm:inline">Pending</span>
            <span className="sm:hidden">Pending</span>
          </Link>
        </div>

        <div className="flex-1"></div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <RealTimeClock />
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 flex items-center gap-2"
            aria-label="Toggle Dark Mode"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
            <span className="hidden sm:inline text-sm font-medium">
              {isDarkMode ? 'Light' : 'Dark'}
            </span>
          </button>
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 hover:shadow-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:inline">Back to Site</span>
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 hover:shadow-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
          {/* Right Sidebar Toggle Button */}
          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-600 text-white hover:from-amber-700 hover:to-yellow-700 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
            aria-label="Toggle Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden sm:inline text-sm font-medium">Settings</span>
          </button>
        </div>
      </header>

      {/* Left Sidebar - Windows Media Player Style Sliding */}
      <aside
        className={`
          fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64
          shadow-xl transform transition-transform duration-500 ease-in-out
          ${leftSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col rounded-r-2xl
          ${isDarkMode
            ? 'bg-gray-800 border-r border-gray-700'
            : 'bg-gradient-to-b from-red-50 to-amber-50 border-r border-red-200'
          }
        `}
      >
        {/* Sidebar Header */}
        <div className={`h-16 flex items-center justify-between px-6 border-b ${
          isDarkMode
            ? 'border-gray-700 bg-gray-800'
            : 'border-red-200 bg-gradient-to-r from-red-100 to-amber-100'
        }`}>
          <Link
            href="/admin"
            className={`text-xl font-bold bg-gradient-to-r from-red-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent hover:opacity-80 transition-all duration-200 hover:scale-105 ${
              isDarkMode ? 'text-white' : ''
            }`}
            onClick={() => setLeftSidebarOpen(false)}
          >
            🚀 Admin Panel
          </Link>
          <button
            onClick={() => setLeftSidebarOpen(false)}
            className={`p-1 rounded-lg transition-colors ${
              isDarkMode
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-red-100'
            }`}
            aria-label="Close Navigation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const active = isActive(item.href);
            const colorClasses = isDarkMode ? {
              blue: active ? 'bg-blue-900/50 text-blue-300 border-l-4 border-blue-500' : 'text-gray-300 hover:bg-blue-900/30 hover:text-blue-300',
              red: active ? 'bg-red-900/50 text-red-300 border-l-4 border-red-500' : 'text-gray-300 hover:bg-red-900/30 hover:text-red-300',
              orange: active ? 'bg-orange-900/50 text-orange-300 border-l-4 border-orange-500' : 'text-gray-300 hover:bg-orange-900/30 hover:text-orange-300',
              amber: active ? 'bg-amber-900/50 text-amber-300 border-l-4 border-amber-500' : 'text-gray-300 hover:bg-amber-900/30 hover:text-amber-300',
              purple: active ? 'bg-purple-900/50 text-purple-300 border-l-4 border-purple-500' : 'text-gray-300 hover:bg-purple-900/30 hover:text-purple-300',
              green: active ? 'bg-green-900/50 text-green-300 border-l-4 border-green-500' : 'text-gray-300 hover:bg-green-900/30 hover:text-green-300',
              emerald: active ? 'bg-emerald-900/50 text-emerald-300 border-l-4 border-emerald-500' : 'text-gray-300 hover:bg-emerald-900/30 hover:text-emerald-300',
              cyan: active ? 'bg-cyan-900/50 text-cyan-300 border-l-4 border-cyan-500' : 'text-gray-300 hover:bg-cyan-900/30 hover:text-cyan-300',
              indigo: active ? 'bg-indigo-900/50 text-indigo-300 border-l-4 border-indigo-500' : 'text-gray-300 hover:bg-indigo-900/30 hover:text-indigo-300',
              pink: active ? 'bg-pink-900/50 text-pink-300 border-l-4 border-pink-500' : 'text-gray-300 hover:bg-pink-900/30 hover:text-pink-300',
              yellow: active ? 'bg-yellow-900/50 text-yellow-300 border-l-4 border-yellow-500' : 'text-gray-300 hover:bg-yellow-900/30 hover:text-yellow-300',
              teal: active ? 'bg-teal-900/50 text-teal-300 border-l-4 border-teal-500' : 'text-gray-300 hover:bg-teal-900/30 hover:text-teal-300',
              violet: active ? 'bg-violet-900/50 text-violet-300 border-l-4 border-violet-500' : 'text-gray-300 hover:bg-violet-900/30 hover:text-violet-300',
              slate: active ? 'bg-slate-700/50 text-slate-300 border-l-4 border-slate-500' : 'text-gray-300 hover:bg-slate-700/30 hover:text-slate-300',
              rose: active ? 'bg-rose-900/50 text-rose-300 border-l-4 border-rose-500' : 'text-gray-300 hover:bg-rose-900/30 hover:text-rose-300',
            } : {
              blue: active ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600',
              red: active ? 'bg-red-50 text-red-700 border-l-4 border-red-600' : 'text-gray-700 hover:bg-red-50 hover:text-red-600',
              orange: active ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-600' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600',
              amber: active ? 'bg-amber-50 text-amber-700 border-l-4 border-amber-600' : 'text-gray-700 hover:bg-amber-50 hover:text-amber-600',
              purple: active ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600' : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600',
              green: active ? 'bg-green-50 text-green-700 border-l-4 border-green-600' : 'text-gray-700 hover:bg-green-50 hover:text-green-600',
              emerald: active ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600',
              cyan: active ? 'bg-cyan-50 text-cyan-700 border-l-4 border-cyan-600' : 'text-gray-700 hover:bg-cyan-50 hover:text-cyan-600',
              indigo: active ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600',
              pink: active ? 'bg-pink-50 text-pink-700 border-l-4 border-pink-600' : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600',
              yellow: active ? 'bg-yellow-50 text-yellow-700 border-l-4 border-yellow-600' : 'text-gray-700 hover:bg-yellow-50 hover:text-yellow-600',
              teal: active ? 'bg-teal-50 text-teal-700 border-l-4 border-teal-600' : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600',
              violet: active ? 'bg-violet-50 text-violet-700 border-l-4 border-violet-600' : 'text-gray-700 hover:bg-violet-50 hover:text-violet-600',
              slate: active ? 'bg-slate-50 text-slate-700 border-l-4 border-slate-600' : 'text-gray-700 hover:bg-slate-50 hover:text-slate-600',
              rose: active ? 'bg-rose-50 text-rose-700 border-l-4 border-rose-600' : 'text-gray-700 hover:bg-rose-50 hover:text-rose-600',
            };
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setLeftSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${colorClasses[item.color as keyof typeof colorClasses] || colorClasses.blue}
                  ${active ? 'shadow-sm scale-[1.02]' : 'hover:scale-[1.01]'}
                `}
              >
                <span className="text-xl transition-transform duration-200">{item.icon}</span>
                <span className="flex-1">{item.name}</span>
                {active && (
                  <span className="w-2 h-2 bg-current rounded-full animate-pulse"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className={`p-4 border-t space-y-2 ${
          isDarkMode ? 'border-gray-700' : 'border-red-200'
        }`}>
          {/* User Info */}
          <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
            isDarkMode
              ? 'bg-gray-700'
              : 'bg-gradient-to-r from-red-100 to-amber-100'
          }`}>
            <div className={`w-10 h-10 bg-custom-gradient rounded-full flex items-center justify-center font-semibold text-sm ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>{user.name}</p>
              <p className={`text-xs truncate ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>{user.email}</p>
            </div>
          </div>
          
          {/* Role Badge */}
          <div className="px-3">
            <div className={`
              px-3 py-1.5 rounded-lg text-xs font-semibold text-center
              ${user.role === 'admin' 
                ? isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-200 text-red-900'
                : ''
              }
              ${user.role === 'editor' 
                ? isDarkMode ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-200 text-amber-900'
                : ''
              }
              ${user.role === 'operator' 
                ? isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-200 text-yellow-900'
                : ''
              }
            `}>
              {user.role === 'admin' && '👑 Administrator'}
              {user.role === 'editor' && '✏️ Editor'}
              {user.role === 'operator' && '👁️ Operator'}
            </div>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full mt-2 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 hover:shadow-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area - Full Width */}
      <main className={`pt-16 min-h-screen overflow-y-auto w-full ${
        isDarkMode
          ? 'bg-gray-900'
          : 'bg-gradient-to-br from-red-50 via-amber-50 to-yellow-50'
      }`}>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
      </main>

      {/* Right Sidebar - Windows Media Player Style Sliding */}
      <aside
        className={`
          fixed top-16 right-0 z-30 h-[calc(100vh-4rem)] w-64
          shadow-xl transform transition-transform duration-500 ease-in-out
          ${rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col rounded-l-2xl
          ${isDarkMode
            ? 'bg-gray-800 border-l border-gray-700'
            : 'bg-gradient-to-b from-amber-50 to-red-50 border-l border-amber-200'
          }
        `}
      >
        {/* Right Sidebar Header */}
        <div className={`h-16 flex items-center justify-between px-6 border-b ${
          isDarkMode
            ? 'border-gray-700 bg-gray-800'
            : 'border-amber-200 bg-gradient-to-r from-amber-100 to-red-100'
        }`}>
          <h2 className={`text-lg font-bold bg-gradient-to-r from-amber-600 via-red-600 to-yellow-600 bg-clip-text text-transparent ${
            isDarkMode ? 'text-white' : ''
          }`}>
            Management
          </h2>
          <button
            onClick={() => setRightSidebarOpen(false)}
            className={`p-1 rounded-lg transition-colors ${
              isDarkMode
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-amber-100'
            }`}
            aria-label="Close Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Right Sidebar Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Users - Only for Admin */}
          {user && user.role === 'admin' && (
            <Link
              href="/admin/users"
              onClick={() => setRightSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${pathname === '/admin/users'
                  ? 'bg-red-50 text-red-700 border-l-4 border-red-600 shadow-sm scale-[1.02]'
                  : 'text-gray-700 hover:bg-red-50 hover:text-red-600 hover:scale-[1.01]'
                }
              `}
            >
              <span className="text-xl">👥</span>
              <span className="flex-1">Users</span>
              {pathname === '/admin/users' && (
                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              )}
            </Link>
          )}

          {/* Agents */}
          {user && (user.role === 'admin' || user.role === 'editor') && (
            <Link
              href="/admin/agents"
              onClick={() => setRightSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${pathname === '/admin/agents' || pathname?.startsWith('/admin/agents/')
                  ? isDarkMode
                    ? 'bg-amber-900/50 text-amber-300 border-l-4 border-amber-500 shadow-sm scale-[1.02]'
                    : 'bg-amber-50 text-amber-700 border-l-4 border-amber-600 shadow-sm scale-[1.02]'
                  : isDarkMode
                    ? 'text-gray-300 hover:bg-amber-900/30 hover:text-amber-300 hover:scale-[1.01]'
                    : 'text-gray-700 hover:bg-amber-50 hover:text-amber-600 hover:scale-[1.01]'
                }
              `}
            >
              <span className="text-xl">👤</span>
              <span className="flex-1">Agents</span>
              {(pathname === '/admin/agents' || pathname?.startsWith('/admin/agents/')) && (
                <span className="w-2 h-2 bg-amber-600 rounded-full animate-pulse"></span>
              )}
            </Link>
          )}

          {/* Operators */}
          {user && (user.role === 'admin' || user.role === 'editor') && (
            <Link
              href="/admin/operators"
              onClick={() => setRightSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${pathname === '/admin/operators' || pathname?.startsWith('/admin/operators/')
                  ? 'bg-yellow-50 text-yellow-700 border-l-4 border-yellow-600 shadow-sm scale-[1.02]'
                  : 'text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 hover:scale-[1.01]'
                }
              `}
            >
              <span className="text-xl">👔</span>
              <span className="flex-1">Operators</span>
              {(pathname === '/admin/operators' || pathname?.startsWith('/admin/operators/')) && (
                <span className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></span>
              )}
            </Link>
          )}

          {/* Agent Panel Settings */}
          {user && (user.role === 'admin' || user.role === 'editor') && (
            <Link
              href="/admin/agent-panel-settings"
              onClick={() => setRightSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${pathname === '/admin/agent-panel-settings'
                  ? 'bg-red-50 text-red-700 border-l-4 border-red-600 shadow-sm scale-[1.02]'
                  : 'text-gray-700 hover:bg-red-50 hover:text-red-600 hover:scale-[1.01]'
                }
              `}
            >
              <span className="text-xl">⚙️</span>
              <span className="flex-1">Agent Panel Settings</span>
              {pathname === '/admin/agent-panel-settings' && (
                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              )}
            </Link>
          )}
        </nav>
      </aside>
    </div>
  );
}


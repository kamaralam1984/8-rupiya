'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token, updateUser, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/login?redirect=/admin');
  };

  useEffect(() => {
    const checkAdminAccess = async () => {
      // First check if user is logged in
      if (!token) {
        router.push('/login?redirect=/admin');
        return;
      }

      // Verify user role from server (in case it was updated in DB)
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          // Silently handle auth errors - don't show toast for expected failures
          if (res.status === 401 || res.status === 403) {
            router.push('/login?redirect=/admin');
            return;
          }
          // Only log unexpected errors, don't show toast
          const errorData = await res.json().catch(() => ({}));
          console.error('Auth check failed:', res.status, errorData);
          setError(errorData.error || 'Failed to verify admin access');
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

        // Update user in context if role changed
        if (currentUser.role !== user?.role) {
          updateUser(currentUser);
        }

        // Check if user is admin, editor, or operator
        if (!['admin', 'editor', 'operator'].includes(currentUser.role)) {
          setError('Access Denied: Admin, Editor, or Operator privileges required');
          // Only show toast once, not multiple times
          if (!error) {
            toast.error('You need admin, editor, or operator privileges to access this page');
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
  }, [token, router, user, updateUser]);

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

  if (!user || !['admin', 'editor', 'operator'].includes(user.role)) {
    return null;
  }

  // Role-based navigation menu
  // allowedRoles: ['admin', 'editor', 'operator'] - sab ko access
  // allowedRoles: ['admin', 'editor'] - admin aur editor ko access
  // allowedRoles: ['admin'] - sirf admin ko access
  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: '📊', color: 'blue', allowedRoles: ['admin', 'editor', 'operator'] },
    { name: 'Users', href: '/admin/users', icon: '👥', color: 'red', allowedRoles: ['admin'] }, // Sirf Admin
    { name: 'Homepage', href: '/admin/homepage', icon: '🏠', color: 'orange', allowedRoles: ['admin', 'editor'] },
    { name: 'Banners', href: '/admin/banners', icon: '🖼️', color: 'amber', allowedRoles: ['admin', 'editor'] },
    { name: 'Categories', href: '/admin/categories', icon: '📁', color: 'purple', allowedRoles: ['admin', 'editor'] },
    { name: 'Businesses', href: '/admin/businesses', icon: '🏪', color: 'green', allowedRoles: ['admin', 'editor', 'operator'] },
    { name: 'Shops', href: '/admin/shops', icon: '🏬', color: 'emerald', allowedRoles: ['admin', 'editor', 'operator'] },
    { name: 'Pending Shops', href: '/admin/shops/pending', icon: '⏳', color: 'orange', allowedRoles: ['admin', 'editor'] },
    { name: 'New Shop (Image)', href: '/admin/shops/new-from-image', icon: '📸', color: 'cyan', allowedRoles: ['admin', 'editor'] },
    { name: 'Renew Shops', href: '/admin/shops/renew', icon: '🔄', color: 'orange', allowedRoles: ['admin', 'editor'] },
    { name: 'Agents', href: '/admin/agents', icon: '👤', color: 'violet', allowedRoles: ['admin', 'editor'] },
    { name: 'Revenue', href: '/admin/revenue', icon: '💰', color: 'green', allowedRoles: ['admin', 'editor', 'operator'] },
    { name: 'Database', href: '/admin/database', icon: '🗄️', color: 'slate', allowedRoles: ['admin'] }, // Sirf Admin
    { name: 'Pages', href: '/admin/pages', icon: '📄', color: 'pink', allowedRoles: ['admin', 'editor'] },
  ];

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter((item) => {
    if (!user) return false;
    return item.allowedRoles.includes(user.role);
  });

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-sm
          transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-in-out
          flex flex-col
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-white">
          <Link
            href="/admin"
            className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent hover:opacity-80 transition-all duration-200 hover:scale-105"
            onClick={() => setSidebarOpen(false)}
          >
            🚀 Admin Panel
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const active = isActive(item.href);
            const colorClasses = {
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
              teal: active ? 'bg-teal-50 text-teal-700 border-l-4 border-teal-600' : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600',
              violet: active ? 'bg-violet-50 text-violet-700 border-l-4 border-violet-600' : 'text-gray-700 hover:bg-violet-50 hover:text-violet-600',
              slate: active ? 'bg-slate-50 text-slate-700 border-l-4 border-slate-600' : 'text-gray-700 hover:bg-slate-50 hover:text-slate-600',
            };
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
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
        <div className="p-4 border-t border-gray-200 space-y-2">
          {/* User Info */}
          <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-custom-gradient rounded-full flex items-center justify-center text-gray-900 font-semibold text-sm">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          
          {/* Role Badge */}
          <div className="px-3">
            <div className={`
              px-3 py-1.5 rounded-lg text-xs font-semibold text-center
              ${user.role === 'admin' ? 'bg-red-100 text-red-800' : ''}
              ${user.role === 'editor' ? 'bg-blue-100 text-blue-800' : ''}
              ${user.role === 'operator' ? 'bg-green-100 text-green-800' : ''}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-30 backdrop-blur-sm bg-white/95">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1 lg:flex-none"></div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:shadow-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Site
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 hover:shadow-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


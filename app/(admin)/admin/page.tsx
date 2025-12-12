'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { safeJsonParse } from '@/app/utils/fetchHelpers';

interface Stats {
  totalBanners: number;
  activeBanners: number;
  totalLocations: number;
  activeLocations: number;
  totalPages: number;
  publishedPages: number;
}

export default function AdminDashboard() {
  const { token, login, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenRefreshAttempted, setTokenRefreshAttempted] = useState(false);


  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [bannersRes, pagesRes] = await Promise.all([
          fetch('/api/admin/banners', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch('/api/admin/pages', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        // Check for 403 errors (role mismatch) and try to refresh token
        const has403Error = !bannersRes.ok && bannersRes.status === 403 ||
                           !pagesRes.ok && pagesRes.status === 403;

        if (has403Error && !tokenRefreshAttempted) {
          console.log('⚠️ 403 error detected. Attempting to refresh token...');
          const res = await fetch('/api/auth/refresh-token', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            login(data.token, data.user);
            console.log('✅ Token refreshed successfully with updated role');
            
            // Retry fetching stats with new token
            const newToken = data.token;
            const [retryBannersRes, retryPagesRes] = await Promise.all([
              fetch('/api/admin/banners', {
                headers: {
                  Authorization: `Bearer ${newToken}`,
                },
              }),
              fetch('/api/admin/pages', {
                headers: {
                  Authorization: `Bearer ${newToken}`,
                },
              }),
            ]);

            const [bannersData, pagesData] = await Promise.all([
              safeJsonParse<{ banners?: any[] }>(retryBannersRes),
              safeJsonParse<{ pages?: any[] }>(retryPagesRes),
            ]);

            setStats({
              totalBanners: bannersData?.banners?.length || 0,
              activeBanners: bannersData?.banners?.filter((b: any) => b.isActive).length || 0,
              totalLocations: 0,
              activeLocations: 0,
              totalPages: pagesData?.pages?.length || 0,
              publishedPages: pagesData?.pages?.filter((p: any) => p.isPublished).length || 0,
            });
            setTokenRefreshAttempted(true);
            setLoading(false);
            return;
          } else {
            console.error('❌ Token refresh failed. Please logout and login again.');
            alert('Your role has been updated. Please logout and login again to refresh your permissions.');
            logout();
            router.push('/login?redirect=/admin');
            return;
          }
        }

        // Check if any request failed
        if (!bannersRes.ok || !pagesRes.ok) {
          const errors = [];
          if (!bannersRes.ok) errors.push(`Banners: ${bannersRes.status}`);
          if (!pagesRes.ok) errors.push(`Pages: ${pagesRes.status}`);
          console.error('Failed to fetch stats:', errors.join(', '));
        }

        const [bannersData, pagesData] = await Promise.all([
          safeJsonParse<{ banners?: any[] }>(bannersRes),
          safeJsonParse<{ pages?: any[] }>(pagesRes),
        ]);

        setStats({
          totalBanners: bannersData?.banners?.length || 0,
          activeBanners: bannersData?.banners?.filter((b: any) => b.isActive).length || 0,
          totalLocations: 0,
          activeLocations: 0,
          totalPages: pagesData?.pages?.length || 0,
          publishedPages: pagesData?.pages?.filter((p: any) => p.isPublished).length || 0,
        });
      } catch (error: any) {
        console.error('Error fetching stats:', error);
        // Set default stats on error so page still renders
        setStats({
          totalBanners: 0,
          activeBanners: 0,
          totalLocations: 0,
          activeLocations: 0,
          totalPages: 0,
          publishedPages: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchStats();
    }
  }, [token, tokenRefreshAttempted]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your website.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-sm border border-blue-200 p-5 hover:shadow-lg hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Total Banners</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalBanners || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-sm border border-green-200 p-5 hover:shadow-lg hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Active Banners</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats?.activeBanners || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>


        <div className="bg-gradient-to-br from-white to-indigo-50 rounded-xl shadow-sm border border-indigo-200 p-5 hover:shadow-lg hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Pages</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalPages || 0}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-pink-50 rounded-xl shadow-sm border border-pink-200 p-5 hover:shadow-lg hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-pink-600 uppercase tracking-wide">Published</p>
              <p className="text-2xl font-bold text-pink-600 mt-1">{stats?.publishedPages || 0}</p>
            </div>
            <div className="p-3 bg-pink-100 rounded-lg">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <Link
          href="/admin/banners"
          className="group relative overflow-hidden bg-gradient-to-br from-amber-50 via-amber-100 to-orange-50 rounded-xl shadow-lg p-4 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 hover:-translate-y-1"
        >
          {/* Multi-color Border Glow Effect */}
          <div 
            className="absolute inset-0 rounded-xl"
            style={{
              background: 'linear-gradient(45deg, #ef4444, #3b82f6, #10b981, #f59e0b, #8b5cf6, #ec4899, #06b6d4, #ef4444)',
              backgroundSize: '400% 400%',
              animation: 'multicolorGlow 3s ease-in-out infinite',
              filter: 'blur(10px)',
              zIndex: 0,
              margin: '-2px',
              opacity: 0.6,
            }}
          />
          <div className="absolute inset-[2px] bg-gradient-to-br from-amber-50 via-amber-100 to-orange-50 rounded-xl z-0" />
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/10 to-amber-400/0 group-hover:via-amber-400/20 transition-all duration-500 -translate-x-full group-hover:translate-x-full"></div>
          
          {/* Glow Effect */}
          <div className="absolute -top-5 -right-5 w-16 h-16 bg-amber-400/20 rounded-full blur-xl group-hover:bg-amber-400/40 group-hover:scale-150 transition-all duration-500"></div>
          
          <div className="relative z-10 bg-transparent">
            <div className="flex items-start justify-between mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400/30 rounded-xl blur-lg group-hover:blur-xl group-hover:bg-amber-400/50 transition-all duration-300"></div>
                <div className="relative p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="p-1 bg-white/50 backdrop-blur-sm rounded-lg group-hover:bg-white/80 group-hover:rotate-12 transition-all duration-300">
                <svg className="w-3 h-3 text-amber-600 group-hover:text-amber-700 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 mb-2 group-hover:text-amber-700 transition-colors">Manage Banners</h2>
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">Add, edit, or delete banners for hero, left, right, and bottom sections. Upload images directly from your computer.</p>
            <div className="flex items-center gap-1 text-amber-600 font-bold text-sm group-hover:text-amber-700">
              <span>Go to Banners</span>
              <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/homepage"
          className="group relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 rounded-xl shadow-lg p-4 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 hover:-translate-y-1"
        >
          {/* Multi-color Border Glow Effect */}
          <div 
            className="absolute inset-0 rounded-xl"
            style={{
              background: 'linear-gradient(45deg, #ef4444, #3b82f6, #10b981, #f59e0b, #8b5cf6, #ec4899, #06b6d4, #ef4444)',
              backgroundSize: '400% 400%',
              animation: 'multicolorGlow 3s ease-in-out infinite',
              filter: 'blur(10px)',
              zIndex: 0,
              margin: '-2px',
              opacity: 0.6,
            }}
          />
          <div className="absolute inset-[2px] bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 rounded-xl z-0" />
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-orange-400/10 to-orange-400/0 group-hover:via-orange-400/20 transition-all duration-500 -translate-x-full group-hover:translate-x-full"></div>
          
          {/* Glow Effect */}
          <div className="absolute -top-5 -right-5 w-16 h-16 bg-orange-400/20 rounded-full blur-xl group-hover:bg-orange-400/40 group-hover:scale-150 transition-all duration-500"></div>
          
          <div className="relative z-10 bg-transparent">
            <div className="flex items-start justify-between mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-400/30 rounded-xl blur-lg group-hover:blur-xl group-hover:bg-orange-400/50 transition-all duration-300"></div>
                <div className="relative p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </div>
              <div className="p-1 bg-white/50 backdrop-blur-sm rounded-lg group-hover:bg-white/80 group-hover:rotate-12 transition-all duration-300">
                <svg className="w-3 h-3 text-orange-600 group-hover:text-orange-700 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 mb-2 group-hover:text-orange-700 transition-colors">Manage Homepage</h2>
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">Configure homepage sections, shop settings, and duplicate homepage as new pages with shops and functions.</p>
            <div className="flex items-center gap-1 text-orange-600 font-bold text-sm group-hover:text-orange-700">
              <span>Go to Homepage</span>
              <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/pages"
          className="group relative overflow-hidden bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 rounded-xl shadow-lg p-4 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 hover:-translate-y-1"
        >
          {/* Multi-color Border Glow Effect */}
          <div 
            className="absolute inset-0 rounded-xl"
            style={{
              background: 'linear-gradient(45deg, #ef4444, #3b82f6, #10b981, #f59e0b, #8b5cf6, #ec4899, #06b6d4, #ef4444)',
              backgroundSize: '400% 400%',
              animation: 'multicolorGlow 3s ease-in-out infinite',
              filter: 'blur(10px)',
              zIndex: 0,
              margin: '-2px',
              opacity: 0.6,
            }}
          />
          <div className="absolute inset-[2px] bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 rounded-xl z-0" />
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-400/0 via-pink-400/10 to-pink-400/0 group-hover:via-pink-400/20 transition-all duration-500 -translate-x-full group-hover:translate-x-full"></div>
          
          {/* Glow Effect */}
          <div className="absolute -top-5 -right-5 w-16 h-16 bg-pink-400/20 rounded-full blur-xl group-hover:bg-pink-400/40 group-hover:scale-150 transition-all duration-500"></div>
          
          <div className="relative z-10 bg-transparent">
            <div className="flex items-start justify-between mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-pink-400/30 rounded-xl blur-lg group-hover:blur-xl group-hover:bg-pink-400/50 transition-all duration-300"></div>
                <div className="relative p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="p-1 bg-white/50 backdrop-blur-sm rounded-lg group-hover:bg-white/80 group-hover:rotate-12 transition-all duration-300">
                <svg className="w-3 h-3 text-pink-600 group-hover:text-pink-700 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 mb-2 group-hover:text-pink-700 transition-colors">Manage Pages</h2>
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">Create, edit, and manage website pages with SEO optimization. Full control over content and publishing.</p>
            <div className="flex items-center gap-1 text-pink-600 font-bold text-sm group-hover:text-pink-700">
              <span>Go to Pages</span>
              <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/slider-images"
          className="group relative overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-cyan-100 rounded-xl shadow-lg p-4 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 hover:-translate-y-1"
        >
          {/* Multi-color Border Glow Effect */}
          <div 
            className="absolute inset-0 rounded-xl"
            style={{
              background: 'linear-gradient(45deg, #ef4444, #3b82f6, #10b981, #f59e0b, #8b5cf6, #ec4899, #06b6d4, #ef4444)',
              backgroundSize: '400% 400%',
              animation: 'multicolorGlow 3s ease-in-out infinite',
              filter: 'blur(10px)',
              zIndex: 0,
              margin: '-2px',
              opacity: 0.6,
            }}
          />
          <div className="absolute inset-[2px] bg-gradient-to-br from-cyan-50 via-blue-50 to-cyan-100 rounded-xl z-0" />
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 group-hover:via-cyan-400/20 transition-all duration-500 -translate-x-full group-hover:translate-x-full"></div>
          
          {/* Glow Effect */}
          <div className="absolute -top-5 -right-5 w-16 h-16 bg-cyan-400/20 rounded-full blur-xl group-hover:bg-cyan-400/40 group-hover:scale-150 transition-all duration-500"></div>
          
          <div className="relative z-10 bg-transparent">
            <div className="flex items-start justify-between mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-400/30 rounded-xl blur-lg group-hover:blur-xl group-hover:bg-cyan-400/50 transition-all duration-300"></div>
                <div className="relative p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
              <div className="p-1 bg-white/50 backdrop-blur-sm rounded-lg group-hover:bg-white/80 group-hover:rotate-12 transition-all duration-300">
                <svg className="w-3 h-3 text-cyan-600 group-hover:text-cyan-700 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 mb-2 group-hover:text-cyan-700 transition-colors">Manage Slider Images</h2>
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">Add, edit, and manage slider images with 20+ transition effects. Configure auto-play, duration, and link URLs.</p>
            <div className="flex items-center gap-1 text-cyan-600 font-bold text-sm group-hover:text-cyan-700">
              <span>Go to Slider Images</span>
              <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/hero-banners"
          className="group relative overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-violet-100 rounded-xl shadow-lg p-4 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 hover:-translate-y-1"
        >
          {/* Multi-color Border Glow Effect */}
          <div 
            className="absolute inset-0 rounded-xl"
            style={{
              background: 'linear-gradient(45deg, #ef4444, #3b82f6, #10b981, #f59e0b, #8b5cf6, #ec4899, #06b6d4, #ef4444)',
              backgroundSize: '400% 400%',
              animation: 'multicolorGlow 3s ease-in-out infinite',
              filter: 'blur(10px)',
              zIndex: 0,
              margin: '-2px',
              opacity: 0.6,
            }}
          />
          <div className="absolute inset-[2px] bg-gradient-to-br from-violet-50 via-purple-50 to-violet-100 rounded-xl z-0" />
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-400/0 via-violet-400/10 to-violet-400/0 group-hover:via-violet-400/20 transition-all duration-500 -translate-x-full group-hover:translate-x-full"></div>
          
          {/* Glow Effect */}
          <div className="absolute -top-5 -right-5 w-16 h-16 bg-violet-400/20 rounded-full blur-xl group-hover:bg-violet-400/40 group-hover:scale-150 transition-all duration-500"></div>
          
          <div className="relative z-10 bg-transparent">
            <div className="flex items-start justify-between mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-violet-400/30 rounded-xl blur-lg group-hover:blur-xl group-hover:bg-violet-400/50 transition-all duration-300"></div>
                <div className="relative p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="p-1 bg-white/50 backdrop-blur-sm rounded-lg group-hover:bg-white/80 group-hover:rotate-12 transition-all duration-300">
                <svg className="w-3 h-3 text-violet-600 group-hover:text-violet-700 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 mb-2 group-hover:text-violet-700 transition-colors">Manage Hero Banners</h2>
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">Add, edit, and manage hero banners for specific pages with 20+ text effects and 20+ animations. Full control over display settings.</p>
            <div className="flex items-center gap-1 text-violet-600 font-bold text-sm group-hover:text-violet-700">
              <span>Go to Hero Banners</span>
              <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/reports"
          className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 rounded-xl shadow-lg p-4 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 hover:-translate-y-1"
        >
          {/* Multi-color Border Glow Effect */}
          <div 
            className="absolute inset-0 rounded-xl"
            style={{
              background: 'linear-gradient(45deg, #ef4444, #3b82f6, #10b981, #f59e0b, #8b5cf6, #ec4899, #06b6d4, #ef4444)',
              backgroundSize: '400% 400%',
              animation: 'multicolorGlow 3s ease-in-out infinite',
              filter: 'blur(10px)',
              zIndex: 0,
              margin: '-2px',
              opacity: 0.6,
            }}
          />
          <div className="absolute inset-[2px] bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 rounded-xl z-0" />
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/10 to-emerald-400/0 group-hover:via-emerald-400/20 transition-all duration-500 -translate-x-full group-hover:translate-x-full"></div>
          
          {/* Glow Effect */}
          <div className="absolute -top-5 -right-5 w-16 h-16 bg-emerald-400/20 rounded-full blur-xl group-hover:bg-emerald-400/40 group-hover:scale-150 transition-all duration-500"></div>
          
          <div className="relative z-10 bg-transparent">
            <div className="flex items-start justify-between mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400/30 rounded-xl blur-lg group-hover:blur-xl group-hover:bg-emerald-400/50 transition-all duration-300"></div>
                <div className="relative p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="p-1 bg-white/50 backdrop-blur-sm rounded-lg group-hover:bg-white/80 group-hover:rotate-12 transition-all duration-300">
                <svg className="w-3 h-3 text-emerald-600 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">Reports & Analytics</h2>
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">View revenue reports, agent performance, shop statistics, commission tracking. Export database to Excel/PDF.</p>
            <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm group-hover:text-emerald-700">
              <span>View Reports</span>
              <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}


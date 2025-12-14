'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/contexts/AuthContext';
import { useAgentAuth } from '@/app/contexts/AgentAuthContext';
import Navbar from '@/app/components/Navbar';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  const { login: agentLogin, isAuthenticated: isAgentAuthenticated } = useAgentAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'user' | 'admin' | 'editor' | 'operator' | 'agent'>('user');

  // Get redirect URL from query params
  const redirectUrl = searchParams.get('redirect') || '/';

  // If already logged in, redirect immediately
  useEffect(() => {
    if (isAuthenticated && selectedRole !== 'agent') {
      router.push(redirectUrl);
    }
    if (isAgentAuthenticated && selectedRole === 'agent') {
      router.push('/agent/dashboard');
    }
  }, [isAuthenticated, isAgentAuthenticated, selectedRole, redirectUrl, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading('Logging in...');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: selectedRole }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('Login successful, token received:', data.token ? 'Yes' : 'No');
        console.log('User data received:', data.user ? 'Yes' : 'No');
        
        if (!data.token || !data.user) {
          console.error('Missing token or user data in response:', data);
          toast.dismiss(loadingToast);
          toast.error('Login response incomplete. Please try again.');
          return;
        }
        
        toast.dismiss(loadingToast);
        toast.success('Login successful! Welcome back!');
        
        // Handle agent login
        if (data.isAgent) {
          // Use agent auth context for agents
          const agentData = {
            id: data.user.id,
            name: data.user.name,
            phone: data.user.phone || '',
            email: data.user.email,
            agentCode: data.user.agentCode,
            agentPanelText: data.user.agentPanelText,
            agentPanelTextColor: data.user.agentPanelTextColor,
            totalShops: data.user.totalShops,
            totalEarnings: data.user.totalEarnings,
          };
          agentLogin(data.token, agentData);
          
          // Redirect to agent dashboard
          setTimeout(() => {
            router.push('/agent/dashboard');
          }, 1000);
        } else {
          // Update auth context for regular users (user, admin, editor, operator)
          login(data.token, data.user);
          
          // Small delay to ensure token is saved
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Redirect based on role
          let redirectPath = redirectUrl;
          if (selectedRole === 'admin' || selectedRole === 'editor' || selectedRole === 'operator') {
            redirectPath = '/admin';
          }
          
          // Redirect to the redirect URL or role-based path after a short delay
          setTimeout(() => {
            router.push(redirectPath);
          }, 1000);
        }
      } else {
        toast.dismiss(loadingToast);
        toast.error(data.error || 'Login failed');
        console.error('Login failed:', data);
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-[98%] mx-auto px-2 sm:px-3 lg:px-4 py-8 sm:py-12">
        <div className="max-w-md mx-auto">
          {/* Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-900 px-6 py-8 text-center border-b border-amber-500/40">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-gray-300 text-sm sm:text-base">Sign in to your account</p>
            </div>

            {/* Form */}
            <div className="px-6 py-8">
              {/* Role Dropdown */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <label htmlFor="role-select" className="block text-sm font-semibold text-gray-700 mb-2">
                  Login As:
                </label>
                <select
                  id="role-select"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'user' | 'admin' | 'editor' | 'operator' | 'agent')}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-gray-900 font-medium cursor-pointer hover:border-amber-400 transition-all"
                >
                  <option value="user">User (Visitor)</option>
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="operator">Operator</option>
                  <option value="agent">Agent</option>
                </select>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-gray-900"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-gray-900"
                    placeholder="Enter your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-custom-gradient hover:opacity-90 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center space-y-3">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Forgot Password?
                  </Link>
                  {selectedRole === 'user' && (
                    <p className="text-sm text-gray-600">
                      Don't have an account?{' '}
                      <Link href="/signup" className="text-amber-600 hover:text-amber-700 font-semibold">
                        Sign Up
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-[98%] mx-auto px-2 sm:px-3 lg:px-4 py-8 sm:py-12">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border border-gray-100 p-8 text-center">
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

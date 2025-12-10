'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';

type Role = 'admin' | 'editor' | 'operator';

interface RoleBasedRouteGuardProps {
  children: ReactNode;
  allowedRoles: Role[];
  redirectTo?: string;
  showError?: boolean;
}

/**
 * RoleBasedRouteGuard Component
 * 
 * Is component ko use karke aap pages ko protect kar sakte hain based on user roles.
 * 
 * Usage Examples:
 * 
 * 1. Admin, Editor, ya Operator - kisi bhi ko access:
 *    <RoleBasedRouteGuard allowedRoles={['admin', 'editor', 'operator']}>
 *      <YourPageContent />
 *    </RoleBasedRouteGuard>
 * 
 * 2. Sirf Admin aur Editor:
 *    <RoleBasedRouteGuard allowedRoles={['admin', 'editor']}>
 *      <YourPageContent />
 *    </RoleBasedRouteGuard>
 * 
 * 3. Sirf Admin:
 *    <RoleBasedRouteGuard allowedRoles={['admin']}>
 *      <YourPageContent />
 *    </RoleBasedRouteGuard>
 */
export default function RoleBasedRouteGuard({
  children,
  allowedRoles,
  redirectTo = '/login',
  showError = true,
}: RoleBasedRouteGuardProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Agar user login nahi hai
    if (!isAuthenticated || !user) {
      if (showError) {
        toast.error('Please login to access this page');
      }
      router.push(redirectTo);
      return;
    }

    // Agar user ka role allowed roles mein nahi hai
    if (!allowedRoles.includes(user.role as Role)) {
      if (showError) {
        toast.error('You do not have permission to access this page');
      }
      router.push(redirectTo);
      return;
    }
  }, [user, isAuthenticated, allowedRoles, redirectTo, router, showError]);

  // Agar user authenticated hai aur uska role allowed hai, to content show karo
  if (isAuthenticated && user && allowedRoles.includes(user.role as Role)) {
    return <>{children}</>;
  }

  // Loading state - redirect ho raha hai
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Checking permissions...</p>
      </div>
    </div>
  );
}











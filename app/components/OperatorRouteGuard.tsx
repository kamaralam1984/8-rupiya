'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOperatorAuth } from '@/app/contexts/OperatorAuthContext';

export default function OperatorRouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, operator } = useOperatorAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !operator) {
      router.push('/operator/login');
    }
  }, [isAuthenticated, operator, router]);

  if (!isAuthenticated || !operator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


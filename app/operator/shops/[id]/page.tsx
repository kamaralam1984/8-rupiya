'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOperatorAuth } from '@/app/contexts/OperatorAuthContext';
import OperatorRouteGuard from '@/app/components/OperatorRouteGuard';

export default function OperatorShopDetailPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard - shop detail page removed from operator panel
    router.push('/operator/dashboard');
  }, [router]);

  return (
    <OperatorRouteGuard>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    </OperatorRouteGuard>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PromotePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to shopper login
    router.replace('/shopper/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to Shopper Panel...</p>
      </div>
    </div>
  );
}




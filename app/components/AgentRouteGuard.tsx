'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAgentAuth } from '@/app/contexts/AgentAuthContext';

export default function AgentRouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, agent } = useAgentAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !agent) {
      router.push('/agent/login');
    }
  }, [isAuthenticated, agent, router]);

  if (!isAuthenticated || !agent) {
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


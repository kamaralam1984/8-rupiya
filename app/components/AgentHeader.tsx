'use client';

import { useRouter } from 'next/navigation';
import { useAgentAuth } from '@/app/contexts/AgentAuthContext';
import AgentServerStatus from '@/app/components/AgentServerStatus';

interface AgentHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function AgentHeader({ title = '8rupiya.com Digital Shop', subtitle = 'Field Agent Panel' }: AgentHeaderProps) {
  const { logout } = useAgentAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/agent/login');
  };

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-blue-100 text-sm">{subtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            <AgentServerStatus />
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}


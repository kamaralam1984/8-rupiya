import { AgentAuthProvider } from '@/app/contexts/AgentAuthContext';
import AgentLocationTracker from '@/app/components/AgentLocationTracker';

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AgentAuthProvider>
      <AgentLocationTracker />
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </AgentAuthProvider>
  );
}


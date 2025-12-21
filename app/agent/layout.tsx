import { AgentAuthProvider } from '@/app/contexts/AgentAuthContext';

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AgentAuthProvider>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </AgentAuthProvider>
  );
}


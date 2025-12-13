import { OperatorAuthProvider } from '@/app/contexts/OperatorAuthContext';

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OperatorAuthProvider>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </OperatorAuthProvider>
  );
}


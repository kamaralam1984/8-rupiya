'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '../components/Navbar';

export default function NotFound() {
  const params = useParams();
  const slug = params?.slug as string;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300 mb-4">404</h1>
          <div className="inline-block border-l-4 border-blue-600 pl-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">This page could not be found.</h2>
            <p className="text-gray-600">
              The page <code className="bg-gray-100 px-2 py-1 rounded font-mono">/{slug}</code> does not exist or has been removed.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
          >
            Go Back Home
          </Link>
          <div>
            <p className="text-sm text-gray-500 mt-4">
              Or try searching for what you need
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}


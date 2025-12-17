'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get('paymentId');
  const [status, setStatus] = useState<'checking' | 'success' | 'failed'>('checking');

  useEffect(() => {
    if (paymentId) {
      checkPaymentStatus();
    } else {
      setStatus('failed');
      toast.error('Payment ID not found');
    }
  }, [paymentId]);

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/payment/status/${paymentId}`);
      const data = await response.json();

      if (data.success && data.payment.status === 'SUCCESS') {
        setStatus('success');
        toast.success('Payment successful!');
        setTimeout(() => {
          router.push(`/payment/success?paymentId=${paymentId}`);
        }, 2000);
      } else {
        setStatus('failed');
        toast.error('Payment not verified yet');
      }
    } catch (error) {
      console.error('Payment status check error:', error);
      setStatus('failed');
      toast.error('Failed to verify payment');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {status === 'checking' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment...</h2>
            <p className="text-gray-600">Please wait while we verify your payment</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600">Redirecting to success page...</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="text-red-500 text-6xl mb-4">✗</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Verification Failed</h2>
            <p className="text-gray-600 mb-4">Please contact support if payment was deducted</p>
            <button
              onClick={checkPaymentStatus}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Retry Verification
            </button>
          </>
        )}
      </div>
    </div>
  );
}



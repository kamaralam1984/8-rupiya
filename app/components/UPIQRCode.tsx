'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface UPIQRCodeProps {
  amount: number;
  shopName: string;
  ownerName: string;
  mobile: string;
  onPaymentVerified: (screenshotUrl?: string) => void;
}

/**
 * UPI QR Code Component
 * Generates UPI payment QR code and handles payment verification
 */
// UPI ID constant - set your UPI ID here
const DEFAULT_UPI_ID = 'kamaralam137-1@okicici';

export default function UPIQRCode({ amount, shopName, ownerName, mobile, onPaymentVerified }: UPIQRCodeProps) {
  // Set UPI ID - use environment variable or default constant
  const UPI_ID = (typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_UPI_ID || DEFAULT_UPI_ID)
    : (process.env.NEXT_PUBLIC_UPI_ID || DEFAULT_UPI_ID));
  
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'verified' | 'screenshot-required' | 'failed'>('pending');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const paymentIdRef = useRef<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate UPI payment string
  const generateUPIString = () => {
    // UPI format: upi://pay?pa=<VPA>&pn=<PayeeName>&am=<Amount>&cu=<Currency>&tn=<TransactionNote>
    // Use the UPI ID constant
    const upiId = UPI_ID;
    const payeeName = 'Digital India Shop Directory';
    const transactionNote = `Payment for ${shopName} - ${ownerName}`;
    
    // Generate unique payment ID
    paymentIdRef.current = `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}&tr=${paymentIdRef.current}`;
    return upiString;
  };

  // Generate QR Code
  useEffect(() => {
    const generateQR = async () => {
      try {
        const upiString = generateUPIString();
        const qrDataUrl = await QRCode.toDataURL(upiString, {
          width: 400,
          margin: 3,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'H', // High error correction for better scanning
        });
        setQrCodeUrl(qrDataUrl);
        
        // Start polling for payment verification
        startPaymentVerification();
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQR();

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start payment verification polling
  const startPaymentVerification = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      if (paymentStatus === 'verified' || paymentStatus === 'failed') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        return;
      }

      setIsVerifying(true);
      try {
        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentId: paymentIdRef.current,
            amount: amount,
            shopName: shopName,
            ownerName: ownerName,
            mobile: mobile,
          }),
        });

        const data = await response.json();
        if (data.success && data.verified) {
          setPaymentStatus('screenshot-required');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      } catch (error) {
        console.error('Payment verification error:', error);
      } finally {
        setIsVerifying(false);
      }
    }, 5000); // Check every 5 seconds
  };

  // Manual verification button
  const handleManualVerify = async () => {
    setIsVerifying(true);
    try {
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: paymentIdRef.current,
          amount: amount,
          shopName: shopName,
          ownerName: ownerName,
          mobile: mobile,
        }),
      });

      const data = await response.json();
      if (data.success && data.verified) {
        setPaymentStatus('screenshot-required');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      } else {
        setPaymentStatus('failed');
        setTimeout(() => setPaymentStatus('pending'), 3000);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentStatus('failed');
      setTimeout(() => setPaymentStatus('pending'), 3000);
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle screenshot upload
  const handleUploadScreenshot = async () => {
    if (!screenshotFile) return;

    setUploadingScreenshot(true);
    try {
      const formData = new FormData();
      formData.append('file', screenshotFile);
      formData.append('paymentId', paymentIdRef.current);
      formData.append('amount', amount.toString());
      formData.append('shopName', shopName);
      formData.append('ownerName', ownerName);
      formData.append('mobile', mobile);

      const response = await fetch('/api/payment/upload-screenshot', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setPaymentStatus('verified');
        onPaymentVerified(data.screenshotUrl);
      } else {
        throw new Error(data.error || 'Failed to upload screenshot');
      }
    } catch (error: any) {
      console.error('Screenshot upload error:', error);
      alert(error.message || 'Failed to upload screenshot');
    } finally {
      setUploadingScreenshot(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Scan to Pay with UPI</h3>
        <p className="text-sm text-gray-600 mb-4">Amount: ₹{amount}</p>
      </div>

      {qrCodeUrl && (
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="bg-white p-4 rounded-xl shadow-lg">
              <img
                src={qrCodeUrl}
                alt="UPI QR Code"
                className="w-72 h-72 border-2 border-gray-300 rounded-lg"
              />
              {paymentStatus === 'verified' && (
                <div className="absolute inset-0 bg-green-500 bg-opacity-90 flex items-center justify-center rounded-lg">
                  <div className="text-center text-white">
                    <div className="text-4xl mb-2">✓</div>
                    <div className="font-semibold">Payment Verified!</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* UPI ID Display Box */}
          <div className="bg-gray-50 rounded-lg p-4 w-full max-w-sm border border-gray-200">
            <p className="text-xs text-gray-600 mb-2 text-center">Pay to UPI ID:</p>
            <div className="flex items-center justify-center gap-2 bg-white rounded-lg p-2">
              <p className="text-sm font-semibold text-gray-900 break-all">
                {UPI_ID}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(UPI_ID).then(() => {
                    alert('UPI ID copied to clipboard!');
                  }).catch(() => {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = UPI_ID;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    alert('UPI ID copied to clipboard!');
                  });
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-semibold px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                title="Copy UPI ID"
              >
                📋 Copy
              </button>
            </div>
          </div>
          
          {/* Amount Display Box */}
          <div className="bg-blue-50 rounded-lg p-3 w-full max-w-sm border border-blue-200">
            <p className="text-xs text-gray-600 text-center mb-1">Amount to Pay</p>
            <p className="text-2xl font-bold text-blue-600 text-center">₹{amount}</p>
          </div>
        </div>
      )}

      <div className="text-center space-y-3">
        <p className="text-xs text-gray-500">
          Scan this QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.) to complete payment
        </p>
        
        {paymentStatus === 'pending' && (
          <div className="space-y-2">
            {isVerifying && (
              <p className="text-sm text-blue-600">Checking payment status...</p>
            )}
            <button
              onClick={handleManualVerify}
              disabled={isVerifying}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-lg"
            >
              {isVerifying ? 'Verifying...' : 'I have Paid - Verify Payment'}
            </button>
            <p className="text-xs text-gray-400 mt-2">
              After payment, click the button above to verify
            </p>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <p className="text-sm text-red-600">Payment not verified. Please try again.</p>
        )}
      </div>

      {/* Screenshot Upload Section */}
      {paymentStatus === 'screenshot-required' && (
        <div className="border-t pt-4 space-y-4">
          <div className="text-center">
            <h4 className="text-md font-semibold text-gray-900 mb-2">Upload Payment Screenshot</h4>
            <p className="text-sm text-gray-600 mb-4">
              Please upload a screenshot of your payment confirmation
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setScreenshotFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setScreenshotPreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors"
              >
                {screenshotPreview ? (
                  <div className="space-y-2">
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <p className="text-sm text-gray-600">Click to change image</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-4xl">📷</div>
                    <p className="text-sm text-gray-600">Click to upload payment screenshot</p>
                  </div>
                )}
              </button>
            </div>

            {screenshotFile && (
              <button
                onClick={handleUploadScreenshot}
                disabled={uploadingScreenshot}
                className="w-full bg-green-600 text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {uploadingScreenshot ? 'Uploading...' : 'Upload Screenshot & Complete Payment'}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="text-center text-xs text-gray-400 border-t pt-3 mt-3">
        {paymentIdRef.current && (
          <p className="mb-1">Transaction ID: {paymentIdRef.current}</p>
        )}
        <p className="text-xs">Powered by UPI - Unified Payments Interface</p>
      </div>
    </div>
  );
}


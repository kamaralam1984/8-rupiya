'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface UPIQRCodeProps {
  amount: number;
  shopName: string;
  ownerName: string;
  mobile: string;
  onPaymentVerified: (screenshotUrl: string) => void;
}

export default function UPIQRCode({
  amount,
  shopName,
  ownerName,
  mobile,
  onPaymentVerified,
}: UPIQRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [paymentId] = useState<string>(() => `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`);

  // Generate UPI payment string
  // Format: upi://pay?pa=<UPI_ID>&pn=<PAYEE_NAME>&am=<AMOUNT>&cu=<CURRENCY>&tn=<TRANSACTION_NOTE>
  // For now, we'll use a generic UPI ID - you can configure this in environment variables
  const upiId = process.env.NEXT_PUBLIC_UPI_ID || 'your-upi-id@paytm';
  const upiPaymentString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(ownerName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Payment for ${shopName}`)}`;

  // Generate QR code when component mounts or when amount/shop details change
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrDataUrl = await QRCode.toDataURL(upiPaymentString, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'H',
        });
        setQrCodeUrl(qrDataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
        toast.error('Failed to generate QR code');
      }
    };

    generateQRCode();
  }, [upiPaymentString]);

  // Handle screenshot upload
  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('paymentId', paymentId);
      formData.append('amount', amount.toString());
      formData.append('shopName', shopName);
      formData.append('ownerName', ownerName);
      formData.append('mobile', mobile);

      const response = await fetch('/api/payment/upload-screenshot', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.screenshotUrl) {
        toast.success('Payment screenshot uploaded successfully!');
        onPaymentVerified(data.screenshotUrl);
      } else {
        throw new Error(data.error || 'Failed to upload screenshot');
      }
    } catch (error: any) {
      console.error('Screenshot upload error:', error);
      toast.error(error.message || 'Failed to upload screenshot');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-3 text-gray-900">
        📱 UPI Payment QR Code
      </h3>

      <div className="space-y-4">
        {/* Amount Display */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Amount:</strong> ₹{amount}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Shop:</strong> {shopName}
          </p>
        </div>

        {/* QR Code */}
        {qrCodeUrl && (
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
              <Image
                src={qrCodeUrl}
                alt="UPI Payment QR Code"
                width={300}
                height={300}
                className="rounded-lg"
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Scan this QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.)
            </p>
          </div>
        )}

        {/* UPI Payment String (for manual entry) */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">UPI Payment String:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={upiPaymentString}
              readOnly
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded bg-white"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(upiPaymentString);
                toast.success('UPI string copied!');
              }}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Screenshot Upload */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Payment Screenshot (After Payment)
          </label>
          {screenshotPreview ? (
            <div className="space-y-2">
              <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200">
                <Image
                  src={screenshotPreview}
                  alt="Payment screenshot preview"
                  fill
                  className="object-contain"
                />
              </div>
              <button
                onClick={() => {
                  setScreenshotPreview(null);
                }}
                className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Remove Screenshot
              </button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-2xl">📸</span>
                  </div>
                  <div>
                    <p className="text-gray-700 font-semibold text-sm">Upload Payment Screenshot</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {uploading ? 'Uploading...' : 'Take a screenshot of your payment confirmation'}
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </div>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}


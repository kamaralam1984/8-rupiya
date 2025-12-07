'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * Shop interface matching the API response
 * Supports both old model (name, address) and new model (shopName, ownerName, fullAddress, pincode)
 */
interface Shop {
  _id: string;
  // Old model fields
  name?: string;
  address?: string;
  imageUrl?: string;
  iconUrl?: string;
  imagePublicId?: string;
  // New model fields
  shopName?: string;
  ownerName?: string;
  fullAddress?: string;
  city?: string;
  district?: string;
  pincode?: string;
  photoUrl?: string;
  mobile?: string;
  // Payment fields
  paymentStatus?: 'PAID' | 'PENDING';
  paymentExpiryDate?: string;
  lastPaymentDate?: string;
  // Plan fields
  planType?: 'BASIC' | 'PREMIUM' | 'FEATURED' | 'LEFT_BAR' | 'RIGHT_BAR' | 'BANNER' | 'HERO';
  planAmount?: number;
  // Common fields
  category: string;
  latitude: number;
  longitude: number;
  area?: string;
  createdAt: string;
}

/**
 * Admin page for listing all shops
 * Displays shops in a table with image previews
 */
export default function ShopsPage() {
  const { token } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editDateValue, setEditDateValue] = useState<string>('');
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [deletingShop, setDeletingShop] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editPlanValue, setEditPlanValue] = useState<string>('BASIC');
  const [deletingWithoutCoords, setDeletingWithoutCoords] = useState(false);
  const [categories, setCategories] = useState<Array<{ _id: string; name: string; slug: string }>>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryValue, setEditCategoryValue] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [deletingAllShops, setDeletingAllShops] = useState(false);

  useEffect(() => {
    if (token) {
      fetchShops();
      fetchCategories();
      // Auto-check and move expired shops on page load
      checkAndMoveExpiredShops();
    }
  }, [token, filterStatus]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // Auto-check expiry every 5 minutes
  useEffect(() => {
    if (!token) return;
    
    const interval = setInterval(() => {
      checkAndMoveExpiredShops(false); // Silent check
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [token]);

  const checkAndMoveExpiredShops = async (showToast = true) => {
    try {
      const response = await fetch('/api/admin/shops/check-expiry', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.movedCount > 0) {
        if (showToast) {
          toast.success(`Moved ${data.movedCount} expired shops to renew collection`);
        }
        fetchShops(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to check expiry:', error);
      // Don't show error toast for silent checks
      if (showToast) {
        toast.error('Failed to check expired shops');
      }
    }
  };

  const fetchShops = async () => {
    try {
      // Fetch based on filter
      let url = '/api/admin/shops';
      if (filterStatus === 'pending') {
        url = '/api/admin/shops/pending';
      }
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Check if response is OK
      if (!res.ok) {
        const text = await res.text();
        console.error('API Error Response:', text);
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      // Check content type
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON Response:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response');
      }
      
      const data = await res.json();
      if (data.success) {
        let fetchedShops = data.shops || [];
        
        // Filter by status if needed (for 'paid' filter on regular shops endpoint)
        if (filterStatus === 'paid') {
          fetchedShops = fetchedShops.filter((s: Shop) => s.paymentStatus === 'PAID' || (!s.paymentStatus && (s.lastPaymentDate || s.paymentExpiryDate)));
        }
        
        setShops(fetchedShops);
      } else {
        toast.error(data.error || 'Failed to fetch shops');
      }
    } catch (error: any) {
      console.error('Fetch shops error:', error);
      toast.error(error.message || 'Failed to fetch shops');
      setShops([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleEditShop = (shop: Shop) => {
    setEditingShop(shop);
  };

  const handleDeleteShop = async (shopId: string, shopName: string, shopPaymentStatus?: string, shopPlanAmount?: number) => {
    const isPaid = shopPaymentStatus === 'PAID' || shopPaymentStatus === 'paid';
    const amount = shopPlanAmount || 100;
    
    let confirmMessage = `Are you sure you want to delete shop "${shopName}"?\n\n`;
    
    if (isPaid) {
      confirmMessage += `⚠️ WARNING: This shop is PAID (₹${amount}).\n\n`;
      confirmMessage += `If you delete this shop:\n`;
      confirmMessage += `- Shop will be permanently deleted from all collections\n`;
      confirmMessage += `- Agent commission (₹${Math.round(amount * 0.2)}) will be deducted\n`;
      confirmMessage += `- Revenue (₹${amount}) will be deducted\n`;
      confirmMessage += `- AgentShop record will be deleted\n\n`;
    } else {
      confirmMessage += `This shop is PENDING payment.\n\n`;
    }
    
    confirmMessage += `This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    // Second confirmation for paid shops
    if (isPaid) {
      const secondConfirm = confirm(
        `⚠️ FINAL CONFIRMATION!\n\n` +
        `Shop: "${shopName}"\n` +
        `Amount: ₹${amount}\n` +
        `Commission to deduct: ₹${Math.round(amount * 0.2)}\n\n` +
        `Are you absolutely sure you want to delete this shop?\n\n` +
        `This will permanently remove the shop and deduct commission/revenue.`
      );
      
      if (!secondConfirm) {
        return;
      }
    }

    setDeletingShop(shopId);
    try {
      const response = await fetch(`/api/admin/shops/${shopId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.error || `Failed to delete shop (${response.status})`);
        } else {
          const text = await response.text();
          console.error('Non-JSON error response:', text.substring(0, 200));
          toast.error(`Failed to delete shop (HTTP ${response.status})`);
        }
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      if (data.success) {
        if (data.deductions && data.deductions.commissionDeducted > 0) {
          toast.success(
            `Shop deleted! Deducted ₹${data.deductions.commissionDeducted} from agent (${data.deductions.agentCode || 'N/A'}) and ₹${data.deductions.revenueDeducted} from revenue.`,
            { duration: 6000 }
          );
        } else {
          toast.success('Shop deleted successfully!');
        }
        fetchShops(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to delete shop');
      }
    } catch (error: any) {
      console.error('Failed to delete shop:', error);
      toast.error(error.message || 'Failed to delete shop');
    } finally {
      setDeletingShop(null);
    }
  };

  const handleSaveCreatedDate = async (shopId: string) => {
    if (!editDateValue) {
      toast.error('Please select a date');
      return;
    }

    try {
      const response = await fetch(`/api/admin/shops/${shopId}/update-created-date`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          createdAt: editDateValue,
        }),
      });

      // Check if response is ok
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Update created date API error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            shopId,
          });
          toast.error(errorData.error || `Failed to update created date (${response.status})`);
        } else {
          const text = await response.text();
          console.error('Non-JSON error response:', text.substring(0, 200));
          toast.error(`Failed to update created date (HTTP ${response.status})`);
        }
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Created date updated successfully!');
        setEditingDate(null);
        setEditDateValue('');
        fetchShops(); // Refresh the list
      } else {
        console.error('Update created date error:', data);
        toast.error(data.error || 'Failed to update created date');
      }
    } catch (error: any) {
      console.error('Failed to update created date:', error);
      toast.error(error.message || 'Failed to update created date');
    }
  };

  const handleMarkPaymentDone = async (shopId: string, mobile?: string, shopPlanType?: string, shopPlanAmount?: number, shopDistrict?: string) => {
    // Use shop's existing plan if available, otherwise prompt
    const finalPlan = (shopPlanType || 'BASIC') as 'BASIC' | 'PREMIUM' | 'FEATURED' | 'LEFT_BAR' | 'RIGHT_BAR' | 'BANNER' | 'HERO';
    const amount = shopPlanAmount || (finalPlan === 'BASIC' ? 100 : finalPlan === 'PREMIUM' ? 299 : 1000);
    const district = shopDistrict || undefined;
    
    if (!confirm(`Mark payment as done?\nPlan: ${finalPlan}\nAmount: ₹${amount}\nThis will move shop to paid shops and send notification.`)) {
      return;
    }

    try {
      setProcessingPayment(shopId);
      const response = await fetch(`/api/admin/shops/${shopId}/mark-payment-done`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMode: 'CASH',
          amount: amount,
          planType: finalPlan,
          district: district,
          receiptNo: `REC${Date.now()}`,
          mobile: mobile,
        }),
      });

      // Check if response is ok
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Payment done API error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            shopId,
          });
          toast.error(errorData.error || `Failed to mark payment as done (${response.status})`);
        } else {
          const text = await response.text();
          console.error('Non-JSON error response:', text.substring(0, 200));
          toast.error(`Failed to mark payment as done (HTTP ${response.status})`);
        }
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Payment marked as done! Shop moved to paid shops.');
        fetchShops(); // Refresh the list
      } else {
        console.error('Payment done error:', data);
        toast.error(data.error || 'Failed to mark payment as done');
        if (data.shopId) {
          console.error('Shop ID that failed:', data.shopId);
        }
      }
    } catch (error: any) {
      console.error('Failed to mark payment as done:', error);
      toast.error(error.message || 'Failed to mark payment as done');
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleSaveCategory = async (shopId: string) => {
    if (!editCategoryValue) {
      toast.error('Please select a category');
      return;
    }

    try {
      const response = await fetch(`/api/admin/shops/${shopId}/update-category`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: editCategoryValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to update category');
        return;
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Category updated successfully!');
        setEditingCategory(null);
        setEditCategoryValue('');
        fetchShops();
      } else {
        toast.error(data.error || 'Failed to update category');
      }
    } catch (error: any) {
      console.error('Failed to update category:', error);
      toast.error(error.message || 'Failed to update category');
    }
  };

  const handleSavePlan = async (shopId: string) => {
    try {
      const response = await fetch(`/api/admin/shops/${shopId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType: editPlanValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to update plan');
        return;
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Plan updated successfully!');
        setEditingPlan(null);
        setEditPlanValue('BASIC');
        fetchShops();
      } else {
        toast.error(data.error || 'Failed to update plan');
      }
    } catch (error: any) {
      console.error('Failed to update plan:', error);
      toast.error(error.message || 'Failed to update plan');
    }
  };

  const handleDeleteAllShops = async () => {
    const totalShops = shops.length;
    const paidShops = shops.filter(s => s.paymentStatus === 'PAID' || (s.lastPaymentDate && !s.paymentStatus));
    
    let confirmMessage = `⚠️ WARNING: Delete ALL Shops?\n\n`;
    confirmMessage += `Total Shops: ${totalShops}\n`;
    confirmMessage += `Paid Shops: ${paidShops.length}\n`;
    confirmMessage += `Pending Shops: ${totalShops - paidShops.length}\n\n`;
    
    if (paidShops.length > 0) {
      confirmMessage += `If you delete all shops:\n`;
      confirmMessage += `- ALL shops will be permanently deleted\n`;
      confirmMessage += `- Agent commissions will be deducted\n`;
      confirmMessage += `- Revenue will be deducted\n`;
      confirmMessage += `- AgentShop records will be deleted\n`;
      confirmMessage += `- This action CANNOT be undone\n\n`;
    }
    
    confirmMessage += `Are you absolutely sure?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    // Second confirmation
    const secondConfirm = confirm(
      `⚠️ FINAL CONFIRMATION!\n\n` +
      `You are about to delete ALL ${totalShops} shops.\n\n` +
      `This will:\n` +
      `- Delete all shops from all collections\n` +
      `- Deduct commissions from agents\n` +
      `- Deduct revenue from system\n\n` +
      `Type "DELETE ALL" to confirm:`
    );

    if (!secondConfirm) {
      return;
    }

    // Third confirmation with typed text
    const typedConfirm = prompt(
      `⚠️ TYPE "DELETE ALL" (exactly) to confirm deletion of all ${totalShops} shops:\n\n` +
      `This action is PERMANENT and CANNOT be undone!`
    );

    if (typedConfirm !== 'DELETE ALL') {
      toast.error('Confirmation text did not match. Deletion cancelled.');
      return;
    }

    setDeletingAllShops(true);
    try {
      const response = await fetch('/api/admin/shops/delete-all', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.error || `Failed to delete all shops (${response.status})`);
        } else {
          const text = await response.text();
          console.error('Non-JSON error response:', text.substring(0, 200));
          toast.error(`Failed to delete all shops (HTTP ${response.status})`);
        }
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      if (data.success) {
        toast.success(
          `All shops deleted! Deleted ${data.deleted.total} shops. Deducted ₹${data.deductions.totalCommissionDeducted} from ${data.deductions.agentsAffected} agents and ₹${data.deductions.totalRevenueDeducted} from revenue.`,
          { duration: 8000 }
        );
        fetchShops(); // Refresh the list (will be empty)
      } else {
        toast.error(data.error || 'Failed to delete all shops');
      }
    } catch (error: any) {
      console.error('Failed to delete all shops:', error);
      toast.error(error.message || 'Failed to delete all shops');
    } finally {
      setDeletingAllShops(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading shops...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Shops</h1>
          <div className="flex gap-3">
            <Link
              href="/admin/shops/pending"
              className="px-4 py-2 bg-orange-600 text-white font-semibold rounded-md hover:bg-orange-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
            >
              ⏳ Pending Shops
            </Link>
            <button
              onClick={handleDeleteAllShops}
              disabled={deletingAllShops || shops.length === 0}
              className="px-4 py-2 bg-red-700 text-white font-semibold rounded-md hover:bg-red-800 transition-colors shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-red-800"
              title={shops.length === 0 ? 'No shops to delete' : 'Delete ALL shops (with commission & revenue deduction)'}
            >
              {deletingAllShops ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Deleting All...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  🗑️ Delete All Shops
                </>
              )}
            </button>
            <button
              onClick={async () => {
                if (!confirm('This will delete ALL shops without coordinates (latitude/longitude). This action cannot be undone. Are you sure you want to continue?')) {
                  return;
                }
                
                if (!confirm('Final confirmation: Delete all shops without coordinates?')) {
                  return;
                }

                setDeletingWithoutCoords(true);
                try {
                  const res = await fetch('/api/admin/shops/delete-without-coordinates', {
                    method: 'DELETE',
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  });

                  const data = await res.json();
                  if (data.success) {
                    toast.success(`Deleted ${data.deleted.total} shops without coordinates (${data.deleted.adminShops} admin shops, ${data.deleted.agentShops} agent shops)`);
                    fetchShops(); // Refresh the list
                  } else {
                    toast.error(data.error || 'Failed to delete shops without coordinates');
                  }
                } catch (error: any) {
                  console.error('Failed to delete shops without coordinates:', error);
                  toast.error(error.message || 'Failed to delete shops without coordinates');
                } finally {
                  setDeletingWithoutCoords(false);
                }
              }}
              disabled={deletingWithoutCoords}
              className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deletingWithoutCoords ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Without Coords
                </>
              )}
            </button>
            <Link
              href="/admin/shops/new-from-image"
              className="bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 transition-colors"
            >
              📸 New Shop (Image)
            </Link>
            <Link
              href="/admin/shops/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              + Create New Shop
            </Link>
          </div>
        </div>

        {shops.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 mb-4">No shops found.</p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/admin/shops/new-from-image"
                className="text-cyan-600 hover:text-cyan-700 font-medium"
              >
                📸 New Shop from Image →
              </Link>
              <Link
                href="/admin/shops/new"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create New Shop →
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Filter Tabs */}
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Shops
                </button>
                <button
                  onClick={() => setFilterStatus('paid')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === 'paid'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Paid Shops
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === 'pending'
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Pending Shops
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shop Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pincode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date (Payment Date)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Remaining
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shops.map((shop) => {
                    // Support both old and new model formats
                    const shopName = shop.shopName || shop.name || 'Unknown';
                    const ownerName = shop.ownerName || 'N/A';
                    const imageUrl = shop.photoUrl || shop.imageUrl || shop.iconUrl || '';
                    const address = shop.fullAddress || shop.address || '';
                    const pincode = shop.pincode || 'N/A';
                    
                    // Calculate expiry date and days remaining
                    const now = new Date();
                    const expiryDate = shop.paymentExpiryDate 
                      ? new Date(shop.paymentExpiryDate)
                      : new Date(new Date(shop.createdAt).getTime() + 365 * 24 * 60 * 60 * 1000); // createdAt + 365 days
                    
                    const daysDiff = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const isExpired = daysDiff < 0;
                    const daysRemaining = isExpired ? Math.abs(daysDiff) : daysDiff;
                    
                    // Created date is the payment/renewal date (createdAt)
                    const createdDate = new Date(shop.createdAt);
                    const hasPayment = shop.lastPaymentDate || shop.paymentExpiryDate;
                    const paymentStatus = shop.paymentStatus || (hasPayment ? 'PAID' : 'PENDING');
                    const isPending = paymentStatus === 'PENDING';
                    
                    return (
                      <tr key={shop._id} className={`hover:bg-gray-50 ${isPending ? 'bg-orange-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {imageUrl && (
                            <div className="h-16 w-16 relative">
                              <Image
                                src={imageUrl}
                                alt={shopName}
                                fill
                                className="object-cover rounded-md"
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{shopName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{ownerName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingCategory === shop._id ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={editCategoryValue}
                                onChange={(e) => setEditCategoryValue(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-sm min-w-[150px]"
                                autoFocus
                              >
                                <option value="">Select category</option>
                                {categories.map((cat) => (
                                  <option key={cat._id} value={cat.name}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleSaveCategory(shop._id)}
                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCategory(null);
                                  setEditCategoryValue('');
                                }}
                                className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="text-sm text-gray-500">{shop.category}</div>
                              <button
                                onClick={() => {
                                  setEditingCategory(shop._id);
                                  setEditCategoryValue(shop.category || '');
                                }}
                                className="text-blue-600 hover:text-blue-700 text-xs"
                                title="Edit category"
                              >
                                ✏️
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingPlan === shop._id ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={editPlanValue}
                                onChange={(e) => setEditPlanValue(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                                autoFocus
                              >
                                <option value="BASIC">Basic ₹100</option>
                                <option value="PREMIUM">Premium ₹2999</option>
                                <option value="FEATURED">Featured ₹199+</option>
                                <option value="LEFT_BAR">Left Bar ₹299</option>
                                <option value="RIGHT_BAR">Right Bar ₹299</option>
                                <option value="BANNER">Banner ₹399</option>
                                <option value="HERO">Hero ₹499</option>
                              </select>
                              <button
                                onClick={() => handleSavePlan(shop._id)}
                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingPlan(null);
                                  setEditPlanValue('BASIC');
                                }}
                                className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {(() => {
                                const planType = shop.planType || 'BASIC';
                                const planColors: Record<string, { bg: string; text: string; label: string }> = {
                                  'BASIC': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Basic ₹100' },
                                  'PREMIUM': { bg: 'bg-green-100', text: 'text-green-800', label: 'Premium ₹2999' },
                                  'FEATURED': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Featured ₹199+' },
                                  'LEFT_BAR': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Left Bar ₹299' },
                                  'RIGHT_BAR': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Right Bar ₹299' },
                                  'BANNER': { bg: 'bg-pink-100', text: 'text-pink-800', label: 'Banner ₹399' },
                                  'HERO': { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Hero ₹499' },
                                };
                                const colors = planColors[planType] || planColors['BASIC'];
                                return (
                                  <>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                                      {colors.label}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setEditPlanValue(shop.planType || 'BASIC');
                                        setEditingPlan(shop._id);
                                      }}
                                      className="text-blue-600 hover:text-blue-700 text-xs"
                                      title="Edit plan"
                                    >
                                      ✏️
                                    </button>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isPending ? (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                              ⏳ PENDING
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              ✅ PAID
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {shop.area && (
                            <div className="text-sm text-gray-900">{shop.area}</div>
                          )}
                          {shop.city && (
                            <div className="text-sm text-gray-600">{shop.city}</div>
                          )}
                          <div className="text-sm text-gray-500">{address}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{pincode}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <span>{createdDate.toLocaleDateString()}</span>
                            {editingDate === shop._id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="date"
                                  value={editDateValue}
                                  onChange={(e) => setEditDateValue(e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveCreatedDate(shop._id)}
                                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingDate(null);
                                    setEditDateValue('');
                                  }}
                                  className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  const formattedDate = createdDate.toISOString().split('T')[0];
                                  setEditDateValue(formattedDate);
                                  setEditingDate(shop._id);
                                }}
                                className="text-blue-600 hover:text-blue-700 text-xs"
                                title="Edit created date"
                              >
                                ✏️
                              </button>
                            )}
                          </div>
                          {shop.paymentExpiryDate && (
                            <p className="text-xs text-gray-500 mt-1">
                              Expires: {new Date(shop.paymentExpiryDate).toLocaleDateString()}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {isExpired ? (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              Expired {daysRemaining} days ago
                            </span>
                          ) : daysRemaining <= 30 ? (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                              {daysRemaining} days left
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              {daysRemaining} days left
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            {isPending ? (
                              <button
                                onClick={() => handleMarkPaymentDone(shop._id, shop.mobile, shop.planType, shop.planAmount, shop.district)}
                                disabled={processingPayment === shop._id}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                {processingPayment === shop._id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    💰 Pay Amount (₹{shop.planAmount || 100})
                                  </>
                                )}
                              </button>
                            ) : !hasPayment || isExpired ? (
                              <button
                                onClick={() => handleMarkPaymentDone(shop._id, shop.mobile, shop.planType, shop.planAmount, shop.district)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-green-700 transition-colors"
                              >
                                Mark Payment Done
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">Active</span>
                            )}
                            <button
                              onClick={() => handleEditShop(shop)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-blue-700 transition-colors"
                              title="Edit shop"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteShop(
                                shop._id, 
                                shop.shopName || shop.name || 'Unknown',
                                shop.paymentStatus,
                                shop.planAmount
                              )}
                              disabled={deletingShop === shop._id}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              title={shop.paymentStatus === 'PAID' ? `Delete shop (will deduct commission & revenue)` : 'Delete shop'}
                            >
                              {deletingShop === shop._id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  🗑️ Delete
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Shop Modal */}
      {editingShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Edit Shop</h2>
            <EditShopForm
              shop={editingShop}
              onClose={() => setEditingShop(null)}
              onSave={async (updatedShop) => {
                try {
                  const response = await fetch(`/api/admin/shops/${editingShop._id}`, {
                    method: 'PUT',
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedShop),
                  });

                  if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    toast.error(errorData.error || 'Failed to update shop');
                    return;
                  }

                  const data = await response.json();
                  if (data.success) {
                    toast.success('Shop updated successfully!');
                    setEditingShop(null);
                    fetchShops();
                  } else {
                    toast.error(data.error || 'Failed to update shop');
                  }
                } catch (error: any) {
                  console.error('Failed to update shop:', error);
                  toast.error(error.message || 'Failed to update shop');
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Edit Shop Form Component
function EditShopForm({ shop, onClose, onSave }: { shop: Shop; onClose: () => void; onSave: (shop: Partial<Shop>) => void }) {
  const [formData, setFormData] = useState({
    shopName: shop.shopName || shop.name || '',
    ownerName: shop.ownerName || '',
    category: shop.category || '',
    mobile: shop.mobile || '',
    area: shop.area || '',
    fullAddress: shop.fullAddress || shop.address || '',
    city: shop.city || '',
    pincode: shop.pincode || '',
    latitude: shop.latitude?.toString() || '',
    longitude: shop.longitude?.toString() || '',
    photoUrl: shop.photoUrl || shop.imageUrl || shop.iconUrl || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      latitude: formData.latitude ? Number(formData.latitude) : undefined,
      longitude: formData.longitude ? Number(formData.longitude) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name *</label>
          <input
            type="text"
            value={formData.shopName}
            onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
          <input
            type="text"
            value={formData.ownerName}
            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Category</option>
            <option value="Grocery">Grocery</option>
            <option value="Clothes">Clothes</option>
            <option value="Electronics">Electronics</option>
            <option value="Restaurant">Restaurant</option>
            <option value="Medical">Medical</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
          <input
            type="text"
            value={formData.mobile}
            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
          <input
            type="text"
            value={formData.area}
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
          <input
            type="text"
            value={formData.pincode}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
          <input
            type="url"
            value={formData.photoUrl}
            onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Address *</label>
        <textarea
          value={formData.fullAddress}
          onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          rows={2}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Latitude *</label>
          <input
            type="number"
            step="any"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Longitude *</label>
          <input
            type="number"
            step="any"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}


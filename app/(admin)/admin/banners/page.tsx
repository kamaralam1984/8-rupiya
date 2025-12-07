'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface Banner {
  _id: string;
  section: 'hero' | 'left' | 'right' | 'top' | 'bottom' | 'banner';
  imageUrl: string;
  iconUrl?: string;
  title?: string;
  cta?: string;
  ctaText?: string;
  linkUrl: string;
  alt?: string;
  advertiser?: string;
  sponsored: boolean;
  position?: number;
  area?: string;
  pincode?: number;
  locationId?: string;
  lat?: number;
  lng?: number;
  shopName?: string;
  shopId?: string;
  pageUrl?: string;
  category?: string;
  textEffect?: string;
  animation?: string;
  animationDuration?: number;
  animationDelay?: number;
  backgroundEffect?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  isActive: boolean;
  order: number;
}

export default function BannersPage() {
  const { token } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    section: 'hero' as Banner['section'],
    imageUrl: '',
    iconUrl: '',
    title: '',
    cta: '',
    ctaText: '',
    linkUrl: '#',
    alt: '',
    advertiser: '',
    sponsored: false,
    position: 0,
    area: '',
    pincode: '',
    locationId: '',
    lat: '',
    lng: '',
    shopName: '',
    shopId: '',
    pageUrl: '',
    category: '',
    textEffect: 'none',
    animation: 'none',
    animationDuration: 2,
    animationDelay: 0,
    backgroundEffect: 'none',
    overlayColor: '#000000',
    overlayOpacity: 0.3,
    isActive: true,
    order: 0,
  });
  const [availablePages, setAvailablePages] = useState<{_id: string; title: string; slug: string}[]>([]);
  const [shops, setShops] = useState<{_id: string; shopName: string; name?: string}[]>([]);
  const [shopSearchQuery, setShopSearchQuery] = useState('');
  const [categories, setCategories] = useState<{_id: string; name: string; slug: string; iconUrl?: string}[]>([]);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    fetchPages();
    fetchShops();
    fetchCategories();
  }, [token]);

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/admin/pages', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setAvailablePages(data.pages || []);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    }
  };

  const fetchShops = async () => {
    try {
      const res = await fetch('/api/admin/shops?limit=1000', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.shops) {
        // Combine AdminShop and AgentShop data
        const allShops = data.shops.map((shop: any) => ({
          _id: shop._id,
          shopName: shop.shopName || shop.name || 'Unknown Shop',
        }));
        setShops(allShops);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success && data.categories) {
        const categoriesList = data.categories.map((cat: any) => ({
          _id: cat.id || cat._id,
          name: cat.displayName || cat.name,
          slug: cat.slug,
          iconUrl: cat.iconUrl || cat.imageUrl,
        }));
        setCategories(categoriesList);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Current location se lat/lng set karna
  const handleGetCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setFormData({
          ...formData,
          lat: lat.toString(),
          lng: lng.toString(),
        });
        toast.success('Location set successfully!');
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Failed to get location';
        if (error.code === 1) {
          errorMessage = 'Location permission denied';
        } else if (error.code === 2) {
          errorMessage = 'Location unavailable';
        } else if (error.code === 3) {
          errorMessage = 'Location request timeout';
        }
        toast.error(errorMessage);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    fetchBanners();
  }, [token]);

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/admin/banners', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setBanners(data.banners || []);
      }
    } catch (error) {
      toast.error('Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'icon' = 'image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'image') {
      setUploading(true);
    } else {
      setUploadingIcon(true);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('section', 'general');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        if (type === 'image') {
          setFormData((prev) => ({ ...prev, imageUrl: data.url }));
          toast.success('Image uploaded successfully');
        } else {
          setFormData((prev) => ({ ...prev, iconUrl: data.url }));
          toast.success('Icon uploaded successfully');
        }
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (error) {
      toast.error(`Failed to upload ${type}`);
    } finally {
      if (type === 'image') {
        setUploading(false);
      } else {
        setUploadingIcon(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingBanner
        ? `/api/admin/banners/${editingBanner._id}`
        : '/api/admin/banners';
      const method = editingBanner ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        pincode: formData.pincode ? parseInt(formData.pincode) : undefined,
        lat: formData.lat ? parseFloat(formData.lat) : undefined,
        lng: formData.lng ? parseFloat(formData.lng) : undefined,
        shopName: formData.shopName || undefined,
        shopId: formData.shopId || undefined,
        overlayOpacity: parseFloat(formData.overlayOpacity.toString()),
        animationDuration: parseFloat(formData.animationDuration.toString()),
        animationDelay: parseFloat(formData.animationDelay.toString()),
        pageUrl: formData.pageUrl || undefined,
        category: formData.category || undefined,
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingBanner ? 'Banner updated' : 'Banner created');
        setShowForm(false);
        setEditingBanner(null);
        resetForm();
        fetchBanners();
      } else {
        toast.error(data.error || 'Operation failed');
      }
    } catch (error) {
      toast.error('Failed to save banner');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Banner deleted');
        fetchBanners();
      } else {
        toast.error(data.error || 'Delete failed');
      }
    } catch (error) {
      toast.error('Failed to delete banner');
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      section: banner.section,
      imageUrl: banner.imageUrl,
      iconUrl: banner.iconUrl || '',
      title: banner.title || '',
      cta: banner.cta || '',
      ctaText: banner.ctaText || '',
      linkUrl: banner.linkUrl,
      alt: banner.alt || '',
      advertiser: banner.advertiser || '',
      sponsored: banner.sponsored,
      position: banner.position || 0,
      area: banner.area || '',
      pincode: banner.pincode?.toString() || '',
      locationId: banner.locationId || '',
      lat: banner.lat?.toString() || '',
      lng: banner.lng?.toString() || '',
      shopName: banner.shopName || '',
      shopId: banner.shopId || '',
      pageUrl: (banner as any).pageUrl || '',
      category: (banner as any).category || '',
      textEffect: (banner as any).textEffect || 'none',
      animation: (banner as any).animation || 'none',
      animationDuration: (banner as any).animationDuration || 2,
      animationDelay: (banner as any).animationDelay || 0,
      backgroundEffect: (banner as any).backgroundEffect || 'none',
      overlayColor: (banner as any).overlayColor || '#000000',
      overlayOpacity: (banner as any).overlayOpacity || 0.3,
      isActive: banner.isActive,
      order: banner.order,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      section: 'hero',
      imageUrl: '',
      iconUrl: '',
      title: '',
      cta: '',
      ctaText: '',
      linkUrl: '#',
      alt: '',
      advertiser: '',
      sponsored: false,
      position: 0,
      area: '',
      pincode: '',
      locationId: '',
      lat: '',
      lng: '',
      shopName: '',
      shopId: '',
      pageUrl: '',
      category: '',
      textEffect: 'none',
      animation: 'none',
      animationDuration: 2,
      animationDelay: 0,
      backgroundEffect: 'none',
      overlayColor: '#000000',
      overlayOpacity: 0.3,
      isActive: true,
      order: 0,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banner Management</h1>
          <p className="text-gray-600 mt-1">Manage all banners displayed on your website</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingBanner(null);
            setShowForm(true);
          }}
          className="px-6 py-3 bg-custom-gradient text-gray-900 font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Banner
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingBanner ? 'Edit Banner' : 'Create New Banner'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingBanner(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section *
                    </label>
                    <select
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value as Banner['section'] })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white"
                      required
                    >
                      <option value="hero">Hero Banner (Center)</option>
                      <option value="left">Left Rail</option>
                      <option value="right">Right Rail</option>
                      <option value="top">Top Strip</option>
                      <option value="bottom">Bottom Section</option>
                      <option value="banner">Banner (General)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                  </div>
                </div>

                {/* Banner Image Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Image * (बैनर इमेज)
                  </label>
                  
                  {/* Image Preview */}
                  {formData.imageUrl ? (
                    <div className="mb-4">
                      <div className="relative w-full h-48 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                        <Image
                          src={formData.imageUrl}
                          alt="Banner Preview"
                          fill
                          className="object-contain p-2"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: '' })}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          title="Remove image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <label className="absolute bottom-2 right-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                          {uploading ? 'Uploading...' : 'Change Image'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'image')}
                            className="hidden"
                            disabled={uploading}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Image URL: {formData.imageUrl}</p>
                    </div>
                  ) : (
                    <div className="mb-4 border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 hover:border-amber-400 transition-colors">
                      <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="mt-4">
                          <label className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Choose image from your computer
                            </span>
                            <span className="mt-1 block text-xs text-gray-500">
                              PNG, JPG, GIF, WebP up to 5MB
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'image')}
                              className="hidden"
                              disabled={uploading}
                            />
                            <span className="mt-3 inline-block px-4 py-2 bg-custom-gradient text-gray-900 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
                              {uploading ? (
                                <span className="flex items-center gap-2">
                                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Uploading...
                                </span>
                              ) : (
                                'Select Image'
                              )}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manual URL Input */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Or enter image URL manually
                    </label>
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-gray-900"
                      placeholder="/Assets/image.jpg or /uploads/image.jpg"
                      required
                    />
                  </div>
                </div>

                {/* Icon Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Icon (बैनर आइकन) <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  
                  {/* Icon Preview */}
                  {formData.iconUrl ? (
                    <div className="mb-4">
                      <div className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                        <Image
                          src={formData.iconUrl}
                          alt="Icon Preview"
                          fill
                          className="object-contain p-2"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, iconUrl: '' })}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          title="Remove icon"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <label className="absolute bottom-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors cursor-pointer">
                          {uploadingIcon ? '...' : 'Change'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'icon')}
                            className="hidden"
                            disabled={uploadingIcon}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Icon URL: {formData.iconUrl}</p>
                    </div>
                  ) : (
                    <div className="mb-4 border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:border-blue-400 transition-colors">
                      <div className="text-center">
                        <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div className="mt-3">
                          <label className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Upload Icon Image
                            </span>
                            <span className="mt-1 block text-xs text-gray-500">
                              PNG, SVG, ICO up to 2MB (Recommended: 64x64 or 128x128)
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'icon')}
                              className="hidden"
                              disabled={uploadingIcon}
                            />
                            <span className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                              {uploadingIcon ? (
                                <span className="flex items-center gap-2">
                                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Uploading...
                                </span>
                              ) : (
                                'Select Icon'
                              )}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manual Icon URL Input */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Or enter icon URL manually
                    </label>
                    <input
                      type="text"
                      value={formData.iconUrl}
                      onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
                      placeholder="/Assets/icon.png or /uploads/icon.svg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      placeholder="Banner title (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Advertiser Name
                    </label>
                    <input
                      type="text"
                      value={formData.advertiser}
                      onChange={(e) => setFormData({ ...formData, advertiser: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      placeholder="Company/brand name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link URL *
                  </label>
                  <input
                    type="text"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                    placeholder="/category/restaurants or https://example.com"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Where users will be redirected when clicking the banner</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area
                    </label>
                    <input
                      type="text"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., A.H. Guard"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode
                    </label>
                    <input
                      type="number"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Location Coordinates (स्थान निर्देशांक)
                    </label>
                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      disabled={gettingLocation}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {gettingLocation ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Getting Location...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Use Current Location
                        </>
                      )}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.lat}
                        onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="25.5941"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.lng}
                        onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="85.1376"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Click "Use Current Location" button to automatically fill latitude and longitude from your device GPS
                  </p>
                </div>

                {/* Shop Information Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🏪 Shop Information (दुकान की जानकारी)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shop Name (दुकान का नाम)
                      </label>
                      <input
                        type="text"
                        value={formData.shopName}
                        onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                        placeholder="Enter shop name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shop ID (दुकान ID) - Select from list
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={shopSearchQuery}
                          onChange={(e) => {
                            setShopSearchQuery(e.target.value);
                            if (e.target.value === '') {
                              setFormData({ ...formData, shopId: '' });
                            }
                          }}
                          onFocus={() => setShopSearchQuery('')}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                          placeholder="Search shop by name..."
                        />
                        {shopSearchQuery && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {shops
                              .filter(shop => 
                                shop.shopName.toLowerCase().includes(shopSearchQuery.toLowerCase())
                              )
                              .slice(0, 10)
                              .map(shop => (
                                <button
                                  key={shop._id}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ 
                                      ...formData, 
                                      shopId: shop._id,
                                      shopName: shop.shopName 
                                    });
                                    setShopSearchQuery(shop.shopName);
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                                >
                                  <div className="font-medium">{shop.shopName}</div>
                                  <div className="text-xs text-gray-500">ID: {shop._id}</div>
                                </button>
                              ))}
                            {shops.filter(shop => 
                              shop.shopName.toLowerCase().includes(shopSearchQuery.toLowerCase())
                            ).length === 0 && (
                              <div className="px-4 py-2 text-sm text-gray-500">No shops found</div>
                            )}
                          </div>
                        )}
                      </div>
                      {formData.shopId && (
                        <p className="text-xs text-gray-500 mt-1">Selected Shop ID: {formData.shopId}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Or manually enter Shop ID below</p>
                      <input
                        type="text"
                        value={formData.shopId}
                        onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all mt-2"
                        placeholder="Or enter Shop ID manually"
                      />
                    </div>
                  </div>
                </div>

                {/* Page Targeting Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Targeting (कौन से पेज पर दिखाना है)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Page URL (e.g., /, /category/restaurants)
                      </label>
                      <input
                        type="text"
                        value={formData.pageUrl}
                        onChange={(e) => setFormData({ ...formData, pageUrl: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                        placeholder="/ (all pages) or specific page URL"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty for all pages</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Or Select from Pages
                      </label>
                      <select
                        value={formData.pageUrl}
                        onChange={(e) => setFormData({ ...formData, pageUrl: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white"
                      >
                        <option value="">All Pages (सभी पेज)</option>
                        {availablePages.map((page) => (
                          <option key={page._id} value={`/${page.slug}`}>
                            {page.title} ({page.slug})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Category Selection from Database */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category (श्रेणी) - Select from Database
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <select
                          value={formData.category}
                          onChange={(e) => {
                            const selectedCategory = categories.find(cat => cat.slug === e.target.value);
                            setFormData({ 
                              ...formData, 
                              category: e.target.value,
                              // Auto-fill icon if category has icon
                              iconUrl: selectedCategory?.iconUrl && !formData.iconUrl ? selectedCategory.iconUrl : formData.iconUrl
                            });
                          }}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white"
                        >
                          <option value="">No Category (कोई श्रेणी नहीं)</option>
                          {categories.map((category) => (
                            <option key={category._id} value={category.slug}>
                              {category.name} ({category.slug})
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.category 
                            ? `Selected: ${categories.find(c => c.slug === formData.category)?.name || formData.category}`
                            : 'Select a category from database'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Or Enter Category Slug Manually
                        </label>
                        <input
                          type="text"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                          placeholder="restaurants, hotels, etc."
                        />
                      </div>
                    </div>
                    {formData.category && categories.find(c => c.slug === formData.category) && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          {categories.find(c => c.slug === formData.category)?.iconUrl && (
                            <Image
                              src={categories.find(c => c.slug === formData.category)!.iconUrl!}
                              alt={formData.category}
                              width={32}
                              height={32}
                              className="rounded"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-blue-900">
                              {categories.find(c => c.slug === formData.category)?.name}
                            </p>
                            <p className="text-xs text-blue-700">
                              Slug: {formData.category}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Effects and Animations Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Effects & Animations (एनिमेशन और इफेक्ट्स)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text Effect (टेक्स्ट इफेक्ट)
                      </label>
                      <select
                        value={formData.textEffect}
                        onChange={(e) => setFormData({ ...formData, textEffect: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white"
                      >
                        <option value="none">None</option>
                        <option value="glow">Glow</option>
                        <option value="gradient">Gradient</option>
                        <option value="shadow">Shadow</option>
                        <option value="outline">Outline</option>
                        <option value="3d">3D</option>
                        <option value="neon">Neon</option>
                        <option value="rainbow">Rainbow</option>
                        <option value="metallic">Metallic</option>
                        <option value="glass">Glass</option>
                        <option value="emboss">Emboss</option>
                        <option value="anaglyph">Anaglyph</option>
                        <option value="retro">Retro</option>
                        <option value="holographic">Holographic</option>
                        <option value="fire">Fire</option>
                        <option value="ice">Ice</option>
                        <option value="electric">Electric</option>
                        <option value="gold">Gold</option>
                        <option value="silver">Silver</option>
                        <option value="chrome">Chrome</option>
                        <option value="diamond">Diamond</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Animation (एनिमेशन)
                      </label>
                      <select
                        value={formData.animation}
                        onChange={(e) => setFormData({ ...formData, animation: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white"
                      >
                        <option value="none">None</option>
                        <option value="fade">Fade</option>
                        <option value="slide">Slide</option>
                        <option value="bounce">Bounce</option>
                        <option value="pulse">Pulse</option>
                        <option value="shake">Shake</option>
                        <option value="rotate">Rotate</option>
                        <option value="scale">Scale</option>
                        <option value="wobble">Wobble</option>
                        <option value="flip">Flip</option>
                        <option value="zoom">Zoom</option>
                        <option value="glow-pulse">Glow Pulse</option>
                        <option value="wave">Wave</option>
                        <option value="float">Float</option>
                        <option value="spin">Spin</option>
                        <option value="shimmer">Shimmer</option>
                        <option value="gradient-shift">Gradient Shift</option>
                        <option value="typewriter">Typewriter</option>
                        <option value="glitch">Glitch</option>
                        <option value="morph">Morph</option>
                        <option value="elastic">Elastic</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Background Effect
                      </label>
                      <select
                        value={formData.backgroundEffect}
                        onChange={(e) => setFormData({ ...formData, backgroundEffect: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white"
                      >
                        <option value="none">None</option>
                        <option value="gradient">Gradient</option>
                        <option value="blur">Blur</option>
                        <option value="overlay">Overlay</option>
                        <option value="particles">Particles</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Animation Duration (seconds)
                      </label>
                      <input
                        type="number"
                        value={formData.animationDuration}
                        onChange={(e) => setFormData({ ...formData, animationDuration: parseFloat(e.target.value) || 2 })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                        min="0.5"
                        max="10"
                        step="0.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Animation Delay (seconds)
                      </label>
                      <input
                        type="number"
                        value={formData.animationDelay}
                        onChange={(e) => setFormData({ ...formData, animationDelay: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                        min="0"
                        max="5"
                        step="0.1"
                      />
                    </div>
                  </div>
                  {formData.backgroundEffect === 'overlay' && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Overlay Color
                        </label>
                        <input
                          type="color"
                          value={formData.overlayColor}
                          onChange={(e) => setFormData({ ...formData, overlayColor: e.target.value })}
                          className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Overlay Opacity (0-1)
                        </label>
                        <input
                          type="number"
                          value={formData.overlayOpacity}
                          onChange={(e) => setFormData({ ...formData, overlayOpacity: parseFloat(e.target.value) || 0.3 })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                          min="0"
                          max="1"
                          step="0.1"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.sponsored}
                      onChange={(e) => setFormData({ ...formData, sponsored: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Sponsored</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-custom-gradient text-gray-900 font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg"
                  >
                    {editingBanner ? 'Update Banner' : 'Create Banner'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingBanner(null);
                      resetForm();
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Banners Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image/Icon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Section
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title/Advertiser
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shop Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page/Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Effects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {banners.map((banner) => (
                <tr key={banner._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-16 relative">
                        <Image
                          src={banner.imageUrl}
                          alt={banner.alt || 'Banner'}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                      {banner.iconUrl && (
                        <div className="w-12 h-12 relative">
                          <Image
                            src={banner.iconUrl}
                            alt="Icon"
                            fill
                            className="object-contain rounded"
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {banner.section}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{banner.title || banner.advertiser || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{banner.linkUrl}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {banner.shopName && (
                      <div className="font-medium text-blue-600">{banner.shopName}</div>
                    )}
                    {banner.shopId && (
                      <div className="text-xs text-gray-400">ID: {banner.shopId.substring(0, 8)}...</div>
                    )}
                    {!banner.shopName && !banner.shopId && (
                      <span className="text-gray-400">No shop linked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {banner.pageUrl && <div className="text-blue-600 font-medium">Page: {banner.pageUrl}</div>}
                    {banner.category && <div className="text-purple-600">Category: {banner.category}</div>}
                    {!banner.pageUrl && !banner.category && <span className="text-gray-400">All Pages</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {banner.textEffect && banner.textEffect !== 'none' && (
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">{banner.textEffect}</span>
                      )}
                      {banner.animation && banner.animation !== 'none' && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">{banner.animation}</span>
                      )}
                      {(!banner.textEffect || banner.textEffect === 'none') && (!banner.animation || banner.animation === 'none') && (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        banner.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(banner)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(banner._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {banners.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No banners found. Create your first banner!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface HeroBannerImage {
  _id: string;
  imageUrl: string;
  alt: string;
  title?: string;
  linkUrl?: string;
  pageUrl?: string;
  pageId?: string;
  category?: string;
  locationId?: string;
  area?: string;
  pincode?: number;
  order: number;
  isActive: boolean;
  textEffect?: string;
  animation?: string;
  animationDuration?: number;
  animationDelay?: number;
  showTitle?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  titleColor?: string;
  subtitleColor?: string;
  backgroundEffect?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  startDate?: string;
  endDate?: string;
}

const TEXT_EFFECTS = ['none', 'glow', 'gradient', 'shadow', 'outline', '3d', 'neon', 'rainbow', 'metallic', 'glass', 'emboss', 'anaglyph', 'retro', 'holographic', 'fire', 'ice', 'electric', 'gold', 'silver', 'chrome', 'diamond'];
const ANIMATIONS = ['none', 'fade', 'slide', 'bounce', 'pulse', 'shake', 'rotate', 'scale', 'wobble', 'flip', 'zoom', 'glow-pulse', 'wave', 'float', 'spin', 'shimmer', 'gradient-shift', 'typewriter', 'glitch', 'morph', 'elastic'];
const BACKGROUND_EFFECTS = ['none', 'gradient', 'blur', 'overlay', 'particles'];

export default function HeroBannersPage() {
  const { token } = useAuth();
  const [heroBanners, setHeroBanners] = useState<HeroBannerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBannerImage | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    imageUrl: '',
    alt: '',
    title: '',
    linkUrl: '#',
    pageUrl: '',
    category: '',
    locationId: '',
    area: '',
    pincode: '',
    order: 0,
    isActive: true,
    textEffect: 'none',
    animation: 'none',
    animationDuration: 2,
    animationDelay: 0,
    showTitle: false,
    showSubtitle: false,
    subtitle: '',
    titleColor: '#ffffff',
    subtitleColor: '#ffffff',
    backgroundEffect: 'none',
    overlayColor: '#000000',
    overlayOpacity: 0.3,
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchHeroBanners();
  }, [token]);

  const fetchHeroBanners = async () => {
    try {
      const res = await fetch('/api/admin/hero-banners', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setHeroBanners(data.heroBanners || []);
      }
    } catch (error) {
      toast.error('Failed to fetch hero banners');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('section', 'hero-banner');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataUpload,
      });

      const data = await res.json();
      if (data.success) {
        setFormData((prev) => ({ ...prev, imageUrl: data.url }));
        toast.success('Image uploaded successfully');
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingBanner
        ? `/api/admin/hero-banners/${editingBanner._id}`
        : '/api/admin/hero-banners';
      const method = editingBanner ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        pincode: formData.pincode ? parseInt(formData.pincode) : undefined,
        overlayOpacity: parseFloat(formData.overlayOpacity.toString()),
        animationDuration: parseFloat(formData.animationDuration.toString()),
        animationDelay: parseFloat(formData.animationDelay.toString()),
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
        toast.success(editingBanner ? 'Hero banner updated' : 'Hero banner created');
        setShowForm(false);
        setEditingBanner(null);
        resetForm();
        fetchHeroBanners();
      } else {
        toast.error(data.error || 'Operation failed');
      }
    } catch (error) {
      toast.error('Failed to save hero banner');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hero banner?')) return;

    try {
      const res = await fetch(`/api/admin/hero-banners/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Hero banner deleted');
        fetchHeroBanners();
      } else {
        toast.error(data.error || 'Delete failed');
      }
    } catch (error) {
      toast.error('Failed to delete hero banner');
    }
  };

  const handleEdit = (banner: HeroBannerImage) => {
    setEditingBanner(banner);
    setFormData({
      imageUrl: banner.imageUrl,
      alt: banner.alt,
      title: banner.title || '',
      linkUrl: banner.linkUrl || '#',
      pageUrl: banner.pageUrl || '',
      category: banner.category || '',
      locationId: banner.locationId || '',
      area: banner.area || '',
      pincode: banner.pincode?.toString() || '',
      order: banner.order,
      isActive: banner.isActive,
      textEffect: banner.textEffect || 'none',
      animation: banner.animation || 'none',
      animationDuration: banner.animationDuration || 2,
      animationDelay: banner.animationDelay || 0,
      showTitle: banner.showTitle || false,
      showSubtitle: banner.showSubtitle || false,
      subtitle: banner.subtitle || '',
      titleColor: banner.titleColor || '#ffffff',
      subtitleColor: banner.subtitleColor || '#ffffff',
      backgroundEffect: banner.backgroundEffect || 'none',
      overlayColor: banner.overlayColor || '#000000',
      overlayOpacity: banner.overlayOpacity || 0.3,
      startDate: banner.startDate ? new Date(banner.startDate).toISOString().split('T')[0] : '',
      endDate: banner.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      imageUrl: '',
      alt: '',
      title: '',
      linkUrl: '#',
      pageUrl: '',
      category: '',
      locationId: '',
      area: '',
      pincode: '',
      order: 0,
      isActive: true,
      textEffect: 'none',
      animation: 'none',
      animationDuration: 2,
      animationDelay: 0,
      showTitle: false,
      showSubtitle: false,
      subtitle: '',
      titleColor: '#ffffff',
      subtitleColor: '#ffffff',
      backgroundEffect: 'none',
      overlayColor: '#000000',
      overlayOpacity: 0.3,
      startDate: '',
      endDate: '',
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
          <h1 className="text-3xl font-bold text-gray-900">Hero Banner Management</h1>
          <p className="text-gray-600 mt-1">Manage hero banners with effects and animations for specific pages</p>
          <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-1">📖 Quick Guide:</p>
            <p className="text-xs text-blue-700">
              <strong>Step 1:</strong> "Add Hero Banner" button par click karein → 
              <strong>Step 2:</strong> Image upload/URL add karein → 
              <strong>Step 3:</strong> Page select karein (kaun se page par dikhna hai) → 
              <strong>Step 4:</strong> Effects & Animations choose karein → 
              <strong>Step 5:</strong> Save karein
            </p>
          </div>
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
          Add Hero Banner
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto my-4">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingBanner ? 'Edit Hero Banner' : 'Create New Hero Banner'}
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
              {/* Step Indicator */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2">📋 Step-by-Step Guide:</p>
                <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Image upload karein ya URL add karein (Required)</li>
                  <li>Alt text add karein (Required)</li>
                  <li>Page select karein - kaun se page par dikhna hai</li>
                  <li>Effects & Animations choose karein</li>
                  <li>Save button par click karein</li>
                </ol>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Image * <span className="text-red-500">(Zaroori)</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Computer se image upload karein ya image URL manually enter karein</p>
                  
                  {formData.imageUrl ? (
                    <div className="mb-4">
                      <div className="relative w-full h-64 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
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
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 hover:border-amber-400 transition-colors">
                      <div className="text-center">
                        <label className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Choose image from your computer
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={uploading}
                          />
                          <span className="mt-3 inline-block px-4 py-2 bg-custom-gradient text-gray-900 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
                            {uploading ? 'Uploading...' : 'Select Image'}
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-gray-900"
                    placeholder="/Assets/image.jpg or /uploads/image.jpg"
                    required
                  />
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alt Text *
                    </label>
                    <input
                      type="text"
                      value={formData.alt}
                      onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link URL
                  </label>
                  <input
                    type="text"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  />
                </div>

                {/* Page Targeting */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">📍 Page Selection (कौन से पेज पर दिखाना है)</h3>
                  <p className="text-sm text-gray-600 mb-4">Banner ko specific page par dikhane ke liye page URL ya category select karein. Agar kuch nahi select karein to sabhi pages par dikhega.</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Page URL <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.pageUrl}
                        onChange={(e) => setFormData({ ...formData, pageUrl: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                        placeholder="/ (homepage) ya /category/restaurants"
                      />
                      <p className="text-xs text-gray-500 mt-1">Examples: <code className="bg-gray-100 px-1 rounded">/</code>, <code className="bg-gray-100 px-1 rounded">/about</code>, <code className="bg-gray-100 px-1 rounded">/category/restaurants</code></p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                        placeholder="restaurants, hotels, shopping"
                      />
                      <p className="text-xs text-gray-500 mt-1">Category slug enter karein (e.g., restaurants, hotels)</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      <strong>💡 Tip:</strong> Agar Page URL aur Category dono empty rakhenge to banner <strong>sabhi pages</strong> par dikhega. Specific page ke liye Page URL fill karein.
                    </p>
                  </div>
                </div>

                {/* Effects and Animations */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">✨ Effects & Animations (इफेक्ट्स और एनिमेशन)</h3>
                  <p className="text-sm text-gray-600 mb-4">Banner par lagane ke liye text effects aur animations select karein. 20+ options available hain!</p>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text Effect
                      </label>
                      <select
                        value={formData.textEffect}
                        onChange={(e) => setFormData({ ...formData, textEffect: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white"
                      >
                        {TEXT_EFFECTS.map(effect => (
                          <option key={effect} value={effect}>{effect.charAt(0).toUpperCase() + effect.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Animation
                      </label>
                      <select
                        value={formData.animation}
                        onChange={(e) => setFormData({ ...formData, animation: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white"
                      >
                        {ANIMATIONS.map(anim => (
                          <option key={anim} value={anim}>{anim.charAt(0).toUpperCase() + anim.slice(1).replace('-', ' ')}</option>
                        ))}
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
                        {BACKGROUND_EFFECTS.map(effect => (
                          <option key={effect} value={effect}>{effect.charAt(0).toUpperCase() + effect.slice(1)}</option>
                        ))}
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
                </div>

                {/* Text Overlay */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Text Overlay</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.showTitle}
                        onChange={(e) => setFormData({ ...formData, showTitle: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label className="text-sm text-gray-700">Show Title</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.showSubtitle}
                        onChange={(e) => setFormData({ ...formData, showSubtitle: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label className="text-sm text-gray-700">Show Subtitle</label>
                    </div>
                  </div>

                  {formData.showSubtitle && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subtitle
                      </label>
                      <input
                        type="text"
                        value={formData.subtitle}
                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title Color
                      </label>
                      <input
                        type="color"
                        value={formData.titleColor}
                        onChange={(e) => setFormData({ ...formData, titleColor: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subtitle Color
                      </label>
                      <input
                        type="color"
                        value={formData.subtitleColor}
                        onChange={(e) => setFormData({ ...formData, subtitleColor: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Overlay Settings */}
                {formData.backgroundEffect === 'overlay' && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Overlay Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
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
                  </div>
                )}

                {/* Display Settings */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Display Settings</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
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
                </div>

                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-custom-gradient text-gray-900 font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg"
                  >
                    {editingBanner ? 'Update Hero Banner' : 'Create Hero Banner'}
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

      {/* Hero Banners Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page/Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effects</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {heroBanners.map((banner) => (
                <tr key={banner._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-24 h-16 relative">
                      <Image
                        src={banner.imageUrl}
                        alt={banner.alt}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{banner.alt}</div>
                    {banner.title && <div className="text-sm text-gray-500">{banner.title}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {banner.pageUrl && <div>Page: {banner.pageUrl}</div>}
                    {banner.category && <div>Category: {banner.category}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs">
                      {banner.textEffect && banner.textEffect !== 'none' && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded mr-1">{banner.textEffect}</span>
                      )}
                      {banner.animation && banner.animation !== 'none' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{banner.animation}</span>
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
          {heroBanners.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No hero banners found. Create your first hero banner!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


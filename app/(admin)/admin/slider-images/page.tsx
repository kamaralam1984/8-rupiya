'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface SliderImage {
  _id: string;
  imageUrl: string;
  alt: string;
  title?: string;
  linkUrl?: string;
  pageUrl?: string;
  category?: string;
  order: number;
  isActive: boolean;
  transitionEffect?: 'fade' | 'slide' | 'zoom' | 'flip' | 'cube' | 'coverflow' | 'cards' | 'creative' | 'shuffle';
  duration?: number;
}

export default function SliderImagesPage() {
  const { token } = useAuth();
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingImage, setEditingImage] = useState<SliderImage | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    imageUrl: '',
    alt: '',
    title: '',
    linkUrl: '#',
    pageUrl: '',
    category: '',
    order: 0,
    isActive: true,
    transitionEffect: 'fade' as SliderImage['transitionEffect'],
    duration: 5000,
  });
  const [availablePages, setAvailablePages] = useState<{_id: string; title: string; slug: string}[]>([]);

  useEffect(() => {
    fetchSliderImages();
    fetchPages();
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

  const fetchSliderImages = async () => {
    try {
      const res = await fetch('/api/admin/slider-images', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setSliderImages(data.sliderImages || []);
      }
    } catch (error) {
      toast.error('Failed to fetch slider images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('section', 'slider');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
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
      const url = editingImage
        ? `/api/admin/slider-images/${editingImage._id}`
        : '/api/admin/slider-images';
      const method = editingImage ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
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
        toast.success(editingImage ? 'Slider image updated' : 'Slider image created');
        setShowForm(false);
        setEditingImage(null);
        resetForm();
        fetchSliderImages();
      } else {
        toast.error(data.error || 'Operation failed');
      }
    } catch (error) {
      toast.error('Failed to save slider image');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slider image?')) return;

    try {
      const res = await fetch(`/api/admin/slider-images/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Slider image deleted');
        fetchSliderImages();
      } else {
        toast.error(data.error || 'Delete failed');
      }
    } catch (error) {
      toast.error('Failed to delete slider image');
    }
  };

  const handleEdit = (image: SliderImage) => {
    setEditingImage(image);
    setFormData({
      imageUrl: image.imageUrl,
      alt: image.alt,
      title: image.title || '',
      linkUrl: image.linkUrl || '#',
      pageUrl: image.pageUrl || '',
      category: image.category || '',
      order: image.order,
      isActive: image.isActive,
      transitionEffect: image.transitionEffect || 'fade',
      duration: image.duration || 5000,
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
      order: 0,
      isActive: true,
      transitionEffect: 'fade',
      duration: 5000,
    });
  };

  const handleReorder = async (id: string, newOrder: number) => {
    try {
      const res = await fetch(`/api/admin/slider-images/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order: newOrder }),
      });

      const data = await res.json();
      if (data.success) {
        fetchSliderImages();
      }
    } catch (error) {
      toast.error('Failed to reorder');
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Slider Images Management</h1>
          <p className="text-gray-600 mt-1">Manage slider images displayed on the homepage</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingImage(null);
            setShowForm(true);
          }}
          className="px-6 py-3 bg-custom-gradient text-gray-900 font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Slider Image
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingImage ? 'Edit Slider Image' : 'Create New Slider Image'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingImage(null);
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slider Image *
                  </label>
                  
                  {formData.imageUrl ? (
                    <div className="mb-4">
                      <div className="relative w-full h-48 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                        <Image
                          src={formData.imageUrl}
                          alt="Slider Preview"
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
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 hover:border-amber-400 transition-colors">
                      <div className="text-center">
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
                      placeholder="Image description"
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
                      placeholder="Optional title"
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
                    placeholder="/category/restaurants or https://example.com"
                  />
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
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category (optional)
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
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transition Effect
                    </label>
                    <select
                      value={formData.transitionEffect}
                      onChange={(e) => setFormData({ ...formData, transitionEffect: e.target.value as SliderImage['transitionEffect'] })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white"
                    >
                      <option value="fade">Fade</option>
                      <option value="slide">Slide</option>
                      <option value="zoom">Zoom</option>
                      <option value="flip">Flip</option>
                      <option value="cube">Cube</option>
                      <option value="coverflow">Coverflow</option>
                      <option value="cards">Cards</option>
                      <option value="creative">Creative</option>
                      <option value="shuffle">Shuffle</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (ms)
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 5000 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      min="1000"
                      max="30000"
                      step="1000"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
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
                    {editingImage ? 'Update Slider Image' : 'Create Slider Image'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingImage(null);
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

      {/* Slider Images Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page/Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Effect
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
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
              {sliderImages.map((image) => (
                <tr key={image._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-24 h-16 relative">
                      <Image
                        src={image.imageUrl}
                        alt={image.alt}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{image.alt}</div>
                    {image.title && <div className="text-sm text-gray-500">{image.title}</div>}
                    <div className="text-xs text-gray-400">{image.linkUrl}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {image.pageUrl && <div className="text-blue-600 font-medium">Page: {image.pageUrl}</div>}
                    {image.category && <div className="text-purple-600">Category: {image.category}</div>}
                    {!image.pageUrl && !image.category && <span className="text-gray-400">All Pages</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                      {image.transitionEffect || 'fade'}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">{image.duration}ms</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReorder(image._id, image.order - 1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <span className="text-sm font-medium">{image.order}</span>
                      <button
                        onClick={() => handleReorder(image._id, image.order + 1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        image.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {image.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(image)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(image._id)}
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
          {sliderImages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No slider images found. Create your first slider image!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


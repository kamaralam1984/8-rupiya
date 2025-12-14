'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface Location {
  _id: string;
  id: string;
  displayName: string;
  area?: string;
  pincode?: number;
}

interface LocationImage {
  _id?: string;
  imageUrl: string;
  lat?: number;
  lng?: number;
  order?: number;
}

export default function LocationImagesPage() {
  const { token } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [pincodes, setPincodes] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchType, setSearchType] = useState<'area' | 'pincode'>('area');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPincode, setSelectedPincode] = useState<number | ''>('');

  // Image states for each section
  const [heroImage, setHeroImage] = useState<LocationImage>({ imageUrl: '', lat: undefined, lng: undefined });
  const [leftImages, setLeftImages] = useState<LocationImage[]>([
    { imageUrl: '', lat: undefined, lng: undefined, order: 0 },
    { imageUrl: '', lat: undefined, lng: undefined, order: 1 },
    { imageUrl: '', lat: undefined, lng: undefined, order: 2 },
    { imageUrl: '', lat: undefined, lng: undefined, order: 3 },
  ]);
  const [rightImages, setRightImages] = useState<LocationImage[]>([
    { imageUrl: '', lat: undefined, lng: undefined, order: 0 },
    { imageUrl: '', lat: undefined, lng: undefined, order: 1 },
    { imageUrl: '', lat: undefined, lng: undefined, order: 2 },
    { imageUrl: '', lat: undefined, lng: undefined, order: 3 },
  ]);
  const [bottomImages, setBottomImages] = useState<LocationImage[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, [token]);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/admin/locations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLocations(data.locations || []);
        // Extract unique pincodes
        const uniquePincodes = Array.from(
          new Set(data.locations?.map((loc: Location) => loc.pincode).filter(Boolean))
        ).sort((a, b) => (a as number) - (b as number)) as number[];
        setPincodes(uniquePincodes);
      }
    } catch (error) {
      toast.error('Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  const handleImportLocations = async () => {
    setImporting(true);
    try {
      const res = await fetch('/api/admin/locations/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Imported ${data.stats.imported} locations. ${data.stats.skipped} skipped.`);
        fetchLocations();
      } else {
        toast.error(data.error || 'Import failed');
      }
    } catch (error) {
      toast.error('Failed to import locations');
    } finally {
      setImporting(false);
    }
  };

  const handleLocationSelect = async (location: Location) => {
    setSelectedLocation(location);
    // Fetch existing banners for this location
    try {
      const res = await fetch(`/api/admin/banners?locationId=${location.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const banners = data.banners || [];
        
        // Separate by section
        const hero = banners.find((b: any) => b.section === 'hero');
        const left = banners.filter((b: any) => b.section === 'left').sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        const right = banners.filter((b: any) => b.section === 'right').sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        const bottom = banners.filter((b: any) => b.section === 'top' || b.section === 'bottom').sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

        if (hero) {
          setHeroImage({
            _id: hero._id,
            imageUrl: hero.imageUrl,
            lat: hero.lat,
            lng: hero.lng,
          });
        }

        // Fill left images (up to 4)
        const leftArray = [...leftImages];
        left.forEach((banner: any, index: number) => {
          if (index < 4) {
            leftArray[index] = {
              _id: banner._id,
              imageUrl: banner.imageUrl,
              lat: banner.lat,
              lng: banner.lng,
              order: index,
            };
          }
        });
        setLeftImages(leftArray);

        // Fill right images (up to 4)
        const rightArray = [...rightImages];
        right.forEach((banner: any, index: number) => {
          if (index < 4) {
            rightArray[index] = {
              _id: banner._id,
              imageUrl: banner.imageUrl,
              lat: banner.lat,
              lng: banner.lng,
              order: index,
            };
          }
        });
        setRightImages(rightArray);

        setBottomImages(bottom.map((b: any) => ({
          _id: b._id,
          imageUrl: b.imageUrl,
          lat: b.lat,
          lng: b.lng,
          order: b.order || 0,
        })));
      }
    } catch (error) {
      console.error('Error fetching location banners:', error);
    }
  };

  const handleImageUpload = async (section: 'hero' | 'left' | 'right' | 'bottom', index?: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('section', section);

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const data = await res.json();
        if (data.success) {
          toast.success('Image uploaded successfully');
          
          if (section === 'hero') {
            setHeroImage({ ...heroImage, imageUrl: data.url });
          } else if (section === 'left' && index !== undefined) {
            const updated = [...leftImages];
            updated[index] = { ...updated[index], imageUrl: data.url };
            setLeftImages(updated);
          } else if (section === 'right' && index !== undefined) {
            const updated = [...rightImages];
            updated[index] = { ...updated[index], imageUrl: data.url };
            setRightImages(updated);
          } else if (section === 'bottom') {
            if (index !== undefined) {
              const updated = [...bottomImages];
              updated[index] = { ...updated[index], imageUrl: data.url };
              setBottomImages(updated);
            } else {
              setBottomImages([...bottomImages, { imageUrl: data.url, lat: undefined, lng: undefined, order: bottomImages.length }]);
            }
          }
        } else {
          toast.error(data.error || 'Upload failed');
        }
      } catch (error) {
        toast.error('Failed to upload image');
      }
    };
    input.click();
  };

  const handleSave = async () => {
    if (!selectedLocation) {
      toast.error('Please select a location first');
      return;
    }

    setSaving(true);
    try {
      const bannersToSave: any[] = [];

      // Hero banner
      if (heroImage.imageUrl) {
        bannersToSave.push({
          section: 'hero',
          imageUrl: heroImage.imageUrl,
          linkUrl: '#',
          locationId: selectedLocation.id,
          area: selectedLocation.area || selectedLocation.displayName,
          pincode: selectedLocation.pincode,
          lat: heroImage.lat,
          lng: heroImage.lng,
          isActive: true,
          order: 0,
          _id: heroImage._id,
        });
      }

      // Left images
      leftImages.forEach((img, index) => {
        if (img.imageUrl) {
          bannersToSave.push({
            section: 'left',
            imageUrl: img.imageUrl,
            linkUrl: '#',
            locationId: selectedLocation.id,
            area: selectedLocation.area || selectedLocation.displayName,
            pincode: selectedLocation.pincode,
            lat: img.lat,
            lng: img.lng,
            isActive: true,
            order: index,
            _id: img._id,
          });
        }
      });

      // Right images
      rightImages.forEach((img, index) => {
        if (img.imageUrl) {
          bannersToSave.push({
            section: 'right',
            imageUrl: img.imageUrl,
            linkUrl: '#',
            locationId: selectedLocation.id,
            area: selectedLocation.area || selectedLocation.displayName,
            pincode: selectedLocation.pincode,
            lat: img.lat,
            lng: img.lng,
            isActive: true,
            order: index,
            _id: img._id,
          });
        }
      });

      // Bottom images
      bottomImages.forEach((img) => {
        if (img.imageUrl) {
          bannersToSave.push({
            section: 'top',
            imageUrl: img.imageUrl,
            linkUrl: '#',
            locationId: selectedLocation.id,
            area: selectedLocation.area || selectedLocation.displayName,
            pincode: selectedLocation.pincode,
            lat: img.lat,
            lng: img.lng,
            isActive: true,
            order: img.order || 0,
            _id: img._id,
          });
        }
      });

      // Save all banners
      for (const banner of bannersToSave) {
        const { _id, ...bannerData } = banner;
        const url = _id ? `/api/admin/banners/${_id}` : '/api/admin/banners';
        const method = _id ? 'PUT' : 'POST';

        await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bannerData),
        });
      }

      toast.success('Location images saved successfully');
    } catch (error) {
      toast.error('Failed to save images');
    } finally {
      setSaving(false);
    }
  };

  const filteredLocations = locations.filter((loc) => {
    if (searchType === 'area') {
      return loc.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             loc.area?.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      return loc.pincode === selectedPincode;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Location Images</h1>
          <p className="text-gray-600 mt-1">Manage images for specific locations</p>
        </div>
        <button
          onClick={handleImportLocations}
          disabled={importing}
          className="px-6 py-3 bg-blue-600 text-gray-900 font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md disabled:opacity-50"
        >
          {importing ? 'Importing...' : 'Import Locations from JSON'}
        </button>
      </div>

      {/* Location Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Location</h2>
        
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setSearchType('area')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              searchType === 'area'
                ? 'bg-amber-600 text-gray-900'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            By Area Name
          </button>
          <button
            onClick={() => setSearchType('pincode')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              searchType === 'pincode'
                ? 'bg-amber-600 text-gray-900'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            By Pincode
          </button>
        </div>

        {searchType === 'area' ? (
          <input
            type="text"
            placeholder="Search by area name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 mb-4"
          />
        ) : (
          <select
            value={selectedPincode}
            onChange={(e) => setSelectedPincode(e.target.value ? parseInt(e.target.value) : '')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 mb-4"
          >
            <option value="">Select Pincode</option>
            {pincodes.map((pincode) => (
              <option key={pincode} value={pincode}>
                {pincode}
              </option>
            ))}
          </select>
        )}

        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
          {filteredLocations.slice(0, 50).map((location) => (
            <button
              key={location._id}
              onClick={() => handleLocationSelect(location)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                selectedLocation?._id === location._id ? 'bg-amber-50 border-amber-200' : ''
              }`}
            >
              <div className="font-medium text-gray-900">{location.displayName}</div>
              {location.pincode && (
                <div className="text-sm text-gray-500">Pincode: {location.pincode}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedLocation && (
        <div className="space-y-8">
          {/* Hero Image */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Hero Image</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                {heroImage.imageUrl ? (
                  <div className="relative w-full h-48 border-2 border-gray-200 rounded-lg overflow-hidden mb-2">
                    <Image src={heroImage.imageUrl} alt="Hero" fill className="object-contain" />
                  </div>
                ) : (
                  <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-gray-500">No image</span>
                  </div>
                )}
                <button
                  onClick={() => handleImageUpload('hero')}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Upload Image
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={heroImage.lat || ''}
                    onChange={(e) => setHeroImage({ ...heroImage, lat: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="25.5941"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={heroImage.lng || ''}
                    onChange={(e) => setHeroImage({ ...heroImage, lng: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="85.1376"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Left Rail Images */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Left Rail Images (4 images)</h2>
            <div className="grid grid-cols-2 gap-6">
              {leftImages.map((img, index) => (
                <div key={index} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Image {index + 1}</label>
                  {img.imageUrl ? (
                    <div className="relative w-full h-32 border-2 border-gray-200 rounded-lg overflow-hidden mb-2">
                      <Image src={img.imageUrl} alt={`Left ${index + 1}`} fill className="object-contain" />
                    </div>
                  ) : (
                    <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-2">
                      <span className="text-gray-500 text-sm">No image</span>
                    </div>
                  )}
                  <button
                    onClick={() => handleImageUpload('left', index)}
                    className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Upload
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="any"
                      value={img.lat || ''}
                      onChange={(e) => {
                        const updated = [...leftImages];
                        updated[index] = { ...updated[index], lat: e.target.value ? parseFloat(e.target.value) : undefined };
                        setLeftImages(updated);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Lat"
                    />
                    <input
                      type="number"
                      step="any"
                      value={img.lng || ''}
                      onChange={(e) => {
                        const updated = [...leftImages];
                        updated[index] = { ...updated[index], lng: e.target.value ? parseFloat(e.target.value) : undefined };
                        setLeftImages(updated);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Lng"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Rail Images */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Right Rail Images (4 images)</h2>
            <div className="grid grid-cols-2 gap-6">
              {rightImages.map((img, index) => (
                <div key={index} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Image {index + 1}</label>
                  {img.imageUrl ? (
                    <div className="relative w-full h-32 border-2 border-gray-200 rounded-lg overflow-hidden mb-2">
                      <Image src={img.imageUrl} alt={`Right ${index + 1}`} fill className="object-contain" />
                    </div>
                  ) : (
                    <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-2">
                      <span className="text-gray-500 text-sm">No image</span>
                    </div>
                  )}
                  <button
                    onClick={() => handleImageUpload('right', index)}
                    className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Upload
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="any"
                      value={img.lat || ''}
                      onChange={(e) => {
                        const updated = [...rightImages];
                        updated[index] = { ...updated[index], lat: e.target.value ? parseFloat(e.target.value) : undefined };
                        setRightImages(updated);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Lat"
                    />
                    <input
                      type="number"
                      step="any"
                      value={img.lng || ''}
                      onChange={(e) => {
                        const updated = [...rightImages];
                        updated[index] = { ...updated[index], lng: e.target.value ? parseFloat(e.target.value) : undefined };
                        setRightImages(updated);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Lng"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Strip Images */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Bottom Strip Images</h2>
              <button
                onClick={() => setBottomImages([...bottomImages, { imageUrl: '', lat: undefined, lng: undefined, order: bottomImages.length }])}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                + Add Image
              </button>
            </div>
            {bottomImages.length === 0 ? (
              <p className="text-gray-500 text-sm">No images added. Click "+ Add Image" to add one.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {bottomImages.map((img, index) => (
                  <div key={index} className="space-y-2">
                    {img.imageUrl ? (
                      <div className="relative w-full h-24 border-2 border-gray-200 rounded-lg overflow-hidden mb-2">
                        <Image src={img.imageUrl} alt={`Bottom ${index + 1}`} fill className="object-contain" />
                      </div>
                    ) : (
                      <div className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-2">
                        <span className="text-gray-500 text-xs">No image</span>
                      </div>
                    )}
                    <button
                      onClick={() => handleImageUpload('bottom', index)}
                      className="w-full px-2 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs"
                    >
                      {img.imageUrl ? 'Change' : 'Upload'}
                    </button>
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="number"
                        step="any"
                        value={img.lat || ''}
                        onChange={(e) => {
                          const updated = [...bottomImages];
                          updated[index] = { ...updated[index], lat: e.target.value ? parseFloat(e.target.value) : undefined };
                          setBottomImages(updated);
                        }}
                        className="px-2 py-1 border border-gray-300 rounded text-xs"
                        placeholder="Lat"
                      />
                      <input
                        type="number"
                        step="any"
                        value={img.lng || ''}
                        onChange={(e) => {
                          const updated = [...bottomImages];
                          updated[index] = { ...updated[index], lng: e.target.value ? parseFloat(e.target.value) : undefined };
                          setBottomImages(updated);
                        }}
                        className="px-2 py-1 border border-gray-300 rounded text-xs"
                        placeholder="Lng"
                      />
                    </div>
                    <button
                      onClick={() => setBottomImages(bottomImages.filter((_, i) => i !== index))}
                      className="w-full px-2 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-custom-gradient text-gray-900 font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save All Images'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


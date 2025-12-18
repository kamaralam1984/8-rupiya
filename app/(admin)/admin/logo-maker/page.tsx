'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';

interface Logo {
  _id: string;
  businessName: string;
  tagline?: string;
  logoType: 'text' | 'icon' | 'combination';
  layout: 'horizontal' | 'vertical' | 'stacked';
  colors: {
    primary: string;
    secondary?: string;
    background?: string;
  };
  fonts: {
    primary: string;
    secondary?: string;
  };
  icon?: string;
  iconUrl?: string;
  imageUrl?: string;
  iconPosition: 'left' | 'right' | 'top' | 'bottom' | 'center';
  style?: string;
  textAlignment: 'left' | 'center' | 'right';
  spacing: number;
  borderRadius: number;
  borderWidth: number;
  borderColor?: string;
  shadow: boolean;
  gradient: boolean;
  gradientColors?: string[];
  logoUrl?: string;
  logoSvgUrl?: string;
  logoPdfUrl?: string;
  logoEpsUrl?: string;
  createdAt: string;
  isActive: boolean;
}

const FONT_OPTIONS = [
  'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
  'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
  'Trebuchet MS', 'Impact', 'Lucida Console', 'Tahoma', 'Roboto',
  'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Playfair Display'
];

const COLOR_PRESETS = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Blue', value: '#0066CC' },
  { name: 'Green', value: '#00AA00' },
  { name: 'Orange', value: '#FF6600' },
  { name: 'Purple', value: '#6600CC' },
  { name: 'Gold', value: '#FFD700' },
  { name: 'Navy', value: '#000080' },
  { name: 'Teal', value: '#008080' },
];

const ICON_OPTIONS = [
  'star', 'heart', 'shield', 'crown', 'fire', 'leaf', 'circle',
  'square', 'triangle', 'diamond', 'arrow', 'check', 'plus',
  'building', 'shop', 'store', 'cart', 'bag', 'star-circle'
];

const LOGO_STYLES = [
  { name: 'Modern', value: 'modern', description: 'Clean and contemporary' },
  { name: 'Classic', value: 'classic', description: 'Traditional and elegant' },
  { name: 'Minimalist', value: 'minimalist', description: 'Simple and clean' },
  { name: 'Bold', value: 'bold', description: 'Strong and impactful' },
  { name: 'Playful', value: 'playful', description: 'Fun and creative' },
  { name: 'Professional', value: 'professional', description: 'Business-focused' },
  { name: 'Vintage', value: 'vintage', description: 'Retro and nostalgic' },
  { name: 'Luxury', value: 'luxury', description: 'Premium and sophisticated' },
];

export default function LogoMakerPage() {
  const { token } = useAuth();
  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLogo, setEditingLogo] = useState<Logo | null>(null);
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  type FormData = {
    businessName: string;
    tagline: string;
    logoType: 'text' | 'icon' | 'combination';
    layout: 'horizontal' | 'vertical' | 'stacked';
    colors: {
      primary: string;
      secondary: string;
      background: string;
    };
    fonts: {
      primary: string;
      secondary: string;
    };
    icon: string;
    iconUrl: string;
    imageUrl: string;
    iconPosition: 'left' | 'right' | 'top' | 'bottom' | 'center';
    style: string;
    textAlignment: 'left' | 'center' | 'right';
    spacing: number;
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
    shadow: boolean;
    gradient: boolean;
    gradientColors: string[];
  };

  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    tagline: '',
    logoType: 'combination',
    layout: 'horizontal',
    colors: {
      primary: '#000000',
      secondary: '#0066CC',
      background: '#FFFFFF',
    },
    fonts: {
      primary: 'Arial',
      secondary: 'Arial',
    },
    icon: '',
    iconUrl: '',
    imageUrl: '',
    iconPosition: 'left',
    style: 'modern',
    textAlignment: 'center',
    spacing: 10,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: '#000000',
    shadow: false,
    gradient: false,
    gradientColors: ['#000000', '#0066CC'],
  });

  useEffect(() => {
    fetchLogos();
  }, []);

  const fetchLogos = async () => {
    try {
      const res = await fetch('/api/admin/logos', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setLogos(data.logos || []);
      }
    } catch (error) {
      console.error('Error fetching logos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName.trim()) {
      toast.error('Business name is required');
      return;
    }

    setGenerating(true);
    try {
      // Generate logo image from canvas
      if (!canvasRef.current) {
        toast.error('Please generate preview first');
        setGenerating(false);
        return;
      }

      const canvas = canvasRef.current;
      const logoUrl = canvas.toDataURL('image/png');
      
      // Generate SVG
      const svg = generateSVG(formData);
      
      // Prepare logo data with image URLs
      const logoData = {
        ...formData,
        logoUrl,
        logoSvgUrl: svg,
      };

      const url = editingLogo ? `/api/admin/logos/${editingLogo._id}` : '/api/admin/logos';
      const method = editingLogo ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(logoData),
      });

      if (res.ok) {
        toast.success(editingLogo ? 'Logo updated!' : 'Logo created!');
        setShowForm(false);
        setEditingLogo(null);
        resetForm();
        fetchLogos();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save logo');
      }
    } catch (error) {
      console.error('Error saving logo:', error);
      toast.error('Error saving logo');
    } finally {
      setGenerating(false);
    }
  };

  const generateSVG = (data: FormData) => {
    const { businessName, tagline, colors, fonts, textAlignment, shadow, gradient, gradientColors } = data;
    
    const width = 800;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    
    let textX = centerX;
    if (textAlignment === 'left') textX = 50;
    if (textAlignment === 'right') textX = width - 50;

    const shadowFilter = shadow ? `
    <defs>
      <filter id="shadow">
        <feDropShadow dx="5" dy="5" stdDeviation="3" flood-opacity="0.3"/>
      </filter>
    </defs>
  ` : '';

    const gradientDef = gradient && gradientColors && gradientColors.length >= 2 ? `
    <defs>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${gradientColors[0]};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${gradientColors[1]};stop-opacity:1" />
      </linearGradient>
    </defs>
  ` : '';

    const bgFill = gradient ? 'url(#bgGradient)' : (colors?.background || '#FFFFFF');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  ${shadowFilter}
  ${gradientDef}
  <rect width="${width}" height="${height}" fill="${bgFill}"/>
  <text x="${textX}" y="${centerY - (tagline ? 30 : 0)}" 
        font-family="${fonts?.primary || 'Arial'}" 
        font-size="48" 
        font-weight="bold" 
        fill="${colors?.primary || '#000000'}"
        text-anchor="${textAlignment === 'left' ? 'start' : textAlignment === 'right' ? 'end' : 'middle'}"
        ${shadow ? 'filter="url(#shadow)"' : ''}>
    ${businessName}
  </text>
  ${tagline ? `
  <text x="${textX}" y="${centerY + 40}" 
        font-family="${fonts?.secondary || fonts?.primary || 'Arial'}" 
        font-size="24" 
        fill="${colors?.secondary || colors?.primary || '#000000'}"
        text-anchor="${textAlignment === 'left' ? 'start' : textAlignment === 'right' ? 'end' : 'middle'}"
        ${shadow ? 'filter="url(#shadow)"' : ''}>
    ${tagline}
  </text>
  ` : ''}
</svg>`;
  };

  const handleGeneratePreview = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 400;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image if provided
    if (formData.imageUrl) {
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.onload = () => {
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        drawLogoContent(ctx, canvas, formData);
      };
      bgImg.onerror = () => {
        // If image fails to load, use solid color/gradient background
        drawBackground(ctx, canvas, formData);
        drawLogoContent(ctx, canvas, formData);
      };
      bgImg.src = formData.imageUrl;
      return; // Exit early, will redraw when image loads
    }

    drawBackground(ctx, canvas, formData);
    drawLogoContent(ctx, canvas, formData);
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, formData: FormData) => {
    // Draw background
    if (formData.gradient && formData.gradientColors && formData.gradientColors.length >= 2) {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, formData.gradientColors[0]);
      gradient.addColorStop(1, formData.gradientColors[1]);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = formData.colors.background;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const drawLogoContent = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, formData: FormData) => {
    // Draw border
    if (formData.borderWidth > 0) {
      ctx.strokeStyle = formData.borderColor || formData.colors.primary;
      ctx.lineWidth = formData.borderWidth;
      ctx.strokeRect(
        formData.borderWidth / 2,
        formData.borderWidth / 2,
        canvas.width - formData.borderWidth,
        canvas.height - formData.borderWidth
      );
    }

    // Draw icon if provided
    if ((formData.logoType === 'icon' || formData.logoType === 'combination') && (formData.iconUrl || formData.icon)) {
      const iconSize = 80;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      if (formData.iconUrl) {
        // Draw custom icon image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (formData.iconPosition === 'left') {
            ctx.drawImage(img, 50, centerY - iconSize / 2, iconSize, iconSize);
          } else if (formData.iconPosition === 'right') {
            ctx.drawImage(img, canvas.width - 50 - iconSize, centerY - iconSize / 2, iconSize, iconSize);
          } else if (formData.iconPosition === 'top') {
            ctx.drawImage(img, centerX - iconSize / 2, 50, iconSize, iconSize);
          } else if (formData.iconPosition === 'bottom') {
            ctx.drawImage(img, centerX - iconSize / 2, canvas.height - 50 - iconSize, iconSize, iconSize);
          } else {
            ctx.drawImage(img, centerX - iconSize / 2, centerY - iconSize / 2, iconSize, iconSize);
          }
          drawTextContent(ctx, canvas, formData);
        };
        img.src = formData.iconUrl;
      } else {
        // Draw preset icon (simple shape)
        ctx.fillStyle = formData.colors.primary;
        ctx.beginPath();
        if (formData.icon === 'circle') {
          ctx.arc(centerX, centerY, iconSize / 2, 0, Math.PI * 2);
        } else if (formData.icon === 'square') {
          ctx.rect(centerX - iconSize / 2, centerY - iconSize / 2, iconSize, iconSize);
        }
        ctx.fill();
        drawTextContent(ctx, canvas, formData);
      }
    } else {
      drawTextContent(ctx, canvas, formData);
    }
  };

  const drawTextContent = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, formData: FormData) => {
    // Set font
    ctx.font = `bold 48px ${formData.fonts.primary}`;
    ctx.fillStyle = formData.colors.primary;
    ctx.textAlign = formData.textAlignment === 'left' ? 'left' : formData.textAlignment === 'right' ? 'right' : 'center';
    ctx.textBaseline = 'middle';

    // Calculate text position
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    let textX = centerX;
    if (formData.textAlignment === 'left') textX = 50;
    if (formData.textAlignment === 'right') textX = canvas.width - 50;

    // Adjust text position based on icon position
    if (formData.logoType === 'combination' && formData.icon) {
      if (formData.iconPosition === 'left') textX = centerX + 50;
      if (formData.iconPosition === 'right') textX = centerX - 50;
    }

    // Draw shadow if enabled
    if (formData.shadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
    }

    // Draw business name
    if (formData.logoType !== 'icon') {
      ctx.fillText(formData.businessName, textX, centerY - (formData.tagline ? 30 : 0));
    }

    // Draw tagline if exists
    if (formData.tagline && formData.logoType !== 'icon') {
      ctx.font = `24px ${formData.fonts.secondary || formData.fonts.primary}`;
      ctx.fillStyle = formData.colors.secondary || formData.colors.primary;
      ctx.fillText(formData.tagline, textX, centerY + 40);
    }

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  };

  const handleDownload = async (logo: Logo, format: 'png' | 'svg' | 'pdf') => {
    try {
      const res = await fetch(`/api/admin/logos/${logo._id}/download?format=${format}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${logo.businessName.replace(/\s+/g, '-')}-logo.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`Logo downloaded as ${format.toUpperCase()}`);
      } else {
        toast.error('Failed to download logo');
      }
    } catch (error) {
      toast.error('Error downloading logo');
    }
  };

  const resetForm = () => {
    setFormData({
      businessName: '',
      tagline: '',
      logoType: 'combination',
      layout: 'horizontal',
      colors: {
        primary: '#000000',
        secondary: '#0066CC',
        background: '#FFFFFF',
      },
      fonts: {
        primary: 'Arial',
        secondary: 'Arial',
      },
      icon: '',
      iconUrl: '',
      imageUrl: '',
      iconPosition: 'left',
      style: 'modern',
      textAlignment: 'center',
      spacing: 10,
      borderRadius: 0,
      borderWidth: 0,
      borderColor: '#000000',
      shadow: false,
      gradient: false,
      gradientColors: ['#000000', '#0066CC'],
    });
  };

  const startEdit = (logo: Logo) => {
    setEditingLogo(logo);
    setFormData({
      businessName: logo.businessName,
      tagline: logo.tagline || '',
      logoType: logo.logoType,
      layout: logo.layout,
      colors: {
        primary: logo.colors.primary || '#000000',
        secondary: logo.colors.secondary || '#0066CC',
        background: logo.colors.background || '#FFFFFF',
      },
      fonts: {
        primary: logo.fonts.primary || 'Arial',
        secondary: logo.fonts.secondary || 'Arial',
      },
      icon: logo.icon || '',
      iconUrl: logo.iconUrl || '',
      imageUrl: logo.imageUrl || '',
      iconPosition: logo.iconPosition,
      style: logo.style || 'modern',
      textAlignment: logo.textAlignment,
      spacing: logo.spacing,
      borderRadius: logo.borderRadius,
      borderWidth: logo.borderWidth,
      borderColor: logo.borderColor || '#000000',
      shadow: logo.shadow,
      gradient: logo.gradient,
      gradientColors: logo.gradientColors || ['#000000', '#0066CC'],
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this logo?')) return;

    try {
      const res = await fetch(`/api/admin/logos/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success('Logo deleted!');
        fetchLogos();
      } else {
        toast.error('Failed to delete logo');
      }
    } catch (error) {
      toast.error('Error deleting logo');
    }
  };

  useEffect(() => {
    if (showForm) {
      handleGeneratePreview();
    }
  }, [formData, showForm]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">🎨 Logo Maker</h1>
        <button
          onClick={() => {
            resetForm();
            setEditingLogo(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Create New Logo
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingLogo ? 'Edit Logo' : 'Create New Logo'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Business Name *</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-sm font-medium mb-2">Tagline (Optional)</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="e.g., Quality Products Since 2020"
              />
            </div>

            {/* Logo Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Logo Type</label>
              <select
                value={formData.logoType}
                onChange={(e) => setFormData({ ...formData, logoType: e.target.value as any })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="text">Text Only</option>
                <option value="icon">Icon Only</option>
                <option value="combination">Text + Icon</option>
              </select>
            </div>

            {/* Style Template */}
            <div>
              <label className="block text-sm font-medium mb-2">Logo Style</label>
              <select
                value={formData.style}
                onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                {LOGO_STYLES.map((style) => (
                  <option key={style.value} value={style.value}>
                    {style.name} - {style.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Icon Upload */}
            {(formData.logoType === 'icon' || formData.logoType === 'combination') && (
              <div>
                <label className="block text-sm font-medium mb-2">Custom Icon Image (URL)</label>
                <input
                  type="url"
                  value={formData.iconUrl}
                  onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="https://example.com/icon.png"
                />
                <p className="text-xs text-gray-500 mt-1">Or select from preset icons below</p>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {ICON_OPTIONS.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: iconName, iconUrl: '' })}
                      className={`p-2 border rounded-lg text-center hover:bg-gray-50 ${
                        formData.icon === iconName ? 'bg-blue-100 border-blue-500' : ''
                      }`}
                    >
                      {iconName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Background Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Background Image (URL) - Optional</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="https://example.com/background.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">Add a background image to your logo</p>
            </div>

            {/* Layout */}
            <div>
              <label className="block text-sm font-medium mb-2">Layout</label>
              <select
                value={formData.layout}
                onChange={(e) => setFormData({ ...formData, layout: e.target.value as any })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
                <option value="stacked">Stacked</option>
              </select>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Primary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.colors.primary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        colors: { ...formData.colors, primary: e.target.value },
                      })
                    }
                    className="w-16 h-10 border rounded"
                  />
                  <input
                    type="text"
                    value={formData.colors.primary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        colors: { ...formData.colors, primary: e.target.value },
                      })
                    }
                    className="flex-1 px-2 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Secondary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.colors.secondary || '#0066CC'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        colors: { ...formData.colors, secondary: e.target.value },
                      })
                    }
                    className="w-16 h-10 border rounded"
                  />
                  <input
                    type="text"
                    value={formData.colors.secondary || '#0066CC'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        colors: { ...formData.colors, secondary: e.target.value },
                      })
                    }
                    className="flex-1 px-2 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Background</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.colors.background}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        colors: { ...formData.colors, background: e.target.value },
                      })
                    }
                    className="w-16 h-10 border rounded"
                  />
                  <input
                    type="text"
                    value={formData.colors.background}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        colors: { ...formData.colors, background: e.target.value },
                      })
                    }
                    className="flex-1 px-2 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Fonts */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Primary Font</label>
                <select
                  value={formData.fonts.primary}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fonts: { ...formData.fonts, primary: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Secondary Font</label>
                <select
                  value={formData.fonts.secondary}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fonts: { ...formData.fonts, secondary: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Text Alignment */}
            <div>
              <label className="block text-sm font-medium mb-2">Text Alignment</label>
              <select
                value={formData.textAlignment}
                onChange={(e) =>
                  setFormData({ ...formData, textAlignment: e.target.value as any })
                }
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>

            {/* Effects */}
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.shadow}
                  onChange={(e) => setFormData({ ...formData, shadow: e.target.checked })}
                />
                <span>Shadow Effect</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.gradient}
                  onChange={(e) => setFormData({ ...formData, gradient: e.target.checked })}
                />
                <span>Gradient Background</span>
              </label>
            </div>

            {/* Gradient Colors */}
            {formData.gradient && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Gradient Color 1</label>
                  <input
                    type="color"
                    value={formData.gradientColors?.[0] || '#000000'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gradientColors: [
                          e.target.value,
                          formData.gradientColors?.[1] || '#0066CC',
                        ],
                      })
                    }
                    className="w-full h-10 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Gradient Color 2</label>
                  <input
                    type="color"
                    value={formData.gradientColors?.[1] || '#0066CC'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gradientColors: [
                          formData.gradientColors?.[0] || '#000000',
                          e.target.value,
                        ],
                      })
                    }
                    className="w-full h-10 border rounded"
                  />
                </div>
              </div>
            )}

            {/* Border */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Border Width</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.borderWidth}
                  onChange={(e) =>
                    setFormData({ ...formData, borderWidth: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Border Color</label>
                <input
                  type="color"
                  value={formData.borderColor || '#000000'}
                  onChange={(e) =>
                    setFormData({ ...formData, borderColor: e.target.value })
                  }
                  className="w-full h-10 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Border Radius</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.borderRadius}
                  onChange={(e) =>
                    setFormData({ ...formData, borderRadius: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium mb-2">Preview</label>
              <div className="border rounded-lg p-4 bg-gray-50 flex justify-center">
                <canvas ref={canvasRef} className="border rounded-lg bg-white" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={generating}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {generating ? 'Generating...' : editingLogo ? 'Update Logo' : 'Generate Logo'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingLogo(null);
                  resetForm();
                }}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Logos List */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Your Logos</h2>
        {logos.length === 0 ? (
          <p className="text-gray-500">No logos created yet. Create your first logo!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {logos.map((logo) => (
              <div key={logo._id} className="border rounded-lg p-4">
                <div className="mb-2">
                  <h3 className="font-bold text-lg">{logo.businessName}</h3>
                  {logo.tagline && <p className="text-sm text-gray-600">{logo.tagline}</p>}
                </div>
                {logo.logoUrl && (
                  <img
                    src={logo.logoUrl}
                    alt={logo.businessName}
                    className="w-full h-32 object-contain mb-4 bg-gray-50 rounded"
                  />
                )}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => startEdit(logo)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDownload(logo, 'png')}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                  >
                    PNG
                  </button>
                  <button
                    onClick={() => handleDownload(logo, 'svg')}
                    className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
                  >
                    SVG
                  </button>
                  <button
                    onClick={() => handleDelete(logo._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


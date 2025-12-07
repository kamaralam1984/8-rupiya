'use client';

import { useState } from 'react';

export interface PageDesignSettings {
  // Color Settings
  backgroundColor: string;
  textColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  linkColor: string;
  
  // Layout Settings
  layout: 'full-width' | 'container' | 'boxed';
  maxWidth: string;
  padding: string;
  margin: string;
  
  // Typography
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  headingFont: string;
  headingSize: string;
  
  // Spacing
  sectionSpacing: string;
  contentSpacing: string;
  borderRadius: string;
  
  // Effects
  effects: {
    fadeIn: boolean;
    slideUp: boolean;
    zoomIn: boolean;
    rotate: boolean;
    bounce: boolean;
    pulse: boolean;
    glow: boolean;
    shadow: boolean;
    gradient: boolean;
    blur: boolean;
    hoverScale: boolean;
    hoverRotate: boolean;
    parallax: boolean;
    shimmer: boolean;
    ripple: boolean;
    flip: boolean;
    shake: boolean;
    wobble: boolean;
    swing: boolean;
    tada: boolean;
  };
  
  // Functions
  functions: {
    stickyHeader: boolean;
    smoothScroll: boolean;
    lazyLoad: boolean;
    infiniteScroll: boolean;
    searchHighlight: boolean;
    printOptimized: boolean;
    shareButtons: boolean;
    comments: boolean;
    relatedPosts: boolean;
    breadcrumbs: boolean;
    toc: boolean;
    backToTop: boolean;
    readingProgress: boolean;
    darkMode: boolean;
    fontSizeToggle: boolean;
    socialShare: boolean;
    pdfExport: boolean;
    emailCapture: boolean;
    analytics: boolean;
    seoOptimized: boolean;
    responsiveImages: boolean;
  };
  
  // Advanced Settings
  customCSS: string;
  customJS: string;
}

interface PageDesignControlProps {
  settings: PageDesignSettings;
  onChange: (settings: PageDesignSettings) => void;
}

const FONT_OPTIONS = [
  'Arial, sans-serif',
  'Georgia, serif',
  '"Times New Roman", serif',
  '"Courier New", monospace',
  '"Helvetica Neue", sans-serif',
  '"Comic Sans MS", cursive',
  'Impact, fantasy',
  'Verdana, sans-serif',
];

const EFFECTS = [
  { id: 'fadeIn', name: 'Fade In', icon: '✨' },
  { id: 'slideUp', name: 'Slide Up', icon: '⬆️' },
  { id: 'zoomIn', name: 'Zoom In', icon: '🔍' },
  { id: 'rotate', name: 'Rotate', icon: '🔄' },
  { id: 'bounce', name: 'Bounce', icon: '⚡' },
  { id: 'pulse', name: 'Pulse', icon: '💓' },
  { id: 'glow', name: 'Glow', icon: '🌟' },
  { id: 'shadow', name: 'Shadow', icon: '🌑' },
  { id: 'gradient', name: 'Gradient', icon: '🌈' },
  { id: 'blur', name: 'Blur', icon: '💫' },
  { id: 'hoverScale', name: 'Hover Scale', icon: '📏' },
  { id: 'hoverRotate', name: 'Hover Rotate', icon: '🌀' },
  { id: 'parallax', name: 'Parallax', icon: '📱' },
  { id: 'shimmer', name: 'Shimmer', icon: '✨' },
  { id: 'ripple', name: 'Ripple', icon: '🌊' },
  { id: 'flip', name: 'Flip', icon: '🔄' },
  { id: 'shake', name: 'Shake', icon: '📳' },
  { id: 'wobble', name: 'Wobble', icon: '🎯' },
  { id: 'swing', name: 'Swing', icon: '🎪' },
  { id: 'tada', name: 'Tada', icon: '🎉' },
];

const FUNCTIONS = [
  { id: 'stickyHeader', name: 'Sticky Header', icon: '📌', desc: 'Header stays at top while scrolling' },
  { id: 'smoothScroll', name: 'Smooth Scroll', icon: '📜', desc: 'Smooth scrolling behavior' },
  { id: 'lazyLoad', name: 'Lazy Load', icon: '⏳', desc: 'Load images on demand' },
  { id: 'infiniteScroll', name: 'Infinite Scroll', icon: '∞', desc: 'Auto-load more content' },
  { id: 'searchHighlight', name: 'Search Highlight', icon: '🔍', desc: 'Highlight search results' },
  { id: 'printOptimized', name: 'Print Optimized', icon: '🖨️', desc: 'Optimized for printing' },
  { id: 'shareButtons', name: 'Share Buttons', icon: '📤', desc: 'Social share buttons' },
  { id: 'comments', name: 'Comments', icon: '💬', desc: 'Enable comments section' },
  { id: 'relatedPosts', name: 'Related Posts', icon: '🔗', desc: 'Show related content' },
  { id: 'breadcrumbs', name: 'Breadcrumbs', icon: '🍞', desc: 'Navigation breadcrumbs' },
  { id: 'toc', name: 'Table of Contents', icon: '📑', desc: 'Auto-generated TOC' },
  { id: 'backToTop', name: 'Back to Top', icon: '⬆️', desc: 'Scroll to top button' },
  { id: 'readingProgress', name: 'Reading Progress', icon: '📊', desc: 'Show reading progress bar' },
  { id: 'darkMode', name: 'Dark Mode', icon: '🌙', desc: 'Enable dark mode toggle' },
  { id: 'fontSizeToggle', name: 'Font Size Toggle', icon: '🔤', desc: 'User can adjust font size' },
  { id: 'socialShare', name: 'Social Share', icon: '📱', desc: 'Social media sharing' },
  { id: 'pdfExport', name: 'PDF Export', icon: '📄', desc: 'Export page as PDF' },
  { id: 'emailCapture', name: 'Email Capture', icon: '📧', desc: 'Email subscription form' },
  { id: 'analytics', name: 'Analytics', icon: '📈', desc: 'Track page analytics' },
  { id: 'responsiveImages', name: 'Responsive Images', icon: '🖼️', desc: 'Auto-responsive images' },
];

export default function PageDesignControl({ settings, onChange }: PageDesignControlProps) {
  const [activeTab, setActiveTab] = useState<'colors' | 'layout' | 'effects' | 'functions' | 'advanced'>('colors');

  // Ensure settings has all required properties with defaults
  const safeSettings: PageDesignSettings = {
    backgroundColor: settings?.backgroundColor || '#ffffff',
    textColor: settings?.textColor || '#111827',
    primaryColor: settings?.primaryColor || '#3b82f6',
    secondaryColor: settings?.secondaryColor || '#8b5cf6',
    accentColor: settings?.accentColor || '#ec4899',
    linkColor: settings?.linkColor || '#2563eb',
    layout: settings?.layout || 'container',
    maxWidth: settings?.maxWidth || '1200px',
    padding: settings?.padding || '20px',
    margin: settings?.margin || '0 auto',
    fontFamily: settings?.fontFamily || 'Arial, sans-serif',
    fontSize: settings?.fontSize || '16px',
    lineHeight: settings?.lineHeight || '1.6',
    headingFont: settings?.headingFont || 'Arial, sans-serif',
    headingSize: settings?.headingSize || '2rem',
    sectionSpacing: settings?.sectionSpacing || '40px',
    contentSpacing: settings?.contentSpacing || '20px',
    borderRadius: settings?.borderRadius || '8px',
    effects: {
      fadeIn: settings?.effects?.fadeIn ?? false,
      slideUp: settings?.effects?.slideUp ?? false,
      zoomIn: settings?.effects?.zoomIn ?? false,
      rotate: settings?.effects?.rotate ?? false,
      bounce: settings?.effects?.bounce ?? false,
      pulse: settings?.effects?.pulse ?? false,
      glow: settings?.effects?.glow ?? false,
      shadow: settings?.effects?.shadow ?? false,
      gradient: settings?.effects?.gradient ?? false,
      blur: settings?.effects?.blur ?? false,
      hoverScale: settings?.effects?.hoverScale ?? false,
      hoverRotate: settings?.effects?.hoverRotate ?? false,
      parallax: settings?.effects?.parallax ?? false,
      shimmer: settings?.effects?.shimmer ?? false,
      ripple: settings?.effects?.ripple ?? false,
      flip: settings?.effects?.flip ?? false,
      shake: settings?.effects?.shake ?? false,
      wobble: settings?.effects?.wobble ?? false,
      swing: settings?.effects?.swing ?? false,
      tada: settings?.effects?.tada ?? false,
    },
    functions: {
      stickyHeader: settings?.functions?.stickyHeader ?? false,
      smoothScroll: settings?.functions?.smoothScroll ?? false,
      lazyLoad: settings?.functions?.lazyLoad ?? false,
      infiniteScroll: settings?.functions?.infiniteScroll ?? false,
      searchHighlight: settings?.functions?.searchHighlight ?? false,
      printOptimized: settings?.functions?.printOptimized ?? false,
      shareButtons: settings?.functions?.shareButtons ?? false,
      comments: settings?.functions?.comments ?? false,
      relatedPosts: settings?.functions?.relatedPosts ?? false,
      breadcrumbs: settings?.functions?.breadcrumbs ?? false,
      toc: settings?.functions?.toc ?? false,
      backToTop: settings?.functions?.backToTop ?? false,
      readingProgress: settings?.functions?.readingProgress ?? false,
      darkMode: settings?.functions?.darkMode ?? false,
      fontSizeToggle: settings?.functions?.fontSizeToggle ?? false,
      socialShare: settings?.functions?.socialShare ?? false,
      pdfExport: settings?.functions?.pdfExport ?? false,
      emailCapture: settings?.functions?.emailCapture ?? false,
      analytics: settings?.functions?.analytics ?? false,
      seoOptimized: settings?.functions?.seoOptimized ?? true,
      responsiveImages: settings?.functions?.responsiveImages ?? true,
    },
    customCSS: settings?.customCSS || '',
    customJS: settings?.customJS || '',
  };

  const updateSetting = <K extends keyof PageDesignSettings>(
    key: K,
    value: PageDesignSettings[K]
  ) => {
    onChange({
      ...safeSettings,
      [key]: value,
    });
  };

  const updateEffect = (effectId: string, value: boolean) => {
    updateSetting('effects', {
      ...safeSettings.effects,
      [effectId]: value,
    });
  };

  const updateFunction = (functionId: string, value: boolean) => {
    updateSetting('functions', {
      ...safeSettings.functions,
      [functionId]: value,
    });
  };

  return (
    <div 
      className="border border-gray-200 rounded-xl bg-white"
      onClick={(e) => {
        // Prevent any clicks inside from bubbling up to form
        e.stopPropagation();
      }}
    >
      {/* Tabs */}
      <div 
        className="flex border-b border-gray-200 overflow-x-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {[
          { id: 'colors', label: '🎨 Colors', count: null },
          { id: 'layout', label: '📐 Layout', count: null },
          { id: 'effects', label: '✨ Effects', count: Object.values(safeSettings.effects).filter(Boolean).length },
          { id: 'functions', label: '⚙️ Functions', count: Object.values(safeSettings.functions).filter(Boolean).length },
          { id: 'advanced', label: '🔧 Advanced', count: null },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveTab(tab.id as any);
            }}
            className={`
              px-6 py-3 text-sm font-medium whitespace-nowrap transition-all
              ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            {tab.label}
            {tab.count !== null && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ColorPicker
                label="Background Color"
                value={safeSettings.backgroundColor}
                onChange={(value) => updateSetting('backgroundColor', value)}
              />
              <ColorPicker
                label="Text Color"
                value={safeSettings.textColor}
                onChange={(value) => updateSetting('textColor', value)}
              />
              <ColorPicker
                label="Primary Color"
                value={safeSettings.primaryColor}
                onChange={(value) => updateSetting('primaryColor', value)}
              />
              <ColorPicker
                label="Secondary Color"
                value={safeSettings.secondaryColor}
                onChange={(value) => updateSetting('secondaryColor', value)}
              />
              <ColorPicker
                label="Accent Color"
                value={safeSettings.accentColor}
                onChange={(value) => updateSetting('accentColor', value)}
              />
              <ColorPicker
                label="Link Color"
                value={safeSettings.linkColor}
                onChange={(value) => updateSetting('linkColor', value)}
              />
            </div>
            
            {/* Color Presets */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Color Presets</h3>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {[
                  { name: 'Ocean', bg: '#0ea5e9', text: '#ffffff', primary: '#0284c7' },
                  { name: 'Forest', bg: '#22c55e', text: '#ffffff', primary: '#16a34a' },
                  { name: 'Sunset', bg: '#f97316', text: '#ffffff', primary: '#ea580c' },
                  { name: 'Purple', bg: '#a855f7', text: '#ffffff', primary: '#9333ea' },
                  { name: 'Pink', bg: '#ec4899', text: '#ffffff', primary: '#db2777' },
                  { name: 'Dark', bg: '#1f2937', text: '#f9fafb', primary: '#3b82f6' },
                  { name: 'Light', bg: '#ffffff', text: '#111827', primary: '#3b82f6' },
                  { name: 'Warm', bg: '#fef3c7', text: '#78350f', primary: '#f59e0b' },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      updateSetting('backgroundColor', preset.bg);
                      updateSetting('textColor', preset.text);
                      updateSetting('primaryColor', preset.primary);
                    }}
                    className="p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all hover:scale-105"
                    title={preset.name}
                  >
                    <div className="w-full h-12 rounded mb-2" style={{ background: preset.bg }}></div>
                    <div className="text-xs font-medium text-gray-700">{preset.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Layout Tab */}
        {activeTab === 'layout' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Layout Type</label>
              <div className="grid grid-cols-3 gap-3">
                {(['full-width', 'container', 'boxed'] as const).map((layout) => (
                  <button
                    key={layout}
                    onClick={() => updateSetting('layout', layout)}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${
                        safeSettings.layout === layout
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="text-sm font-medium text-gray-700 capitalize mb-1">{layout.replace('-', ' ')}</div>
                    <div className={`h-12 rounded ${
                      layout === 'full-width' ? 'bg-blue-200' :
                      layout === 'container' ? 'bg-blue-200 mx-4' :
                      'bg-blue-200 mx-8'
                    }`}></div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputControl
                label="Max Width"
                type="text"
                value={safeSettings.maxWidth}
                onChange={(value) => updateSetting('maxWidth', value)}
                placeholder="1200px"
              />
              <InputControl
                label="Padding"
                type="text"
                value={safeSettings.padding}
                onChange={(value) => updateSetting('padding', value)}
                placeholder="20px"
              />
              <InputControl
                label="Margin"
                type="text"
                value={safeSettings.margin}
                onChange={(value) => updateSetting('margin', value)}
                placeholder="0 auto"
              />
              <InputControl
                label="Section Spacing"
                type="text"
                value={safeSettings.sectionSpacing}
                onChange={(value) => updateSetting('sectionSpacing', value)}
                placeholder="40px"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
              <select
                value={safeSettings.fontFamily}
                onChange={(e) => updateSetting('fontFamily', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>
                    {font.split(',')[0]}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputControl
                label="Font Size"
                type="text"
                value={safeSettings.fontSize}
                onChange={(value) => updateSetting('fontSize', value)}
                placeholder="16px"
              />
              <InputControl
                label="Line Height"
                type="text"
                value={safeSettings.lineHeight}
                onChange={(value) => updateSetting('lineHeight', value)}
                placeholder="1.6"
              />
              <InputControl
                label="Heading Font"
                type="text"
                value={safeSettings.headingFont}
                onChange={(value) => updateSetting('headingFont', value)}
                placeholder="Arial, sans-serif"
              />
              <InputControl
                label="Heading Size"
                type="text"
                value={safeSettings.headingSize}
                onChange={(value) => updateSetting('headingSize', value)}
                placeholder="2rem"
              />
            </div>

            <InputControl
              label="Border Radius"
              type="text"
              value={safeSettings.borderRadius}
              onChange={(value) => updateSetting('borderRadius', value)}
              placeholder="8px"
            />
          </div>
        )}

        {/* Effects Tab */}
        {activeTab === 'effects' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Visual Effects (Select up to 20)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {EFFECTS.map((effect) => (
                <label
                  key={effect.id}
                  className={`
                    flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${
                      safeSettings.effects[effect.id as keyof typeof safeSettings.effects]
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={safeSettings.effects[effect.id as keyof typeof safeSettings.effects] || false}
                    onChange={(e) => updateEffect(effect.id, e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-2xl">{effect.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{effect.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Functions Tab */}
        {activeTab === 'functions' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Functional Features (Select up to 20)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FUNCTIONS.map((func) => (
                <label
                  key={func.id}
                  className={`
                    flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${
                      safeSettings.functions[func.id as keyof typeof safeSettings.functions]
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={safeSettings.functions[func.id as keyof typeof safeSettings.functions] || false}
                    onChange={(e) => updateFunction(func.id, e.target.checked)}
                    className="w-5 h-5 mt-0.5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{func.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{func.name}</span>
                    </div>
                    <p className="text-xs text-gray-500">{func.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom CSS</label>
              <textarea
                value={safeSettings.customCSS}
                onChange={(e) => updateSetting('customCSS', e.target.value)}
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="/* Add your custom CSS here */"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom JavaScript</label>
              <textarea
                value={safeSettings.customJS}
                onChange={(e) => updateSetting('customJS', e.target.value)}
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="// Add your custom JavaScript here"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

function InputControl({ label, type, value, onChange, placeholder }: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}


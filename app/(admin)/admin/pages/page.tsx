'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { safeJsonParse } from '@/app/utils/fetchHelpers';
import PageDesignControl, { PageDesignSettings } from '@/app/components/admin/PageDesignControl';
import DragDropPageBuilder, { PageBlock } from '@/app/components/admin/DragDropPageBuilder';

interface Page {
  _id: string;
  title: string;
  slug: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  isPublished: boolean;
  designSettings?: PageDesignSettings;
  createdAt: string;
  updatedAt: string;
}

export default function PagesManagement() {
  const { token } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [useBuilder, setUseBuilder] = useState(false);
  const [pageBlocks, setPageBlocks] = useState<PageBlock[]>([]);
  const getDefaultDesignSettings = (): PageDesignSettings => ({
    backgroundColor: '#ffffff',
    textColor: '#111827',
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    accentColor: '#ec4899',
    linkColor: '#2563eb',
    layout: 'container',
    maxWidth: '1200px',
    padding: '20px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
    fontSize: '16px',
    lineHeight: '1.6',
    headingFont: 'Arial, sans-serif',
    headingSize: '2rem',
    sectionSpacing: '40px',
    contentSpacing: '20px',
    borderRadius: '8px',
    effects: {
      fadeIn: false,
      slideUp: false,
      zoomIn: false,
      rotate: false,
      bounce: false,
      pulse: false,
      glow: false,
      shadow: false,
      gradient: false,
      blur: false,
      hoverScale: false,
      hoverRotate: false,
      parallax: false,
      shimmer: false,
      ripple: false,
      flip: false,
      shake: false,
      wobble: false,
      swing: false,
      tada: false,
    },
    functions: {
      stickyHeader: false,
      smoothScroll: false,
      lazyLoad: false,
      infiniteScroll: false,
      searchHighlight: false,
      printOptimized: false,
      shareButtons: false,
      comments: false,
      relatedPosts: false,
      breadcrumbs: false,
      toc: false,
      backToTop: false,
      readingProgress: false,
      darkMode: false,
      fontSizeToggle: false,
      socialShare: false,
      pdfExport: false,
      emailCapture: false,
      analytics: false,
      seoOptimized: true,
      responsiveImages: true,
    },
    customCSS: '',
    customJS: '',
  });

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    seoTitle: '',
    seoDescription: '',
    isPublished: true,
    designSettings: getDefaultDesignSettings(),
  });

  useEffect(() => {
    fetchPages();
  }, [token, filterStatus]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const url = filterStatus === 'all' 
        ? '/api/admin/pages' 
        : `/api/admin/pages?isPublished=${filterStatus === 'published'}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await safeJsonParse<{ pages: Page[] }>(response);
      setPages(data?.pages || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast.error('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: editingPage ? formData.slug : generateSlug(title),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure content is set from blocks if using builder
    let finalContent = formData.content || '';
    
    if (useBuilder && pageBlocks.length > 0) {
      // Generate HTML from blocks
      const generatedContent = pageBlocks.map(block => {
        if (!block.content || !block.content.trim()) return '';
        
        const styles = block.styles ? Object.entries(block.styles)
          .map(([key, value]) => {
            // Convert camelCase to kebab-case
            const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            return `${kebabKey}: ${value}`;
          })
          .filter(style => style.trim())
          .join('; ') : '';
        
        let blockHtml = block.content.trim();
        if (styles) {
          // Add styles to the first opening tag
          blockHtml = blockHtml.replace(/(<[^>]+)(>)/, (match, tag, closing) => {
            // Don't add style if it already has one
            if (tag.includes('style=')) return match;
            return `${tag} style="${styles}"${closing}`;
          });
        }
        
        return blockHtml;
      }).filter(content => content.trim());
      
      if (generatedContent.length > 0) {
        finalContent = generatedContent.join('\n');
      }
    }
    
    // Ensure we always have valid content (required by schema)
    if (!finalContent || !finalContent.trim()) {
      finalContent = '<div><p>Page content will be added using the drag & drop builder</p></div>';
    }
    
    // Ensure content is properly trimmed
    finalContent = finalContent.trim();
    
    // Validation
    if (!formData.title || !formData.title.trim()) {
      toast.error('Page title is required');
      return;
    }

    if (!formData.slug || !formData.slug.trim()) {
      toast.error('Page slug is required');
      return;
    }

    // Validate and format slug
    const formattedSlug = formData.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    if (!formattedSlug || formattedSlug.length === 0) {
      toast.error('Invalid slug format. Please use only lowercase letters, numbers, and hyphens.');
      return;
    }

    try {
      const url = editingPage
        ? `/api/admin/pages/${editingPage._id}`
        : '/api/admin/pages';

      const method = editingPage ? 'PUT' : 'POST';

      // Prepare request body - clean designSettings to avoid issues
      const cleanDesignSettings = formData.designSettings ? {
        ...formData.designSettings,
        effects: formData.designSettings.effects || {},
        functions: formData.designSettings.functions || {},
        customCSS: formData.designSettings.customCSS || '',
        customJS: formData.designSettings.customJS || '',
      } : {};

      const requestBody = {
        title: formData.title.trim(),
        slug: formattedSlug,
        content: finalContent,
        seoTitle: formData.seoTitle?.trim() || null,
        seoDescription: formData.seoDescription?.trim() || null,
        isPublished: Boolean(formData.isPublished),
        designSettings: cleanDesignSettings,
      };

      console.log('Saving page with data:', {
        title: requestBody.title,
        slug: requestBody.slug,
        contentLength: requestBody.content?.length || 0,
        isPublished: requestBody.isPublished,
      });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await safeJsonParse<{ page: Page; success: boolean; error?: string; details?: string }>(response);

      if (!response.ok) {
        const errorMessage = data?.error || data?.details || `HTTP ${response.status}: Failed to save page`;
        throw new Error(errorMessage);
      }

      if (data?.success || data?.page) {
        toast.success(editingPage ? 'Page updated successfully!' : 'Page created successfully!');
        
        // If editing, don't close the modal - just refresh the page list
        // If creating new page, close the modal
        if (editingPage) {
          // Update the editing page data with the saved data
          if (data?.page) {
            setEditingPage(data.page);
            // Update form data with saved page data
            setFormData({
              title: data.page.title,
              slug: data.page.slug,
              content: data.page.content || '',
              seoTitle: data.page.seoTitle || '',
              seoDescription: data.page.seoDescription || '',
              isPublished: data.page.isPublished ?? true,
              designSettings: data.page.designSettings || getDefaultDesignSettings(),
            });
            // Parse content to blocks if using builder
            if (useBuilder && data.page.content) {
              try {
                const parsed = JSON.parse(data.page.content);
                if (Array.isArray(parsed)) {
                  setPageBlocks(parsed);
                }
              } catch {
                // If not JSON, convert to blocks
                setPageBlocks(parseContentToBlocks(data.page.content));
              }
            }
          }
          fetchPages(); // Refresh the list
        } else {
          // New page created - close modal
          resetForm();
          fetchPages();
        }
      } else {
        throw new Error(data?.error || 'Failed to save page');
      }
    } catch (error: any) {
      console.error('Error saving page:', error);
      console.error('Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        response: error.response,
      });
      
      let errorMessage = 'Failed to save page';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response) {
        try {
          const errorData = await error.response.json();
          errorMessage = errorData.details || errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${error.response.status}: Failed to save page`;
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const parseContentToBlocks = (content: string): PageBlock[] => {
    if (!content || content.trim() === '') return [];
    
    try {
      // Try to parse as JSON if it's stored as blocks
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // If not JSON, parse HTML into blocks
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const elements = Array.from(doc.body.children);
      
      return elements.map((el, index) => {
        const styles: { [key: string]: string } = {};
        const computedStyles = window.getComputedStyle(el);
        
        return {
          id: `block-${Date.now()}-${index}`,
          type: (el.tagName.toLowerCase() as any) || 'custom',
          content: el.outerHTML,
          styles,
        };
      });
    }
    
    return [];
  };

  const handleEdit = (page: Page) => {
    setEditingPage(page);
    // Merge existing design settings with defaults to ensure all properties exist
    const existingSettings = (page.designSettings || {}) as Partial<PageDesignSettings>;
    const defaultSettings = getDefaultDesignSettings();
    const mergedSettings: PageDesignSettings = {
      ...defaultSettings,
      ...existingSettings,
      effects: {
        ...defaultSettings.effects,
        ...(existingSettings.effects || {}),
      },
      functions: {
        ...defaultSettings.functions,
        ...(existingSettings.functions || {}),
      },
    };
    
    // Parse existing content to blocks if possible
    const blocks = parseContentToBlocks(page.content || '');
    setPageBlocks(blocks.length > 0 ? blocks : []);
    setUseBuilder(blocks.length > 0);
    
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content,
      seoTitle: page.seoTitle || '',
      seoDescription: page.seoDescription || '',
      isPublished: page.isPublished,
      designSettings: mergedSettings,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/admin/pages/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await safeJsonParse<{ success: boolean }>(response);

      if (data?.success) {
        toast.success('Page deleted successfully!');
        fetchPages();
      } else {
        throw new Error('Failed to delete page');
      }
    } catch (error: any) {
      console.error('Error deleting page:', error);
      toast.error(error.message || 'Failed to delete page');
    } finally {
      setDeletingId(null);
    }
  };

  const togglePublish = async (page: Page) => {
    try {
      const response = await fetch(`/api/admin/pages/${page._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublished: !page.isPublished }),
      });

      const data = await safeJsonParse<{ page: Page; success: boolean }>(response);

      if (data?.success || data?.page) {
        toast.success(page.isPublished ? 'Page unpublished!' : 'Page published!');
        fetchPages();
      } else {
        throw new Error('Failed to update page status');
      }
    } catch (error: any) {
      console.error('Error toggling publish:', error);
      toast.error(error.message || 'Failed to update page status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      seoTitle: '',
      seoDescription: '',
      isPublished: true,
      designSettings: getDefaultDesignSettings(),
    });
    setPageBlocks([]);
    setUseBuilder(false);
    setEditingPage(null);
    setShowForm(false);
  };

  const filteredPages = pages.filter((page) => {
    const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         page.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Page Management
          </h1>
          <p className="text-gray-600 mt-1">Create, edit, and manage your website pages</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Page
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search pages by title or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('published')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === 'published'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setFilterStatus('draft')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === 'draft'
                  ? 'bg-gray-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Drafts
            </button>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingPage ? 'Edit Page' : 'Create New Page'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter page title"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug (URL) *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="page-url-slug"
                    required
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  />
                  <p className="text-xs text-gray-500 mt-1">URL-friendly slug (lowercase, hyphens only)</p>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Content *
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setUseBuilder(false)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          !useBuilder
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        📝 HTML Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseBuilder(true)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          useBuilder
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        🎨 Drag & Drop Builder
                      </button>
                    </div>
                  </div>
                  
                  {useBuilder ? (
                    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white min-h-[500px]">
                      <DragDropPageBuilder
                        blocks={pageBlocks}
                        onChange={(blocks) => {
                          setPageBlocks(blocks);
                        }}
                        onContentUpdate={(content) => {
                          setFormData({ ...formData, content });
                        }}
                      />
                    </div>
                  ) : (
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={12}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="Enter page content (HTML supported)"
                      required={!useBuilder}
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {useBuilder 
                      ? 'Drag blocks to build your page visually, or switch to HTML editor' 
                      : 'You can use HTML tags for formatting, or switch to Drag & Drop Builder'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                    maxLength={60}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="SEO optimized title"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.seoTitle.length}/60 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {formData.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Description
                  </label>
                  <textarea
                    value={formData.seoDescription}
                    onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                    rows={3}
                    maxLength={160}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="SEO meta description"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.seoDescription.length}/160 characters</p>
                </div>
              </div>

              {/* Design Control System */}
              <div className="md:col-span-2">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span>🎨</span>
                    Page Design Control System
                  </h3>
                  <p className="text-sm text-gray-600">
                    Customize your page design with 20 effects, 20 functions, and color settings
                  </p>
                </div>
                <PageDesignControl
                  settings={formData.designSettings || getDefaultDesignSettings()}
                  onChange={(settings) => setFormData({ ...formData, designSettings: settings })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  {editingPage ? 'Update Page' : 'Create Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pages List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredPages.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 font-medium">No pages found</p>
            <p className="text-gray-500 text-sm mt-1">Create your first page to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPages.map((page) => (
                  <tr
                    key={page._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{page.title}</div>
                          {page.seoTitle && (
                            <div className="text-sm text-gray-500">{page.seoTitle}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        /{page.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePublish(page)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                          page.isPublished
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {page.isPublished ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(page.updatedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(page)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <a
                          href={`/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </a>
                        <button
                          onClick={() => handleDelete(page._id)}
                          disabled={deletingId === page._id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === page._id ? (
                            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">Total Pages</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{pages.length}</p>
            </div>
            <div className="p-3 bg-blue-200 rounded-lg">
              <svg className="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 uppercase tracking-wide">Published</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {pages.filter(p => p.isPublished).length}
              </p>
            </div>
            <div className="p-3 bg-green-200 rounded-lg">
              <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Drafts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {pages.filter(p => !p.isPublished).length}
              </p>
            </div>
            <div className="p-3 bg-gray-200 rounded-lg">
              <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


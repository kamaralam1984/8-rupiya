'use client';

import { useState, useRef } from 'react';

export interface PageBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'image' | 'button' | 'divider' | 'spacer' | 'quote' | 'list' | 'grid' | 'video' | 'custom';
  content: string;
  styles?: {
    [key: string]: string;
  };
  config?: {
    [key: string]: any;
  };
}

interface DragDropPageBuilderProps {
  blocks: PageBlock[];
  onChange: (blocks: PageBlock[]) => void;
  onContentUpdate: (content: string) => void;
}

const BLOCK_TEMPLATES: { [key: string]: Omit<PageBlock, 'id'> } = {
  heading: {
    type: 'heading',
    content: '<h2>New Heading</h2>',
    styles: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#111827',
      margin: '20px 0',
    },
  },
  paragraph: {
    type: 'paragraph',
    content: '<p>Enter your paragraph text here...</p>',
    styles: {
      fontSize: '1rem',
      lineHeight: '1.6',
      color: '#374151',
      margin: '16px 0',
    },
  },
  image: {
    type: 'image',
    content: '<img src="https://via.placeholder.com/800x400" alt="Placeholder Image" />',
    styles: {
      width: '100%',
      maxWidth: '100%',
      borderRadius: '8px',
      margin: '20px 0',
    },
    config: {
      src: 'https://via.placeholder.com/800x400',
      alt: 'Placeholder Image',
    },
  },
  button: {
    type: 'button',
    content: '<button>Click Me</button>',
    styles: {
      padding: '12px 24px',
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: '600',
      margin: '16px 0',
    },
    config: {
      text: 'Click Me',
      link: '#',
    },
  },
  divider: {
    type: 'divider',
    content: '<hr />',
    styles: {
      border: 'none',
      borderTop: '2px solid #e5e7eb',
      margin: '32px 0',
    },
  },
  spacer: {
    type: 'spacer',
    content: '<div class="spacer"></div>',
    styles: {
      height: '40px',
    },
  },
  quote: {
    type: 'quote',
    content: '<blockquote>Your quote text here...</blockquote>',
    styles: {
      borderLeft: '4px solid #3b82f6',
      paddingLeft: '20px',
      fontStyle: 'italic',
      fontSize: '1.125rem',
      color: '#4b5563',
      margin: '24px 0',
    },
  },
  list: {
    type: 'list',
    content: '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>',
    styles: {
      margin: '16px 0',
      paddingLeft: '24px',
    },
  },
  grid: {
    type: 'grid',
    content: '<div class="grid"><div>Item 1</div><div>Item 2</div><div>Item 3</div></div>',
    styles: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '20px',
      margin: '20px 0',
    },
  },
  video: {
    type: 'video',
    content: '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0"></iframe>',
    styles: {
      width: '100%',
      aspectRatio: '16/9',
      borderRadius: '8px',
      margin: '20px 0',
    },
    config: {
      src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
  },
  custom: {
    type: 'custom',
    content: '<div>Custom HTML content</div>',
    styles: {
      padding: '20px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      margin: '16px 0',
    },
  },
};

export default function DragDropPageBuilder({ blocks, onChange, onContentUpdate }: DragDropPageBuilderProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<PageBlock | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addBlock = (type: string, position?: number) => {
    const template = BLOCK_TEMPLATES[type];
    if (!template) return;

    const newBlock: PageBlock = {
      id: generateId(),
      ...template,
    };

    const newBlocks = position !== undefined
      ? [...blocks.slice(0, position), newBlock, ...blocks.slice(position)]
      : [...blocks, newBlock];

    onChange(newBlocks);
    updateContent(newBlocks);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (id: string, updates: Partial<PageBlock>) => {
    const newBlocks = blocks.map(block =>
      block.id === id ? { ...block, ...updates } : block
    );
    onChange(newBlocks);
    updateContent(newBlocks);
  };

  const deleteBlock = (id: string) => {
    const newBlocks = blocks.filter(block => block.id !== id);
    onChange(newBlocks);
    updateContent(newBlocks);
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  };

  const duplicateBlock = (id: string) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return;

    const newBlock: PageBlock = {
      ...block,
      id: generateId(),
    };

    const index = blocks.findIndex(b => b.id === id);
    const newBlocks = [...blocks.slice(0, index + 1), newBlock, ...blocks.slice(index + 1)];
    onChange(newBlocks);
    updateContent(newBlocks);
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    onChange(newBlocks);
    updateContent(newBlocks);
  };

  const updateContent = (newBlocks: PageBlock[]) => {
    const htmlContent = newBlocks.map(block => {
      const styles = block.styles ? Object.entries(block.styles)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
        .join('; ') : '';
      
      const styledContent = styles
        ? block.content.replace(/>/g, ` style="${styles}">`)
        : block.content;
      
      return styledContent;
    }).join('\n');

    onContentUpdate(htmlContent);
  };

  const handleDragStart = (e: React.DragEvent, block: PageBlock, index: number) => {
    setDraggedBlock(block);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', block.id);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    const draggedId = e.dataTransfer.getData('text/html');
    const draggedIndex = blocks.findIndex(b => b.id === draggedId);

    if (draggedIndex !== -1 && draggedIndex !== targetIndex) {
      moveBlock(draggedIndex, targetIndex);
    }

    setDraggedBlock(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedBlock(null);
    setDragOverIndex(null);
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
      {/* Toolbar - Left Side */}
      <div className="lg:w-64 bg-white rounded-xl shadow-sm border border-gray-200 p-4 overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>🧩</span>
          Blocks
        </h3>
        <div className="space-y-2">
          {Object.keys(BLOCK_TEMPLATES).map(type => (
            <button
              key={type}
              onClick={() => addBlock(type)}
              className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-blue-50 hover:border-blue-300 border border-gray-200 rounded-lg transition-all flex items-center gap-3 group"
            >
              <div className="p-2 bg-white rounded group-hover:bg-blue-100 transition-colors">
                <span className="text-xl">
                  {type === 'heading' && '📝'}
                  {type === 'paragraph' && '📄'}
                  {type === 'image' && '🖼️'}
                  {type === 'button' && '🔘'}
                  {type === 'divider' && '➖'}
                  {type === 'spacer' && '⬜'}
                  {type === 'quote' && '💬'}
                  {type === 'list' && '📋'}
                  {type === 'grid' && '⊞'}
                  {type === 'video' && '🎥'}
                  {type === 'custom' && '⚡'}
                </span>
              </div>
              <div>
                <div className="font-medium text-gray-900 capitalize">{type}</div>
                <div className="text-xs text-gray-500">Drag or click to add</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Canvas - Center */}
      <div className="flex-1 bg-gray-50 rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>🎨</span>
              Page Builder
            </h3>
            <div className="text-sm text-gray-500">
              {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'}
            </div>
          </div>
        </div>

        <div
          ref={editorRef}
          className="flex-1 overflow-y-auto p-6 space-y-4"
          onDragOver={(e) => {
            e.preventDefault();
            if (draggedBlock) {
              setDragOverIndex(blocks.length);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedBlock) {
              const draggedIndex = blocks.findIndex(b => b.id === draggedBlock.id);
              if (draggedIndex !== -1) {
                moveBlock(draggedIndex, blocks.length);
              }
              setDraggedBlock(null);
              setDragOverIndex(null);
            }
          }}
        >
          {blocks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Start Building Your Page</h3>
              <p className="text-gray-600 mb-6">Drag blocks from the left sidebar or click to add them</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {Object.keys(BLOCK_TEMPLATES).slice(0, 5).map(type => (
                  <button
                    key={type}
                    onClick={() => addBlock(type)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors capitalize"
                  >
                    Add {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {blocks.map((block, index) => (
            <div
              key={block.id}
              draggable
              onDragStart={(e) => handleDragStart(e, block, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative p-4 bg-white rounded-xl border-2 transition-all ${
                selectedBlockId === block.id
                  ? 'border-blue-500 shadow-lg'
                  : dragOverIndex === index
                  ? 'border-green-500 border-dashed'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedBlockId(block.id)}
            >
              {/* Block Controls */}
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateBlock(block.id);
                  }}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  title="Duplicate"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBlock(block.id);
                  }}
                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Drag Handle */}
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>
              </div>

              {/* Block Preview */}
              <div
                className="block-preview"
                dangerouslySetInnerHTML={{ __html: block.content }}
                style={block.styles}
              />
            </div>
          ))}

          {dragOverIndex === blocks.length && (
            <div className="h-20 border-2 border-dashed border-green-500 rounded-xl bg-green-50 flex items-center justify-center">
              <span className="text-green-600 font-medium">Drop here</span>
            </div>
          )}
        </div>
      </div>

      {/* Properties Panel - Right Side */}
      {selectedBlock && (
        <div className="lg:w-80 bg-white rounded-xl shadow-sm border border-gray-200 p-4 overflow-y-auto">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>⚙️</span>
            Block Settings
          </h3>

          <div className="space-y-4">
            {/* Block Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Block Type
              </label>
              <div className="px-3 py-2 bg-gray-100 rounded-lg capitalize">
                {selectedBlock.type}
              </div>
            </div>

            {/* Content Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={selectedBlock.content}
                onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="HTML content..."
              />
            </div>

            {/* Style Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Styles (CSS)
              </label>
              <textarea
                value={selectedBlock.styles ? Object.entries(selectedBlock.styles)
                  .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
                  .join(';\n') : ''}
                onChange={(e) => {
                  const styles: { [key: string]: string } = {};
                  e.target.value.split(';').forEach(rule => {
                    const [key, value] = rule.split(':').map(s => s.trim());
                    if (key && value) {
                      const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
                      styles[camelKey] = value;
                    }
                  });
                  updateBlock(selectedBlock.id, { styles });
                }}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="fontSize: 1rem; color: #333;"
              />
            </div>

            {/* Quick Style Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Styles
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Small', fontSize: '0.875rem' },
                  { label: 'Medium', fontSize: '1rem' },
                  { label: 'Large', fontSize: '1.5rem' },
                  { label: 'XLarge', fontSize: '2rem' },
                ].map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => updateBlock(selectedBlock.id, {
                      styles: { ...selectedBlock.styles, fontSize: preset.fontSize },
                    })}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


import React, { useEffect, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import axios from '../../config/axios';
import ResourceDetailModal from './ResourceDetailModal';

interface Product {
  id: string;
  title: string;
  destination: string;
  category: string;
  coverImageUrl: string;
  netPrice: number;
  supplierName: string;
  productType: 'activity' | 'accommodation' | 'food' | 'transportation';
  description?: string;
  notes?: string;
  location?: {
    lat: number;
    lng: number;
  };
  timelineId?: string;
  startTime?: string;
  duration?: number;
}

interface ResourceLibraryProps {
  onProductHover?: (product: Product | null) => void;
  setAvailableProducts: (products: Product[]) => void;
  initialDestination?: string;
  startDate: Date | null;
  endDate: Date | null;
  onDateRangeChange: (start: Date | null, end: Date | null) => void;
}

const DraggableProduct = ({
  product,
  onHover,
  onPreview
}: {
  product: Product;
  onHover: (p: Product | null) => void;
  onPreview: (p: Product) => void;
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: product.id,
    data: { type: 'resource', product },
  });

  // Map category to Chinese labels
  const categoryLabels: Record<string, string> = {
    'landmark': '地標',
    'activity': '活動',
    'accommodation': '住宿',
    'food': '餐飲',
    'transportation': '交通'
  };

  const style = {
    zIndex: isDragging ? 1000 : 1,
    position: 'relative' as const,
    touchAction: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <div
        style={{
          marginBottom: '0.75rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1rem',
          boxShadow: isDragging
            ? '0 12px 24px rgba(0,0,0,0.15)'
            : '0 2px 4px rgba(0,0,0,0.04)',
          cursor: 'grab',
          border: '1px solid #f1f2f6',
          transition: 'all 0.2s',
          opacity: isDragging ? 0.8 : 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
        onMouseEnter={() => onHover(product)}
        onMouseLeave={() => onHover(null)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
          <h3
            style={{
              margin: 0,
              fontSize: '0.95rem',
              fontWeight: '600',
              color: '#2d3436',
              lineHeight: '1.4',
              flex: 1,
            }}
          >
            {product.title}
          </h3>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onPreview(product);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#b2bec3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'color 0.2s, background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#0984e3';
              e.currentTarget.style.backgroundColor = '#f1f2f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#b2bec3';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="預覽詳情"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{
              backgroundColor: '#f1f2f6',
              padding: '2px 8px',
              borderRadius: '4px',
              color: '#636e72',
              fontWeight: '500'
            }}>
              {categoryLabels[product.category] || product.category}
            </span>
            <span style={{ color: '#b2bec3' }}>|</span>
            <span style={{ color: '#636e72' }}>{product.supplierName}</span>
          </div>
          <span
            style={{
              fontWeight: '600',
              color: '#00b894',
            }}
          >
            NT${product.netPrice.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

const ResourceLibrary: React.FC<ResourceLibraryProps> = ({
  onProductHover,
  setAvailableProducts,
  initialDestination,
  startDate,
  endDate,
  onDateRangeChange
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialDestination || '');
  const [activeTab, setActiveTab] = useState<'all' | 'activity' | 'accommodation' | 'food' | 'transportation'>('all');
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/agency/tours');
        const mappedProducts = response.data.map((p: any) => {
          const categoryToType: Record<string, 'activity' | 'accommodation' | 'food' | 'transportation'> = {
            'landmark': 'activity',
            'activity': 'activity',
            'accommodation': 'accommodation',
            'food': 'food',
            'transportation': 'transportation'
          };

          return {
            ...p,
            productType: categoryToType[p.category] || 'activity',
            location: { lat: 25.0330 + (Math.random() - 0.5) * 0.1, lng: 121.5654 + (Math.random() - 0.5) * 0.1 },
          };
        });

        const filteredByDestination = initialDestination
          ? mappedProducts.filter((p: Product) =>
            p.destination.toLowerCase().includes(initialDestination.toLowerCase())
          )
          : mappedProducts;

        setProducts(filteredByDestination);
        setAvailableProducts(filteredByDestination);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [setAvailableProducts, initialDestination]);

  const filteredProducts = products.filter(product => {
    const title = product.title || '';
    const destination = product.destination || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeTab === 'all' || product.productType === activeTab;
    return matchesSearch && matchesType;
  });

  return (
    <div style={styles.container}>
      {initialDestination && (
        <div style={styles.destinationBanner}>
          <div style={styles.destinationIcon}>📍</div>
          <div style={styles.destinationInfo}>
            <div style={styles.destinationLabel}>目的地</div>
            <div style={styles.destinationName}>{initialDestination}</div>
          </div>
        </div>
      )}

      <div style={styles.dateRangeContainer}>
        <div style={styles.dateInputGroup}>
          <label style={styles.dateLabel}>開始日期</label>
          <input
            type="date"
            value={startDate ? startDate.toISOString().split('T')[0] : ''}
            onChange={(e) => {
              const date = e.target.value ? new Date(e.target.value) : null;
              onDateRangeChange(date, endDate);
            }}
            style={styles.dateInput}
          />
        </div>
        <div style={styles.dateInputGroup}>
          <label style={styles.dateLabel}>結束日期</label>
          <input
            type="date"
            value={endDate ? endDate.toISOString().split('T')[0] : ''}
            onChange={(e) => {
              const date = e.target.value ? new Date(e.target.value) : null;
              onDateRangeChange(startDate, date);
            }}
            style={styles.dateInput}
          />
        </div>
      </div>

      <div style={styles.header}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder={initialDestination ? `在 ${initialDestination} 搜尋資源...` : "搜尋資源..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.tabs}>
          {[
            { id: 'all', label: '全部' },
            { id: 'activity', label: '活動' },
            { id: 'accommodation', label: '住宿' },
            { id: 'food', label: '餐飲' },
            { id: 'transportation', label: '交通' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.activeTab : {}),
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.productList}>
        {loading && <p style={styles.message}>載入資源中...</p>}
        {!loading && filteredProducts.length === 0 && (
          <p style={styles.message}>找不到相關資源</p>
        )}
        <div style={{ padding: '1rem' }}>
          {!loading && filteredProducts.map((product) => (
            <DraggableProduct
              key={product.id}
              product={product}
              onHover={onProductHover || (() => { })}
              onPreview={setPreviewProduct}
            />
          ))}
        </div>
      </div>

      {previewProduct && (
        <ResourceDetailModal
          product={previewProduct}
          onClose={() => setPreviewProduct(null)}
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e0e0e0',
  },
  destinationBanner: {
    padding: '1rem 1.25rem',
    backgroundColor: '#f0f7ff',
    borderBottom: '2px solid #3b82f6',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  destinationIcon: {
    fontSize: '1.5rem',
    lineHeight: 1,
  },
  destinationInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.125rem',
  },
  destinationLabel: {
    fontSize: '0.7rem',
    fontWeight: '500',
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  destinationName: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#1e40af',
  },
  dateRangeContainer: {
    padding: '1rem',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    gap: '1rem',
    backgroundColor: '#fff',
  },
  dateInputGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  dateLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: '500',
  },
  dateInput: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '6px',
    border: '1px solid #dfe6e9',
    fontSize: '0.9rem',
    outline: 'none',
    color: '#2d3436',
  },
  header: {
    padding: '1rem',
    borderBottom: '1px solid #f0f0f0',
    backgroundColor: '#fff',
  },
  searchContainer: {
    marginBottom: '1rem',
  },
  searchInput: {
    width: '100%',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: '1px solid #dfe6e9',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
  },
  tabs: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
    paddingBottom: '0.5rem',
  },
  tab: {
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    border: '1px solid #dfe6e9',
    backgroundColor: 'transparent',
    fontSize: '0.85rem',
    color: '#636e72',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.2s',
  },
  activeTab: {
    backgroundColor: '#2d3436',
    color: 'white',
    borderColor: '#2d3436',
  },
  productList: {
    flex: 1,
    overflowY: 'auto' as const,
    backgroundColor: '#f8f9fa',
  },
  message: {
    textAlign: 'center' as const,
    padding: '2rem',
    color: '#b2bec3',
  },
};

export default ResourceLibrary;

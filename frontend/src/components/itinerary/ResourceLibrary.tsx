import React, { useEffect, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import axios from '../../config/axios';

interface Product {
  id: string;
  title: string;
  destination: string;
  durationDays: number;
  coverImageUrl: string;
  netPrice: number;
  supplierName: string;
  productType: 'activity' | 'accommodation' | 'food' | 'transportation';
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
}

const DraggableProduct = ({ product, onHover }: { product: Product; onHover: (p: Product | null) => void }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: product.id,
    data: { type: 'resource', product },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
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
          marginBottom: '1rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: isDragging
            ? '0 12px 24px rgba(0,0,0,0.15)'
            : '0 2px 8px rgba(0,0,0,0.06)',
          cursor: 'grab',
          border: '1px solid #f1f2f6',
          transition: 'transform 0.2s, box-shadow 0.2s',
          opacity: isDragging ? 0.8 : 1,
        }}
        onMouseEnter={() => onHover(product)}
        onMouseLeave={() => onHover(null)}
      >
        <div style={{ position: 'relative', height: '140px' }}>
          <img
            src={product.coverImageUrl}
            alt={product.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              backgroundColor: 'rgba(255,255,255,0.9)',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#2d3436',
            }}
          >
            {product.productType}
          </div>
        </div>
        <div style={{ padding: '1rem' }}>
          <h3
            style={{
              margin: '0 0 0.5rem 0',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#2d3436',
            }}
          >
            {product.title}
          </h3>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '0.85rem',
                color: '#636e72',
              }}
            >
              供應商 : {product.supplierName}
            </span>
            <span
              style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#00b894',
              }}
            >
              NT${product.netPrice.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ResourceLibrary: React.FC<ResourceLibraryProps> = ({ onProductHover, setAvailableProducts }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'activity' | 'accommodation' | 'food' | 'transportation'>('all');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/products');
        setProducts(response.data);
        setAvailableProducts(response.data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [setAvailableProducts]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeTab === 'all' || product.productType === activeTab;
    return matchesSearch && matchesType;
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Resource Library</h2>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.tabs}>
          {(['all', 'activity', 'accommodation', 'food', 'transportation'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.tab,
                ...(activeTab === tab ? styles.activeTab : {}),
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.productList}>
        {loading && <p style={styles.message}>Loading resources...</p>}
        {!loading && filteredProducts.length === 0 && (
          <p style={styles.message}>No resources found</p>
        )}
        <div style={{ padding: '1rem' }}>
          {!loading && filteredProducts.map((product) => (
            <DraggableProduct
              key={product.id}
              product={product}
              onHover={onProductHover || (() => { })}
            />
          ))}
        </div>
      </div>
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
  header: {
    padding: '1.5rem',
    borderBottom: '1px solid #f0f0f0',
    backgroundColor: '#fff',
  },
  title: {
    margin: '0 0 1rem 0',
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#2d3436',
  },
  searchContainer: {
    marginBottom: '1rem',
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid #dfe6e9',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    overflowX: 'auto' as const,
    paddingBottom: '0.5rem',
    scrollbarWidth: 'none' as const,
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
  activeTabStyle: {
    backgroundColor: '#2d3436',
    color: 'white',
    borderColor: '#2d3436',
  }
};

export default ResourceLibrary;

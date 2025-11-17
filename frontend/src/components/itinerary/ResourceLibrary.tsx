import React, { useEffect, useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import axios from '../../config/axios';

interface Product {
  id: string;
  title: string;
  destination: string;
  durationDays: number;
  coverImageUrl: string;
  netPrice: number;
  supplierName: string;
  productType: 'activity' | 'accommodation';
  location?: {
    lat: number;
    lng: number;
  };
}

interface ResourceLibraryProps {
  onProductHover?: (product: Product | null) => void;
}

const ResourceLibrary: React.FC<ResourceLibraryProps> = ({ onProductHover }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'activity' | 'accommodation'>('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/agency/tours');
      // Map products and add productType (for now, we'll default to 'activity')
      const productsWithType = response.data.map((p: any) => ({
        ...p,
        productType: p.productType || 'activity',
      }));
      setProducts(productsWithType);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || product.productType === typeFilter;
    return matchesSearch && matchesType;
  });

  const formatPrice = (price: number) => {
    return `NT$${price.toLocaleString('zh-TW')}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.searchSection}>
        <input
          type="text"
          placeholder="搜尋產品..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <div style={styles.filterButtons}>
          <button
            style={{
              ...styles.filterButton,
              ...(typeFilter === 'all' ? styles.filterButtonActive : {}),
            }}
            onClick={() => setTypeFilter('all')}
          >
            全部
          </button>
          <button
            style={{
              ...styles.filterButton,
              ...(typeFilter === 'activity' ? styles.filterButtonActive : {}),
            }}
            onClick={() => setTypeFilter('activity')}
          >
            活動
          </button>
          <button
            style={{
              ...styles.filterButton,
              ...(typeFilter === 'accommodation' ? styles.filterButtonActive : {}),
            }}
            onClick={() => setTypeFilter('accommodation')}
          >
            住宿
          </button>
        </div>
      </div>

      <div style={styles.productList}>
        {loading && <p style={styles.message}>載入中...</p>}
        {!loading && filteredProducts.length === 0 && (
          <p style={styles.message}>找不到符合條件的產品</p>
        )}
        {!loading && filteredProducts.map((product, index) => (
          <Draggable key={product.id} draggableId={product.id} index={index}>
            {(provided: any, snapshot: any) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                style={{
                  ...styles.productCard,
                  ...provided.draggableProps.style,
                  ...(snapshot.isDragging ? styles.productCardDragging : {}),
                }}
                onMouseEnter={() => onProductHover?.(product)}
                onMouseLeave={() => onProductHover?.(null)}
              >
                <img
                  src={product.coverImageUrl}
                  alt={product.title}
                  style={styles.productImage}
                />
                <div style={styles.productInfo}>
                  <h4 style={styles.productTitle}>{product.title}</h4>
                  <p style={styles.productDetail}>
                    <span style={styles.icon}>
                      {product.productType === 'accommodation' ? '🏨' : '🎯'}
                    </span>
                    {product.productType === 'accommodation' ? '住宿' : '活動'}
                  </p>
                  <p style={styles.productDetail}>供應商：{product.supplierName}</p>
                  <p style={styles.productPrice}>{formatPrice(product.netPrice)}</p>
                </div>
              </div>
            )}
          </Draggable>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
  },
  searchSection: {
    padding: '0.5rem 0',
    borderBottom: '1px solid #e0e0e0',
    marginBottom: '1rem',
  },
  searchInput: {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.9rem',
    marginBottom: '0.5rem',
  },
  filterButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  filterButton: {
    flex: 1,
    padding: '0.4rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '0.85rem',
    transition: 'all 0.2s',
  },
  filterButtonActive: {
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff',
  },
  productList: {
    flex: 1,
    overflow: 'auto',
  },
  message: {
    textAlign: 'center' as const,
    color: '#999',
    padding: '2rem 1rem',
    fontSize: '0.9rem',
  },
  productCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    marginBottom: '0.75rem',
    overflow: 'hidden',
    cursor: 'grab',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: '1px solid #e0e0e0',
  },
  productCardDragging: {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    transform: 'rotate(2deg)',
  },
  productImage: {
    width: '100%',
    height: '100px',
    objectFit: 'cover' as const,
  },
  productInfo: {
    padding: '0.75rem',
  },
  productTitle: {
    fontSize: '0.95rem',
    fontWeight: 'bold',
    margin: '0 0 0.5rem 0',
    color: '#333',
  },
  productDetail: {
    fontSize: '0.8rem',
    color: '#666',
    margin: '0.25rem 0',
  },
  icon: {
    marginRight: '0.25rem',
  },
  productPrice: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#28a745',
    marginTop: '0.5rem',
  },
};

export default ResourceLibrary;

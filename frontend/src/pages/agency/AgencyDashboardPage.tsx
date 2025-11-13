import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface Product {
  id: string;
  title: string;
  destination: string;
  durationDays: number;
  coverImageUrl: string;
  netPrice: number;
  supplierName: string;
}

const AgencyDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [destinationFilter, setDestinationFilter] = useState('');
  const [durationFilter, setDurationFilter] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [destinationFilter, durationFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (destinationFilter) {
        params.append('destination', destinationFilter);
      }
      if (durationFilter) {
        params.append('durationDays', durationFilter);
      }

      const response = await axios.get(`/api/agency/tours?${params.toString()}`);
      setProducts(response.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('無法載入產品列表');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `NT$${price.toLocaleString('zh-TW')}`;
  };

  const handleCardClick = (productId: string) => {
    navigate(`/agency/tours/${productId}`);
  };

  const getUniqueDestinations = () => {
    const destinations = new Set(products.map(p => p.destination));
    return Array.from(destinations).sort();
  };

  const getUniqueDurations = () => {
    const durations = new Set(products.map(p => p.durationDays));
    return Array.from(durations).sort((a, b) => a - b);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>旅行社控制台</h1>
        <div style={styles.userInfo}>
          <span>{user?.name} ({user?.role})</span>
          <button onClick={logout} style={styles.logoutButton}>
            登出
          </button>
        </div>
      </header>
      <main style={styles.main}>
        <div style={styles.filterSection}>
          <h2>產品搜尋</h2>
          <div style={styles.filters}>
            <div style={styles.filterGroup}>
              <label htmlFor="destination">目的地：</label>
              <select
                id="destination"
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
                style={styles.select}
              >
                <option value="">全部</option>
                {getUniqueDestinations().map(dest => (
                  <option key={dest} value={dest}>{dest}</option>
                ))}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label htmlFor="duration">天數：</label>
              <select
                id="duration"
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                style={styles.select}
              >
                <option value="">全部</option>
                {getUniqueDurations().map(days => (
                  <option key={days} value={days}>{days}天</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading && <p style={styles.message}>載入中...</p>}
        {error && <p style={styles.errorMessage}>{error}</p>}
        
        {!loading && !error && products.length === 0 && (
          <p style={styles.message}>找不到符合條件的產品</p>
        )}

        {!loading && !error && products.length > 0 && (
          <div style={styles.grid}>
            {products.map((product) => (
              <div
                key={product.id}
                style={styles.card}
                onClick={() => handleCardClick(product.id)}
              >
                <img
                  src={product.coverImageUrl}
                  alt={product.title}
                  style={styles.cardImage}
                />
                <div style={styles.cardContent}>
                  <h3 style={styles.cardTitle}>{product.title}</h3>
                  <p style={styles.cardInfo}>天數：{product.durationDays}天</p>
                  <p style={styles.cardInfo}>供應商：{product.supplierName}</p>
                  <p style={styles.cardPrice}>{formatPrice(product.netPrice)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: '1rem 2rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  main: {
    padding: '2rem',
  },
  filterSection: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  filters: {
    display: 'flex',
    gap: '2rem',
    marginTop: '1rem',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  select: {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '1rem',
  },
  message: {
    textAlign: 'center' as const,
    padding: '2rem',
    fontSize: '1.1rem',
    color: '#666',
  },
  errorMessage: {
    textAlign: 'center' as const,
    padding: '2rem',
    fontSize: '1.1rem',
    color: '#dc3545',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '2rem',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover' as const,
  },
  cardContent: {
    padding: '1rem',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    color: '#333',
  },
  cardInfo: {
    fontSize: '0.9rem',
    color: '#666',
    marginBottom: '0.25rem',
  },
  cardPrice: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#28a745',
    marginTop: '0.5rem',
  },
};

export default AgencyDashboardPage;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../config/axios';
import { useAuth } from '../../contexts/AuthContext';

interface ProductDetail {
  id: string;
  title: string;
  destination: string;
  durationDays: number;
  description: string;
  coverImageUrl: string;
  netPrice: number;
  supplierName: string;
}

const AgencyTourDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductDetail();
  }, [id]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/agency/tours/${id}`);
      setProduct(response.data);
    } catch (err) {
      console.error('Failed to fetch product detail:', err);
      setError('無法載入產品詳情');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `NT$${price.toLocaleString('zh-TW')}`;
  };

  const handleBack = () => {
    navigate('/agency/dashboard');
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
        <button onClick={handleBack} style={styles.backButton}>
          ← 返回產品列表
        </button>

        {loading && <p style={styles.message}>載入中...</p>}
        {error && <p style={styles.errorMessage}>{error}</p>}

        {!loading && !error && product && (
          <div style={styles.detailCard}>
            <img
              src={product.coverImageUrl}
              alt={product.title}
              style={styles.coverImage}
            />
            <div style={styles.content}>
              <h2 style={styles.title}>{product.title}</h2>
              
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>目的地：</span>
                  <span style={styles.infoValue}>{product.destination}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>天數：</span>
                  <span style={styles.infoValue}>{product.durationDays}天</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>供應商：</span>
                  <span style={styles.infoValue}>{product.supplierName}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>淨價：</span>
                  <span style={styles.priceValue}>{formatPrice(product.netPrice)}</span>
                </div>
              </div>

              <div style={styles.descriptionSection}>
                <h3 style={styles.sectionTitle}>產品描述</h3>
                <div
                  style={styles.description}
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            </div>
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
    maxWidth: '1200px',
    margin: '0 auto',
  },
  backButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '1.5rem',
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
  detailCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  coverImage: {
    width: '100%',
    maxHeight: '500px',
    objectFit: 'cover' as const,
  },
  content: {
    padding: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: '#333',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  infoLabel: {
    fontSize: '0.9rem',
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: '1.1rem',
    color: '#333',
  },
  priceValue: {
    fontSize: '1.5rem',
    color: '#28a745',
    fontWeight: 'bold',
  },
  descriptionSection: {
    marginTop: '2rem',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#333',
  },
  description: {
    fontSize: '1rem',
    lineHeight: '1.6',
    color: '#555',
  },
};

export default AgencyTourDetailPage;

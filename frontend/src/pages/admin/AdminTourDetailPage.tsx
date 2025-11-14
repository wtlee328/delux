import React, { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

interface ProductDetail {
  id: string;
  title: string;
  destination: string;
  durationDays: number;
  description: string;
  coverImageUrl: string;
  netPrice: number;
  status: 'pending' | 'published';
  supplierName: string;
  createdAt: string;
}

const AdminTourDetailPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/admin/tours/${id}`);
      setProduct(response.data);
    } catch (err: any) {
      setError('無法載入產品詳情');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'pending' | 'published') => {
    if (!product) return;

    try {
      setUpdating(true);
      setError(null);
      await axios.put(`/api/admin/tours/${id}/status`, { status: newStatus });
      
      // Update local state
      setProduct({ ...product, status: newStatus });
      setUpdateSuccess(true);
      
      // Hide success message after 2 seconds
      setTimeout(() => setUpdateSuccess(false), 2000);
    } catch (err: any) {
      setError('更新狀態失敗');
      console.error('Error updating status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusLabel = (status: string) => {
    return status === 'pending' ? '待審核' : '已發佈';
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '帝樂 Admin';
      case 'supplier':
        return '當地供應商';
      case 'agency':
        return '台灣旅行社';
      default:
        return role;
    }
  };

  const formatPrice = (price: number) => {
    return `NT$${price.toLocaleString('zh-TW')}`;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <h1>產品詳情</h1>
          <div style={styles.userInfo}>
            <span>{user?.name} ({getRoleLabel(user?.role || '')})</span>
            <button onClick={logout} style={styles.logoutButton}>
              登出
            </button>
          </div>
        </header>
        <main style={styles.main}>
          <p>載入中...</p>
        </main>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <h1>產品詳情</h1>
          <div style={styles.userInfo}>
            <span>{user?.name} ({getRoleLabel(user?.role || '')})</span>
            <button onClick={logout} style={styles.logoutButton}>
              登出
            </button>
          </div>
        </header>
        <main style={styles.main}>
          <div style={styles.error}>{error}</div>
          <button onClick={() => navigate('/admin/tours')} style={styles.backButton}>
            返回產品列表
          </button>
        </main>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>產品詳情</h1>
        <div style={styles.userInfo}>
          <span>{user?.name} ({getRoleLabel(user?.role || '')})</span>
          <button onClick={logout} style={styles.logoutButton}>
            登出
          </button>
        </div>
      </header>
      <main style={styles.main}>
        <button onClick={() => navigate('/admin/tours')} style={styles.backButton}>
          ← 返回產品列表
        </button>

        {error && <div style={styles.error}>{error}</div>}
        {updateSuccess && <div style={styles.success}>狀態更新成功</div>}

        <div style={styles.detailContainer}>
          <div style={styles.imageSection}>
            <img 
              src={product.coverImageUrl} 
              alt={product.title}
              style={styles.coverImage}
            />
          </div>

          <div style={styles.infoSection}>
            <h2 style={styles.title}>{product.title}</h2>
            
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>供應商：</span>
                <span style={styles.infoValue}>{product.supplierName}</span>
              </div>

              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>目的地：</span>
                <span style={styles.infoValue}>{product.destination}</span>
              </div>

              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>天數：</span>
                <span style={styles.infoValue}>{product.durationDays} 天</span>
              </div>

              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>淨價：</span>
                <span style={styles.infoValue}>{formatPrice(product.netPrice)}</span>
              </div>

              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>狀態：</span>
                <span style={styles.infoValue}>{getStatusLabel(product.status)}</span>
              </div>
            </div>

            <div style={styles.statusSection}>
              <h3 style={styles.sectionTitle}>更新狀態</h3>
              <div style={styles.statusButtons}>
                <button
                  onClick={() => handleStatusChange('pending')}
                  disabled={updating || product.status === 'pending'}
                  style={
                    product.status === 'pending'
                      ? { ...styles.statusButton, ...styles.statusButtonActive }
                      : styles.statusButton
                  }
                >
                  待審核
                </button>
                <button
                  onClick={() => handleStatusChange('published')}
                  disabled={updating || product.status === 'published'}
                  style={
                    product.status === 'published'
                      ? { ...styles.statusButton, ...styles.statusButtonActive }
                      : styles.statusButton
                  }
                >
                  已發佈
                </button>
              </div>
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
  },
  error: {
    padding: '1rem',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  success: {
    padding: '1rem',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  detailContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  imageSection: {
    width: '100%',
    height: '400px',
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  infoSection: {
    padding: '2rem',
    borderBottom: '1px solid #dee2e6',
  },
  title: {
    marginTop: 0,
    marginBottom: '1.5rem',
    fontSize: '2rem',
    color: '#212529',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  infoLabel: {
    fontSize: '0.875rem',
    color: '#6c757d',
    fontWeight: 500,
  },
  infoValue: {
    fontSize: '1rem',
    color: '#212529',
  },
  statusSection: {
    marginTop: '2rem',
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: '1rem',
    fontSize: '1.25rem',
    color: '#212529',
  },
  statusButtons: {
    display: 'flex',
    gap: '1rem',
  },
  statusButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#e9ecef',
    color: '#495057',
    border: '2px solid #dee2e6',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  statusButtonActive: {
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff',
    cursor: 'default',
  },
  descriptionSection: {
    padding: '2rem',
  },
  description: {
    lineHeight: 1.6,
    color: '#212529',
  },
};

export default AdminTourDetailPage;

import React, { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

type ProductStatus = '草稿' | '待審核' | '已發佈' | '需要修改';

interface Product {
  id: string;
  title: string;
  supplierName: string;
  status: ProductStatus;
  createdAt: string;
}

const AdminToursPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchPendingCount();
  }, [showPendingOnly]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const endpoint = showPendingOnly ? '/api/admin/tours/pending' : '/api/admin/tours';
      const response = await axios.get(endpoint);
      setProducts(response.data);
    } catch (err: any) {
      setError('無法載入產品列表');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const response = await axios.get('/api/admin/tours/pending/count');
      setPendingCount(response.data.count);
    } catch (err: any) {
      console.error('Error fetching pending count:', err);
    }
  };

  const getStatusStyle = (status: ProductStatus) => {
    const statusConfig = {
      '草稿': { bg: '#6c757d', color: 'white' },
      '待審核': { bg: '#ffc107', color: '#000' },
      '已發佈': { bg: '#28a745', color: 'white' },
      '需要修改': { bg: '#dc3545', color: 'white' },
    };
    
    const config = statusConfig[status] || statusConfig['草稿'];
    
    return {
      ...styles.statusBadge,
      backgroundColor: config.bg,
      color: config.color,
    };
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

  const handleProductClick = (productId: string) => {
    navigate(`/admin/tours/${productId}`);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1>產品管理</h1>
          <nav style={styles.nav}>
            <button onClick={() => navigate('/admin/users')} style={styles.navLink}>用戶管理</button>
            <button onClick={() => navigate('/admin/tours')} style={styles.navLink}>產品管理</button>
          </nav>
        </div>
        <div style={styles.userInfo}>
          <span>{user?.name} ({getRoleLabel(user?.role || '')})</span>
          <button onClick={logout} style={styles.logoutButton}>
            登出
          </button>
        </div>
      </header>
      <main style={styles.main}>
        <div style={styles.actionBar}>
          <h2>產品列表</h2>
          <div style={styles.filterButtons}>
            <button
              onClick={() => setShowPendingOnly(false)}
              style={{
                ...styles.filterButton,
                ...(showPendingOnly ? {} : styles.filterButtonActive),
              }}
            >
              全部產品
            </button>
            <button
              onClick={() => setShowPendingOnly(true)}
              style={{
                ...styles.filterButton,
                ...(showPendingOnly ? styles.filterButtonActive : {}),
              }}
            >
              待審核 {pendingCount > 0 && <span style={styles.badge}>{pendingCount}</span>}
            </button>
          </div>
        </div>

        {loading && <p>載入中...</p>}
        {error && <div style={styles.error}>{error}</div>}
        {!loading && !error && (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>產品標題</th>
                  <th style={styles.th}>供應商名稱</th>
                  <th style={styles.th}>狀態</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr 
                    key={product.id} 
                    style={styles.tr}
                    onClick={() => handleProductClick(product.id)}
                  >
                    <td style={styles.td}>{product.title}</td>
                    <td style={styles.td}>{product.supplierName}</td>
                    <td style={styles.td}>
                      <span style={getStatusStyle(product.status)}>
                        {product.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && (
              <p style={styles.emptyMessage}>尚無產品</p>
            )}
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
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  },
  nav: {
    display: 'flex',
    gap: '1rem',
  },
  navLink: {
    padding: '0.5rem 1rem',
    textDecoration: 'none',
    color: '#495057',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
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
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  filterButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  filterButton: {
    padding: '0.5rem 1rem',
    backgroundColor: 'white',
    color: '#495057',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  filterButtonActive: {
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff',
  },
  badge: {
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '0.125rem 0.5rem',
    borderRadius: '10px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  error: {
    padding: '1rem',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    padding: '1rem',
    textAlign: 'left' as const,
    backgroundColor: '#f8f9fa',
    fontWeight: 600,
    borderBottom: '2px solid #dee2e6',
  },
  tr: {
    borderBottom: '1px solid #dee2e6',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '1rem',
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: 'bold',
    display: 'inline-block',
  },
  emptyMessage: {
    padding: '2rem',
    textAlign: 'center' as const,
    color: '#6c757d',
  },
};

export default AdminToursPage;

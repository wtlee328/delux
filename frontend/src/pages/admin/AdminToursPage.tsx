import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  title: string;
  supplierName: string;
  status: 'pending' | 'published';
  createdAt: string;
}

const AdminToursPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/admin/tours');
      setProducts(response.data);
    } catch (err: any) {
      setError('無法載入產品列表');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    return status === 'pending' ? '待審核' : '已發佈';
  };

  const getStatusStyle = (status: string) => {
    return status === 'pending' 
      ? { ...styles.statusBadge, ...styles.statusPending }
      : { ...styles.statusBadge, ...styles.statusPublished };
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
            <a href="/admin/users" style={styles.navLink}>用戶管理</a>
            <a href="/admin/tours" style={styles.navLink}>產品管理</a>
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
                        {getStatusLabel(product.status)}
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
    fontWeight: 500,
    display: 'inline-block',
  },
  statusPending: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  statusPublished: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  emptyMessage: {
    padding: '2rem',
    textAlign: 'center' as const,
    color: '#6c757d',
  },
};

export default AdminToursPage;

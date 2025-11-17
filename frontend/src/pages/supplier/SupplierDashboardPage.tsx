import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from '../../config/axios';

type ProductStatus = '草稿' | '待審核' | '已發佈' | '需要修改';

interface Product {
  id: string;
  title: string;
  status: ProductStatus;
  createdAt: string;
}

const SupplierDashboardPage: React.FC = () => {
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
      const response = await axios.get('/api/supplier/tours');
      setProducts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || '載入產品失敗');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ProductStatus) => {
    const statusConfig = {
      '草稿': { bg: '#6c757d', color: 'white' },
      '待審核': { bg: '#ffc107', color: '#000' },
      '已發佈': { bg: '#28a745', color: 'white' },
      '需要修改': { bg: '#dc3545', color: 'white' },
    };
    
    const config = statusConfig[status] || statusConfig['草稿'];
    
    return (
      <span
        style={{
          ...styles.statusBadge,
          backgroundColor: config.bg,
          color: config.color,
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>供應商控制台</h1>
        <div style={styles.userInfo}>
          <span>{user?.name} ({user?.role})</span>
          <button onClick={logout} style={styles.logoutButton}>
            登出
          </button>
        </div>
      </header>
      <main style={styles.main}>
        <div style={styles.actionBar}>
          <h2>我的產品</h2>
          <button
            onClick={() => navigate('/supplier/tours/new')}
            style={styles.createButton}
          >
            + 新增產品
          </button>
        </div>

        {loading && <p>載入中...</p>}
        
        {error && (
          <div style={styles.errorAlert}>{error}</div>
        )}

        {!loading && !error && products.length === 0 && (
          <div style={styles.emptyState}>
            <p>尚無產品</p>
            <button
              onClick={() => navigate('/supplier/tours/new')}
              style={styles.createButton}
            >
              建立第一個產品
            </button>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>產品標題</th>
                  <th style={styles.th}>狀態</th>
                  <th style={styles.th}>建立日期</th>
                  <th style={styles.th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} style={styles.tr}>
                    <td style={styles.td}>{product.title}</td>
                    <td style={styles.td}>{getStatusBadge(product.status)}</td>
                    <td style={styles.td}>
                      {new Date(product.createdAt).toLocaleDateString('zh-TW')}
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => navigate(`/supplier/tours/edit/${product.id}`)}
                        style={styles.editButton}
                      >
                        編輯
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  createButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  errorAlert: {
    padding: '1rem',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
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
    borderBottom: '2px solid #dee2e6',
    fontWeight: 'bold',
  },
  tr: {
    borderBottom: '1px solid #dee2e6',
  },
  td: {
    padding: '1rem',
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    display: 'inline-block',
  },
  editButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default SupplierDashboardPage;

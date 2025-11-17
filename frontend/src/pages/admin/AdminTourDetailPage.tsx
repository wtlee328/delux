import React, { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

type ProductStatus = '草稿' | '待審核' | '已發佈' | '需要修改';

interface ProductDetail {
  id: string;
  title: string;
  destination: string;
  durationDays: number;
  description: string;
  coverImageUrl: string;
  netPrice: number;
  status: ProductStatus;
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
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');

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

  const handleApprove = async () => {
    if (!product) return;

    try {
      setUpdating(true);
      setError(null);
      await axios.put(`/api/admin/tours/${id}/status`, { status: '已發佈' });
      
      // Update local state
      setProduct({ ...product, status: '已發佈' });
      setUpdateSuccess(true);
      
      // Hide success message after 2 seconds
      setTimeout(() => setUpdateSuccess(false), 2000);
    } catch (err: any) {
      setError('核准失敗');
      console.error('Error approving product:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestRevisions = () => {
    setShowRevisionModal(true);
  };

  const handleSubmitRevisionRequest = async () => {
    if (!product) return;
    
    if (!revisionFeedback.trim()) {
      setError('請輸入修改意見');
      return;
    }

    try {
      setUpdating(true);
      setError(null);
      await axios.put(`/api/admin/tours/${id}/status`, { 
        status: '需要修改',
        feedback: revisionFeedback 
      });
      
      // Update local state
      setProduct({ ...product, status: '需要修改' });
      setUpdateSuccess(true);
      setShowRevisionModal(false);
      setRevisionFeedback('');
      
      // Hide success message after 2 seconds
      setTimeout(() => setUpdateSuccess(false), 2000);
    } catch (err: any) {
      setError('提交修改要求失敗');
      console.error('Error requesting revisions:', err);
    } finally {
      setUpdating(false);
    }
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
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: product.status === '草稿' ? '#6c757d' :
                                  product.status === '待審核' ? '#ffc107' :
                                  product.status === '已發佈' ? '#28a745' : '#dc3545',
                  color: product.status === '待審核' ? '#000' : 'white',
                }}>
                  {product.status}
                </span>
              </div>
            </div>

            {product.status === '待審核' && (
              <div style={styles.reviewSection}>
                <h3 style={styles.sectionTitle}>審核操作</h3>
                <p style={styles.reviewHint}>此產品正在等待審核</p>
                <div style={styles.reviewButtons}>
                  <button
                    onClick={handleApprove}
                    disabled={updating}
                    style={styles.approveButton}
                  >
                    {updating ? '處理中...' : '核准發佈'}
                  </button>
                  <button
                    onClick={handleRequestRevisions}
                    disabled={updating}
                    style={styles.revisionButton}
                  >
                    要求修改
                  </button>
                </div>
              </div>
            )}

            {product.status === '已發佈' && (
              <div style={styles.statusInfo}>
                <p style={styles.statusInfoText}>✓ 此產品已發佈，對旅行社可見</p>
              </div>
            )}

            {product.status === '需要修改' && (
              <div style={styles.statusInfo}>
                <p style={styles.statusInfoText}>此產品需要供應商修改</p>
              </div>
            )}

            {product.status === '草稿' && (
              <div style={styles.statusInfo}>
                <p style={styles.statusInfoText}>此產品為草稿狀態，尚未提交審核</p>
              </div>
            )}
          </div>

          <div style={styles.descriptionSection}>
            <h3 style={styles.sectionTitle}>產品描述</h3>
            <div 
              style={styles.description}
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        </div>

        {showRevisionModal && (
          <div style={styles.modalOverlay} onClick={() => setShowRevisionModal(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3 style={styles.modalTitle}>要求修改</h3>
              <p style={styles.modalHint}>請輸入需要供應商修改的內容：</p>
              <textarea
                value={revisionFeedback}
                onChange={(e) => setRevisionFeedback(e.target.value)}
                style={styles.textarea}
                placeholder="請詳細說明需要修改的地方..."
                rows={5}
              />
              <div style={styles.modalButtons}>
                <button
                  onClick={() => {
                    setShowRevisionModal(false);
                    setRevisionFeedback('');
                  }}
                  style={styles.modalCancelButton}
                  disabled={updating}
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitRevisionRequest}
                  style={styles.modalSubmitButton}
                  disabled={updating || !revisionFeedback.trim()}
                >
                  {updating ? '提交中...' : '提交'}
                </button>
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
  sectionTitle: {
    marginTop: 0,
    marginBottom: '1rem',
    fontSize: '1.25rem',
    color: '#212529',
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: 'bold',
    display: 'inline-block',
  },
  reviewSection: {
    marginTop: '2rem',
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  reviewHint: {
    marginBottom: '1rem',
    color: '#6c757d',
  },
  reviewButtons: {
    display: 'flex',
    gap: '1rem',
  },
  approveButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 500,
  },
  revisionButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 500,
  },
  statusInfo: {
    marginTop: '2rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  statusInfoText: {
    margin: 0,
    color: '#6c757d',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    marginTop: 0,
    marginBottom: '1rem',
    fontSize: '1.5rem',
    color: '#212529',
  },
  modalHint: {
    marginBottom: '1rem',
    color: '#6c757d',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    marginBottom: '1rem',
  },
  modalButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  modalSubmitButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
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

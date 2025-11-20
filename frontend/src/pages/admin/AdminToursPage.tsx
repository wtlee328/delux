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
      '草稿': 'bg-slate-500 text-white',
      '待審核': 'bg-amber-400 text-black',
      '已發佈': 'bg-green-500 text-white',
      '需要修改': 'bg-red-500 text-white',
    };

    const classes = statusConfig[status] || statusConfig['草稿'];

    return `px-3 py-1 rounded-full text-sm font-bold inline-block ${classes}`;
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

  const handleDeleteProduct = async (productId: string, productTitle: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click navigation

    const confirmMessage = `⚠️ 警告：刪除產品\n\n您即將刪除產品：\n標題：${productTitle}\n\n此操作將永久刪除該產品及相關數據，且無法撤銷。\n\n確定要繼續嗎？`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await axios.delete(`/api/admin/tours/${productId}`);
      // Refresh the product list
      await fetchProducts();
      await fetchPendingCount();
    } catch (err: any) {
      setError('刪除產品失敗，請稍後再試');
      console.error('Error deleting product:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white px-8 py-4 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold text-slate-800">產品管理</h1>
          <nav className="flex gap-4">
            <button onClick={() => navigate('/admin/users')} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium">用戶管理</button>
            <button onClick={() => navigate('/admin/tours')} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium">產品管理</button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-600 font-medium">{user?.name} ({getRoleLabel(user?.role || '')})</span>
          <button onClick={logout} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium">
            登出
          </button>
        </div>
      </header>
      <main className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">產品列表</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPendingOnly(false)}
              className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 font-medium ${!showPendingOnly ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              全部產品
            </button>
            <button
              onClick={() => setShowPendingOnly(true)}
              className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 font-medium ${showPendingOnly ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              待審核 {pendingCount > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">{pendingCount}</span>}
            </button>
          </div>
        </div>

        {loading && <p className="text-center text-slate-500 py-8">載入中...</p>}
        {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4 border border-red-200">{error}</div>}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 text-sm">產品標題</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 text-sm">供應商名稱</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 text-sm">狀態</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 text-sm">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <td className="px-6 py-4 text-slate-700 font-medium">{product.title}</td>
                    <td className="px-6 py-4 text-slate-600">{product.supplierName}</td>
                    <td className="px-6 py-4">
                      <span className={getStatusStyle(product.status)}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => handleDeleteProduct(product.id, product.title, e)}
                        className="px-3 py-1.5 bg-white border border-red-200 hover:border-red-300 text-red-600 hover:bg-red-50 text-sm rounded-md transition-colors font-medium"
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && (
              <p className="p-8 text-center text-slate-500">尚無產品</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminToursPage;

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

  const handleDeleteProduct = async (productId: string, productTitle: string) => {
    const confirmMessage = `⚠️ 警告：刪除產品\n\n您即將刪除產品：\n標題：${productTitle}\n\n此操作將永久刪除該產品及相關數據，且無法撤銷。\n\n確定要繼續嗎？`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await axios.delete(`/api/supplier/tours/${productId}`);
      // Refresh the product list
      await fetchProducts();
    } catch (err: any) {
      setError('刪除產品失敗，請稍後再試');
      console.error('Error deleting product:', err);
    }
  };

  const getStatusBadge = (status: ProductStatus) => {
    const statusConfig = {
      '草稿': 'bg-slate-500 text-white',
      '待審核': 'bg-amber-400 text-black',
      '已發佈': 'bg-green-500 text-white',
      '需要修改': 'bg-red-500 text-white',
    };

    const classes = statusConfig[status] || statusConfig['草稿'];

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-bold inline-block ${classes}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white px-8 py-4 shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">供應商控制台</h1>
        <div className="flex items-center gap-4">
          <span className="text-slate-600 font-medium">{user?.name} ({user?.role})</span>
          <button onClick={logout} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium">
            登出
          </button>
        </div>
      </header>
      <main className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">我的產品</h2>
          <button
            onClick={() => navigate('/supplier/tours/new')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
          >
            + 新增產品
          </button>
        </div>

        {loading && <p className="text-center text-slate-500 py-8">載入中...</p>}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4 border border-red-200">{error}</div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-slate-200">
            <p className="text-slate-500 mb-4 text-lg">尚無產品</p>
            <button
              onClick={() => navigate('/supplier/tours/new')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
            >
              建立第一個產品
            </button>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 text-sm">產品標題</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 text-sm">狀態</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 text-sm">建立日期</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 text-sm">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-700 font-medium">{product.title}</td>
                    <td className="px-6 py-4">{getStatusBadge(product.status)}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(product.createdAt).toLocaleDateString('zh-TW')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => navigate(`/supplier/tours/edit/${product.id}`)}
                          className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-sm rounded-md transition-colors font-medium"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.title)}
                          className="px-3 py-1.5 bg-white border border-red-200 hover:border-red-300 text-red-600 hover:bg-red-50 text-sm rounded-md transition-colors font-medium"
                        >
                          刪除
                        </button>
                      </div>
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

export default SupplierDashboardPage;


import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios';
import TopBar from '../../components/TopBar';

type ProductStatus = '草稿' | '待審核' | '已發佈' | '需要修改';

interface Product {
  id: string;
  title: string;
  status: ProductStatus;
  createdAt: string;
  destination: string;
  category: string;
}

const SupplierDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterDestination, setFilterDestination] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);

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

  const handleSort = (key: keyof Product) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredProducts = React.useMemo(() => {
    let result = [...products];

    // Filtering
    if (filterDestination) {
      result = result.filter(p => p.destination.toLowerCase().includes(filterDestination.toLowerCase()));
    }
    if (filterCategory) {
      result = result.filter(p => p.category === filterCategory);
    }
    if (filterStatus) {
      result = result.filter(p => p.status === filterStatus);
    }

    // Sorting
    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [products, filterDestination, filterCategory, filterStatus, sortConfig]);

  const categoryMap: Record<string, string> = {
    'landmark': '地標',
    'accommodation': '住宿',
    'food': '餐飲',
    'transportation': '交通'
  };

  const uniqueCategories = Array.from(new Set(products.map(p => p.category)))
    .filter(Boolean)
    .filter(c => c !== 'activity');
  const uniqueStatuses = Array.from(new Set(products.map(p => p.status))).filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar title="供應商控制台" />
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

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase">目的地</label>
            <input
              type="text"
              placeholder="搜尋目的地..."
              value={filterDestination}
              onChange={(e) => setFilterDestination(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[150px]">
            <label className="text-xs font-bold text-slate-500 uppercase">類別</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">全部類別</option>
              {uniqueCategories.map(c => (
                <option key={c} value={c}>{categoryMap[c] || c}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-[150px]">
            <label className="text-xs font-bold text-slate-500 uppercase">狀態</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">全部狀態</option>
              {uniqueStatuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {(filterDestination || filterCategory || filterStatus) && (
            <div className="flex items-end pb-1">
              <button
                onClick={() => {
                  setFilterDestination('');
                  setFilterCategory('');
                  setFilterStatus('');
                }}
                className="text-sm text-red-500 hover:text-red-700 font-medium"
              >
                清除篩選
              </button>
            </div>
          )}
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
                  <th
                    className="px-6 py-4 text-left font-semibold text-slate-700 text-sm cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => handleSort('title')}
                  >
                    產品標題 {sortConfig?.key === 'title' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-6 py-4 text-left font-semibold text-slate-700 text-sm cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => handleSort('destination')}
                  >
                    目的地 {sortConfig?.key === 'destination' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-6 py-4 text-left font-semibold text-slate-700 text-sm cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => handleSort('category')}
                  >
                    類別 {sortConfig?.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-6 py-4 text-left font-semibold text-slate-700 text-sm cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => handleSort('status')}
                  >
                    狀態 {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-6 py-4 text-left font-semibold text-slate-700 text-sm cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => handleSort('createdAt')}
                  >
                    建立日期 {sortConfig?.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 text-sm">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-700 font-medium">{product.title}</td>
                    <td className="px-6 py-4 text-slate-600">{product.destination}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600">
                        {categoryMap[product.category] || product.category}
                      </span>
                    </td>
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
            {filteredProducts.length === 0 && products.length > 0 && (
              <p className="p-8 text-center text-slate-500">沒有符合篩選條件的產品</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SupplierDashboardPage;

import React, { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';
import TopBar from '../../components/TopBar';

type ProductStatus = '草稿' | '待審核' | '已發佈' | '需要修改';

interface Product {
  id: string;
  title: string;
  supplierName: string;
  status: ProductStatus;
  createdAt: string;
  destination: string;
  category: string;
}

const AdminToursPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterDestination, setFilterDestination] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    setSelectedIds(new Set());
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
      showSuccess('產品已刪除');
    } catch (err: any) {
      showError('刪除產品失敗，請稍後再試');
      console.error('Error deleting product:', err);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectProduct = (id: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBatchApprove = async () => {
    if (selectedIds.size === 0) return;

    if (!window.confirm(`確定要批量批准 ${selectedIds.size} 個產品嗎？\n這些產品的狀態將變更為「已發佈」。`)) {
      return;
    }

    try {
      setIsBatchProcessing(true);
      await Promise.all(Array.from(selectedIds).map(id =>
        axios.put(`/api/admin/tours/${id}/status`, { status: '已發佈' })
      ));

      showSuccess(`成功批准 ${selectedIds.size} 個產品`);
      setSelectedIds(new Set());
      await fetchProducts();
      await fetchPendingCount();
    } catch (err) {
      console.error('Batch approve error:', err);
      showError('批量批准失敗');
    } finally {
      setIsBatchProcessing(false);
    }
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
    if (filterSupplier) {
      result = result.filter(p => p.supplierName.toLowerCase().includes(filterSupplier.toLowerCase()));
    }
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
  }, [products, filterSupplier, filterDestination, filterCategory, filterStatus, sortConfig]);

  const categoryMap: Record<string, string> = {
    'landmark': '地標',
    'accommodation': '住宿',
    'food': '餐飲',
    'transportation': '交通'
  };

  const uniqueCategories = Array.from(new Set(products.map(p => p.category)))
    .filter(Boolean)
    .filter(c => c !== 'activity'); // Filter out 'activity' if any remain in state temporarily
  const uniqueStatuses = Array.from(new Set(products.map(p => p.status))).filter(Boolean);

  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar title="後台管理" />
      <div className="bg-white border-b border-slate-200 py-4 flex justify-center sticky top-16 z-30 shadow-sm">
        <nav className="flex p-1 bg-slate-100 rounded-xl">
          {user?.role === 'super_admin' && (
            <button
              onClick={() => navigate('/admin/users')}
              className="px-6 py-2.5 text-slate-500 hover:text-slate-700 font-medium transition-all"
            >
              用戶管理
            </button>
          )}
          <button
            onClick={() => navigate('/admin/tours')}
            className="px-6 py-2.5 bg-white text-slate-900 shadow-sm rounded-lg font-bold transition-all"
          >
            產品管理
          </button>
        </nav>
      </div>
      <main className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">產品列表</h2>
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <button
                onClick={handleBatchApprove}
                disabled={isBatchProcessing}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium shadow-sm flex items-center gap-2"
              >
                {isBatchProcessing ? '處理中...' : `批准選取 (${selectedIds.size})`}
              </button>
            )}
            <button
              onClick={() => setShowPendingOnly(false)}
              className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 font-medium ${!showPendingOnly ? 'bg-slate-800 text-white border-slate-800 hover:bg-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              全部產品
            </button>
            <button
              onClick={() => setShowPendingOnly(true)}
              className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 font-medium ${showPendingOnly ? 'bg-slate-800 text-white border-slate-800 hover:bg-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              待審核 {pendingCount > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">{pendingCount}</span>}
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase">供應商</label>
            <input
              type="text"
              placeholder="搜尋供應商..."
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
          {(filterSupplier || filterDestination || filterCategory || filterStatus) && (
            <div className="flex items-end pb-1">
              <button
                onClick={() => {
                  setFilterSupplier('');
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
        {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4 border border-red-200">{error}</div>}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th
                    className="px-6 py-4 text-left font-semibold text-slate-700 text-sm cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => handleSort('title')}
                  >
                    產品標題 {sortConfig?.key === 'title' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-6 py-4 text-left font-semibold text-slate-700 text-sm cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => handleSort('supplierName')}
                  >
                    供應商名稱 {sortConfig?.key === 'supplierName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
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
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 text-sm">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedIds.has(product.id) ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
                    onClick={() => handleProductClick(product.id)}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedIds.has(product.id)}
                        onChange={(e) => handleSelectProduct(product.id, e)}
                      />
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{product.title}</td>
                    <td className="px-6 py-4 text-slate-600">{product.supplierName}</td>
                    <td className="px-6 py-4 text-slate-600">{product.destination}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600">
                        {categoryMap[product.category] || product.category}
                      </span>
                    </td>
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
            {filteredProducts.length === 0 && (
              <p className="p-8 text-center text-slate-500">
                {products.length === 0 ? '尚無產品' : '沒有符合篩選條件的產品'}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminToursPage;

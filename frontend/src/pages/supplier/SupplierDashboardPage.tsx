import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from '../../config/axios';
import TopBar from '../../components/TopBar';
import SupplierTripList from './SupplierTripList';
import FilterBar from '../../components/supplier/FilterBar';

type ProductStatus = '草稿' | '待審核' | '已發佈' | '已退回';

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
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'products' | 'trips') || 'products';
  const [activeTab, setActiveTab] = useState<'products' | 'trips'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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

  const handleDeleteProduct = async (productId: string, productTitle: string, force: boolean = false) => {
    if (!force) {
      const confirmMessage = `⚠️ 警告：刪除產品\n\n您即將刪除產品：\n標題：${productTitle}\n\n此操作將永久刪除該產品及相關數據，且無法撤銷。\n\n確定要繼續嗎？`;
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    try {
      await axios.delete(`/api/supplier/tours/${productId}${force ? '?force=true' : ''}`);
      // Refresh the product list
      await fetchProducts();
      setDependencyError(null);
    } catch (err: any) {
      const resp = err.response?.data;
      if (resp?.code === 'USED_IN_APPROVED_TRIPS') {
        setDependencyError({
          type: 'BLOCK',
          trips: resp.trips,
          productId,
          productTitle
        });
        return;
      }
      if (resp?.code === 'USED_IN_TRIPS') {
        setDependencyError({
          type: 'CONFIRM',
          trips: resp.trips,
          productId,
          productTitle
        });
        return;
      }
      setError('刪除產品失敗，請稍後再試');
      console.error('Error deleting product:', err);
    }
  };

  const [dependencyError, setDependencyError] = useState<{
    type: 'BLOCK' | 'CONFIRM';
    trips: any[];
    productId: string;
    productTitle: string;
  } | null>(null);

  const getStatusBadge = (status: ProductStatus) => {
    const statusConfig = {
      '草稿': 'bg-slate-500 text-white',
      '待審核': 'bg-amber-400 text-black',
      '已發佈': 'bg-green-500 text-white',
      '已退回': 'bg-red-500 text-white',
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
      result = result.filter(p => p.destination === filterDestination);
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

  const uniqueDestinations = React.useMemo(() => {
    return Array.from(new Set(products.map(p => p.destination))).filter(d => Boolean(d) && d !== '待定').sort();
  }, [products]);

  const categoryMap: Record<string, string> = {
    'landmark': '地標',
    'accommodation': '住宿',
    'food': '餐飲',
    'transportation': '交通'
  };

  const categories = React.useMemo(() => {
    const uniqueCats = Array.from(new Set(products.map(p => p.category)))
      .filter(Boolean)
      .filter(c => c !== 'activity');
    return uniqueCats.map(c => ({ value: c, label: categoryMap[c] || c }));
  }, [products]);

  const uniqueStatuses = Array.from(new Set(products.map(p => p.status))).filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar title="供應商控制台" />
      

      <main className="p-8 max-w-7xl mx-auto">
        {activeTab === 'products' ? (
          <>
            <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">我的產品</h2>
          <button
            onClick={() => navigate('/supplier/tours/new')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
          >
            + 新增產品
          </button>
        </div>

        {/* Filter Bar */}
        <FilterBar
          destinations={uniqueDestinations}
          categories={categories}
          statuses={uniqueStatuses}
          filters={{
            destination: filterDestination,
            category: filterCategory,
            status: filterStatus
          }}
          onFilterChange={(key, value) => {
            if (key === 'destination') setFilterDestination(value);
            if (key === 'category') setFilterCategory(value);
            if (key === 'status') setFilterStatus(value);
          }}
          onClear={() => {
            setFilterDestination('');
            setFilterCategory('');
            setFilterStatus('');
          }}
        />

        {loading && <p className="text-center text-slate-500 py-8">載入中...</p>}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4 border border-red-200">{error}</div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-slate-200">
            <p className="text-slate-500 mb-4 text-lg">尚無產品</p>
            <button
              onClick={() => navigate('/supplier/tours/new')}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
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
          </>
        ) : (
          <SupplierTripList />
        )}
      </main>
      {dependencyError && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-start gap-4 mb-6">
              <div className={`p-3 rounded-full flex-shrink-0 ${dependencyError.type === 'BLOCK' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                <span className="material-symbols-outlined text-2xl">
                  {dependencyError.type === 'BLOCK' ? 'block' : 'warning'}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {dependencyError.type === 'BLOCK' ? '無法刪除產品' : '此產品正被行程使用中'}
                </h3>
                <p className="text-slate-600">
                  產品「{dependencyError.productTitle}」正被以下行程引用：
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden mb-6 max-h-48 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="px-4 py-2 text-left">行程名稱</th>
                    <th className="px-4 py-2 text-left">狀態</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dependencyError.trips.map(trip => (
                    <tr key={trip.id}>
                      <td className="px-4 py-3 text-slate-700 font-medium">{trip.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          trip.status === '已通過' ? 'bg-green-100 text-green-700' : 
                          trip.status === '待審核' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {trip.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {dependencyError.type === 'BLOCK' ? (
              <div className="space-y-4">
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 italic">
                  您不能刪除已通過行程中的產品。請將上述行程設回草稿或刪除後，再嘗試刪除此產品。
                </p>
                <div className="flex justify-end">
                  <button 
                    onClick={() => setDependencyError(null)}
                    className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-lg"
                  >
                    知道了
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100 italic">
                  刪除此產品後，上述行程中的對應項目將會呈現「待修正」狀態。您必須手動更新這些行程。
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    onClick={() => setDependencyError(null)}
                    className="px-6 py-2 text-slate-500 font-bold hover:underline"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(dependencyError.productId, dependencyError.productTitle, true)}
                    className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                  >
                    確定刪除
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierDashboardPage;

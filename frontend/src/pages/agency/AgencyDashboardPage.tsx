import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios';
import TopBar from '../../components/TopBar';

interface Product {
  id: string;
  title: string;
  destination: string;
  durationDays: number;
  coverImageUrl: string;
  netPrice: number;
  supplierName: string;
}

const AgencyDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [destinationFilter, setDestinationFilter] = useState('');
  const [durationFilter, setDurationFilter] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [destinationFilter, durationFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (destinationFilter) {
        params.append('destination', destinationFilter);
      }
      if (durationFilter) {
        params.append('durationDays', durationFilter);
      }

      const response = await axios.get(`/api/agency/tours?${params.toString()}`);
      setProducts(response.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('無法載入產品列表');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `NT$${price.toLocaleString('zh-TW')}`;
  };

  const handleCardClick = (productId: string) => {
    navigate(`/agency/tours/${productId}`);
  };

  const getUniqueDestinations = () => {
    const destinations = new Set(products.map(p => p.destination));
    return Array.from(destinations).sort();
  };

  const getUniqueDurations = () => {
    const durations = new Set(products.map(p => p.durationDays));
    return Array.from(durations).sort((a, b) => a - b);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar title="旅行社控制台" />
      <main className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">探索產品</h2>
          <button
            onClick={() => navigate('/agency/itinerary-planner')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
          >
            <span>📋</span> 行程規劃
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-4">產品搜尋</h2>
          <div className="flex gap-6">
            <div className="flex items-center gap-3">
              <label htmlFor="destination" className="font-medium text-slate-700">目的地：</label>
              <select
                id="destination"
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[150px]"
              >
                <option value="">全部</option>
                {getUniqueDestinations().map(dest => (
                  <option key={dest} value={dest}>{dest}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="duration" className="font-medium text-slate-700">天數：</label>
              <select
                id="duration"
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[150px]"
              >
                <option value="">全部</option>
                {getUniqueDurations().map(days => (
                  <option key={days} value={days}>{days}天</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading && <p className="text-center text-slate-500 py-8">載入中...</p>}
        {error && <p className="text-center text-red-500 py-8">{error}</p>}

        {!loading && !error && products.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
            <p className="text-slate-500 text-lg">找不到符合條件的產品</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-slate-200 group"
                onClick={() => handleCardClick(product.id)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={product.coverImageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                    {product.durationDays} 天
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {product.title}
                  </h3>
                  <div className="flex justify-between items-end mt-4">
                    <div className="text-sm text-slate-500">
                      供應商：{product.supplierName}
                    </div>
                    <div className="text-xl font-bold text-green-600">
                      {formatPrice(product.netPrice)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AgencyDashboardPage;

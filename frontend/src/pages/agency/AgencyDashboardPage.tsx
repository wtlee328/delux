import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios';
import TopBar from '../../components/TopBar';
import DestinationMenu, { DESTINATION_GROUPS } from '../../components/DestinationMenu';
import { Search, MapPin, ImageOff, Calendar, Compass } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface Product {
  id: string;
  title: string;
  destination: string;
  category: string;
  coverImageUrl: string;
  netPrice: number;
  supplierName: string;
}

interface SupplierTrip {
  id: string;
  name: string;
  destination: string;
  category: string;
  daysCount: number;
  supplierName: string;
  createdAt: string;
}

const AgencyDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [trips, setTrips] = useState<SupplierTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlDestination = searchParams.get('destination');
  const [searchTerm, setSearchTerm] = useState(urlDestination || '');
  const [daysFilter, setDaysFilter] = useState<number | null>(null);

  // Update searchTerm when URL changes
  useEffect(() => {
    if (urlDestination) {
      setSearchTerm(urlDestination);
    } else {
      setSearchTerm('');
    }
  }, [urlDestination]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value) {
      setSearchParams({ destination: value });
    } else {
      setSearchParams({});
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch trips when search changes
  useEffect(() => {
    fetchTrips();
  }, [searchTerm, daysFilter]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/agency/tours');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrips = async () => {
    try {
      setLoadingTrips(true);
      const params: Record<string, string> = {};
      if (searchTerm) params.search = searchTerm;
      if (daysFilter) params.daysCount = String(daysFilter);

      const response = await axios.get('/api/agency/trips', { params });
      setTrips(response.data);
    } catch (error) {
      console.error('Failed to fetch trips:', error);
    } finally {
      setLoadingTrips(false);
    }
  };

  const popularDestinations = Array.from(new Set(products.map(p => p.destination))).filter(Boolean).slice(0, 8);
  const categoryLabels: Record<string, string> = {
    'landmark': '地標',
    'activity': '活動',
    'accommodation': '住宿',
    'food': '餐飲',
    'transportation': '交通'
  };

  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    const lowerDest = product.destination.toLowerCase();

    const matchedGroup = DESTINATION_GROUPS.find(g => g.region === searchTerm);
    if (matchedGroup) {
      return matchedGroup.items.some(item => item === product.destination) || lowerDest.includes(lowerSearch);
    }

    return lowerDest.includes(lowerSearch) || product.title.toLowerCase().includes(lowerSearch);
  });

  const displayProducts = filteredProducts;

  // Available daysCount values for filter pills
  const availableDaysCounts = Array.from(new Set(trips.map(t => t.daysCount))).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar middleContent={<DestinationMenu />} />

      <main className="p-8 max-w-7xl mx-auto">
        {/* Header with Itinerary Planning Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">探索產品與行程</h2>
          {searchTerm && (
            <button
              onClick={() => navigate(`/agency/itinerary-planner?destination=${encodeURIComponent(searchTerm)}`)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm hover:shadow-md animate-in fade-in slide-in-from-right-4"
            >
              <span className="material-symbols-outlined text-lg">assignment</span> 行程規劃
            </button>
          )}
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜尋行程名稱或目的地..."
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            {/* Popular Destinations */}
            {popularDestinations.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-slate-500 font-medium">熱門目的地:</span>
                {popularDestinations.map(dest => (
                  <button
                    key={dest}
                    onClick={() => handleSearchChange(dest)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors border ${searchTerm === dest
                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                      }`}
                  >
                    {dest}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recommended Trips Section */}
        {!loading && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-800">推薦行程</h3>
                {searchTerm && <span className="text-sm text-slate-500">– {searchTerm}</span>}
              </div>

              {/* Days Filter Pills */}
              {availableDaysCounts.length > 0 && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">天數:</span>
                  <button
                    onClick={() => setDaysFilter(null)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                      daysFilter === null
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    全部
                  </button>
                  {availableDaysCounts.map(dc => (
                    <button
                      key={dc}
                      onClick={() => setDaysFilter(daysFilter === dc ? null : dc)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                        daysFilter === dc
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {dc}天
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loadingTrips ? (
              <div className="text-center py-8 text-slate-400 text-sm">載入推薦行程中...</div>
            ) : trips.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {trips.map(trip => (
                  <div
                    key={trip.id}
                    onClick={() => navigate(`/agency/itinerary-planner?tripId=${trip.id}`)}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {trip.name}
                      </h4>
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap ml-2">
                        {trip.daysCount}天
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-2">
                      <MapPin className="w-3.5 h-3.5" />
                      {trip.destination}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                      <span>供應商: {trip.supplierName}</span>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{trip.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm bg-white rounded-xl border border-dashed border-slate-200">
                {searchTerm ? `「${searchTerm}」目前無推薦行程` : '目前無推薦行程'}
              </div>
            )}
          </div>
        )}

        {/* Product Grid */}
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-bold text-slate-800">產品目錄</h3>
          {searchTerm && <span className="text-sm text-slate-500">– {searchTerm} ({displayProducts.length})</span>}
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">載入中...</div>
        ) : displayProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <MapPin className="w-12 h-12 mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">此目的地目前尚無相關產品</h3>
            <p className="text-slate-500">請嘗試選擇其他目的地，或稍後再回來查看。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayProducts.map(product => (
              <div
                key={product.id}
                onClick={() => navigate(`/agency/tours/${product.id}`)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={product.coverImageUrl === 'null' || product.coverImageUrl === 'undefined' ? undefined : product.coverImageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    style={{ display: (!product.coverImageUrl || product.coverImageUrl === 'null' || product.coverImageUrl === 'undefined') ? 'none' : 'block' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const next = e.currentTarget.nextElementSibling;
                      if (next) next.classList.remove('hidden');
                    }}
                  />
                  <div className={`w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 group-hover:scale-105 transition-transform duration-300 absolute inset-0 ${(!product.coverImageUrl || product.coverImageUrl === 'null' || product.coverImageUrl === 'undefined') ? '' : 'hidden'}`}>
                    <ImageOff size={32} className="opacity-50" />
                  </div>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-slate-700 shadow-sm">
                    {categoryLabels[product.category] || product.category}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                    <MapPin className="w-4 h-4" />
                    {product.destination}
                  </div>

                  <h3 className="font-bold text-lg text-slate-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {product.title}
                  </h3>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <div className="text-sm text-slate-500">
                      供應商: {product.supplierName}
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

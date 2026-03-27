import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios';
import TopBar from '../../components/TopBar';
import DestinationMenu, { DESTINATION_GROUPS } from '../../components/DestinationMenu';
import CustomSelect from '../../components/ui/CustomSelect';
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


  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar middleContent={<DestinationMenu />} />

      <main className="p-8 max-w-7xl mx-auto">
        {/* Header with Itinerary Planning Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">探索產品與行程</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/agency/trips')}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold transition-all hover:bg-slate-50 flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">folder_shared</span> 我的行程庫
            </button>
            {searchTerm && (
              <button
                disabled={displayProducts.length === 0}
                onClick={() => navigate(`/agency/itinerary-planner?destination=${encodeURIComponent(searchTerm)}`)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-right-4 ${
                  displayProducts.length === 0 
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200' 
                  : 'bg-slate-800 hover:bg-slate-700 text-white hover:shadow-md'
                }`}
                title={displayProducts.length === 0 ? "此目的地目前尚無相關產品，無法開始規劃" : "開始規劃行程"}
              >
                <span className="material-symbols-outlined text-lg">assignment</span> 行程規劃
              </button>
            )}
          </div>
        </div>

        {/* Unified Search & Filter Section */}
        <div className="relative mb-12">
          <div className="bg-white/70 backdrop-blur-md p-1.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/50 flex flex-col md:flex-row items-center gap-1">
            
            {/* Search Input Part */}
            <div className="relative flex-1 w-full group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="搜尋行程名稱、目的地或供應商..."
                className="w-full pl-14 pr-6 py-4 bg-transparent border-none focus:ring-0 text-lg text-slate-800 placeholder:text-slate-400 font-medium"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            {/* Divider (Desktop only) */}
            <div className="hidden md:block w-px h-10 bg-slate-200/60 mx-2" />

            {/* Days Filter Part */}
            <div className="relative w-full md:w-auto min-w-[200px] group border-t md:border-t-0 border-slate-100 pb-2 md:pb-0 px-4 md:px-2">
              <CustomSelect
                label="行程天數"
                labelClassName="!text-[10px] !uppercase !tracking-wider !font-bold !text-slate-400 !mb-0.5"
                icon="calendar_month"
                containerClassName="!gap-0"
                className="!bg-transparent !border-none !focus:ring-0 !pl-10 !pr-6 !py-0 !text-sm !font-semibold !text-slate-700 !shadow-none !h-auto"
                value={daysFilter || ''}
                onChange={(e) => setDaysFilter(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">全部天數</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 21].map(d => (
                  <option key={d} value={d}>{d} 天行程</option>
                ))}
              </CustomSelect>
            </div>

            {/* Clear/Action Button */}
            {(searchTerm || daysFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDaysFilter(null);
                  setSearchParams({});
                }}
                className="p-3 mr-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                title="清除所有篩選"
              >
                <span className="material-symbols-outlined">restart_alt</span>
              </button>
            )}
          </div>

          {/* Quick Shortcuts */}
          {popularDestinations.length > 0 && !searchTerm && (
            <div className="mt-4 flex flex-wrap gap-2 items-center px-2 animate-in fade-in slide-in-from-top-2 duration-500">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mr-2">熱門搜尋</span>
              {popularDestinations.map(dest => (
                <button
                  key={dest}
                  onClick={() => handleSearchChange(dest)}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:shadow-sm transition-all duration-200"
                >
                  {dest}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Trips Section */}
        {!loading && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">精選推薦行程</h3>
                {searchTerm && <span className="text-sm text-slate-500">– {searchTerm} ({trips.length})</span>}
              </div>
              
              <div className="text-sm text-slate-400 font-medium">
                找到 {trips.length} 個行程
              </div>
            </div>

            {loadingTrips ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-2xl h-[160px] animate-pulse border border-slate-100" />
                ))}
              </div>
            ) : trips.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {trips.map(trip => (
                  <div
                    key={trip.id}
                    onClick={() => navigate(`/agency/itinerary-planner?tripId=${trip.id}`)}
                    className="group bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-200/60 p-5 hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] hover:border-blue-300 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border border-slate-100">
                          {trip.category}
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold ring-1 ring-inset ring-blue-600/10">
                          <Calendar className="w-3 h-3" />
                          {trip.daysCount}天
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-800 text-lg leading-tight mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {trip.name}
                      </h4>

                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <MapPin className="w-3.5 h-3.5" />
                        {trip.destination}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="text-[11px] text-slate-400 font-medium">
                        供應商: <span className="text-slate-600">{trip.supplierName}</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-slate-300 mb-4">
                  <Compass size={32} />
                </div>
                <h4 className="text-slate-700 font-bold">未找到符合條件的行程</h4>
                <p className="text-slate-500 text-sm mt-1">請嘗試調整搜尋字詞或天數篩選</p>
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

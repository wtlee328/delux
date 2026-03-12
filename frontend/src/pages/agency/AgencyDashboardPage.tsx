import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios';
import TopBar from '../../components/TopBar';
import DestinationMenu, { DESTINATION_GROUPS } from '../../components/DestinationMenu';
import { Search, MapPin, ImageOff } from 'lucide-react';
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

const AgencyDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlDestination = searchParams.get('destination');
  const [searchTerm, setSearchTerm] = useState(urlDestination || '');

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

  const popularDestinations = Array.from(new Set(products.map(p => p.destination))).filter(Boolean).slice(0, 8);
  const categoryLabels: Record<string, string> = {
    'landmark': '地標',
    'activity': '活動',
    'accommodation': '住宿',
    'food': '餐飲',
    'transportation': '交通'
  };

  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true; // Show all if no search

    const lowerSearch = searchTerm.toLowerCase();
    const lowerDest = product.destination.toLowerCase();
    
    // Check if search matches a region group
    const matchedGroup = DESTINATION_GROUPS.find(g => g.region === searchTerm);
    if (matchedGroup) {
      // If searchTerm is a region (e.g., "中國西南"), match if product destination is in this group
      return matchedGroup.items.some(item => item === product.destination) || lowerDest.includes(lowerSearch);
    }

    return lowerDest.includes(lowerSearch);
  });

  // "Filter and display only the product cards that match the selected destination."
  const displayProducts = filteredProducts;

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar middleContent={<DestinationMenu />} />

      <main className="p-8 max-w-7xl mx-auto">
        {/* Header with Itinerary Planning Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">探索產品</h2>
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
                placeholder="輸入目的地..."
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

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">載入中...</div>
        ) : displayProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <MapPin className="w-12 h-12 mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">此目的地目前尚無相關行程</h3>
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
                  {product.coverImageUrl ? (
                    <img
                      src={product.coverImageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 group-hover:scale-105 transition-transform duration-300">
                      <ImageOff size={32} className="mb-2 opacity-50" />
                      <span className="text-xs font-medium">沒有圖片</span>
                    </div>
                  )}
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
                    {/* Price removed as requested */}
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

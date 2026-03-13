import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios';
import TopBar from '../../components/TopBar';
import { useToast } from '../../components/Toast';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  MoreVertical, 
  Trash2, 
  ExternalLink, 
  Plus, 
  Search,
  Filter,
  ChevronRight,
  Plane
} from 'lucide-react';

interface Itinerary {
  id: string;
  name: string;
  destination: string;
  daysCount: number;
  startDate: string | null;
  endDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const AgencyTripsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchItineraries();
  }, []);

  const fetchItineraries = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/itinerary');
      setItineraries(response.data);
    } catch (error) {
      console.error('Failed to fetch itineraries:', error);
      showError('無法取得行程列表');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('確定要刪除此行程嗎？')) return;

    try {
      await axios.delete(`/api/itinerary/${id}`);
      showSuccess('行程已刪除');
      fetchItineraries();
    } catch (error) {
      console.error('Failed to delete itinerary:', error);
      showError('刪除失敗');
    }
    setActiveDropdown(null);
  };

  const filteredItineraries = itineraries.filter(it => 
    it.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (it.destination && it.destination.toLowerCase().includes(searchTerm.toLowerCase()))
  );


  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <TopBar title="我的行程庫" />

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header Section with Glassy Cards */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
              我的行程 <span className="text-blue-600">管理</span>
            </h1>
            <p className="text-slate-500 font-medium">查看、編輯與管理您為客戶規劃的所有精彩旅程</p>
          </div>
          
          <button
            onClick={() => navigate('/agency/itinerary-planner')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl font-bold shadow-xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={20} strokeWidth={3} />
            開始規劃新行程
          </button>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
          <div className="lg:col-span-3 relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <Search size={22} />
            </div>
            <input
              type="text"
              placeholder="搜尋行程名稱或目的地..."
              className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-slate-700 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-lg shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-3 text-slate-600 font-bold uppercase tracking-wider text-xs">
              <Filter size={18} className="text-slate-400" />
              篩選排序
            </div>
            <label className="text-slate-400">最新優先</label>
          </div>
        </div>

        {/* Itinerary Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[32px] h-[320px] animate-pulse border-2 border-slate-50" />
            ))}
          </div>
        ) : filteredItineraries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItineraries.map((itinerary) => (
              <div 
                key={itinerary.id}
                onClick={() => navigate(`/agency/itinerary-planner?itineraryId=${itinerary.id}`)}
                className="group relative bg-white rounded-[32px] border-2 border-slate-100 p-8 hover:border-blue-300 hover:shadow-[0_20px_50px_rgba(37,99,235,0.08)] transition-all duration-500 cursor-pointer flex flex-col"
              >
                {/* Status Badge */}
                <div className="absolute top-6 left-6">
                  <span className="px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider ring-1 ring-inset ring-blue-600/20">
                    {itinerary.status === 'draft' ? '草稿' : '已發佈'}
                  </span>
                </div>

                {/* Actions Dropdown */}
                <div className="absolute top-6 right-6">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(activeDropdown === itinerary.id ? null : itinerary.id);
                    }}
                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                  >
                    <MoreVertical size={20} />
                  </button>
                  
                  {activeDropdown === itinerary.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(null);
                        }}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-20 animate-in fade-in slide-in-from-top-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/agency/itinerary-planner?itineraryId=${itinerary.id}`);
                          }}
                          className="w-full px-5 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                        >
                          <ExternalLink size={16} className="text-slate-400" />
                          開啟編輯
                        </button>
                        <button 
                          onClick={(e) => handleDelete(itinerary.id, e)}
                          className="w-full px-5 py-2.5 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                        >
                          <Trash2 size={16} />
                          刪除行程
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Content */}
                <div className="mt-10">
                  <div className="flex items-center gap-2 text-slate-400 mb-3">
                    <MapPin size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">{itinerary.destination || '未設定目的地'}</span>
                  </div>
                  
                  <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-4 line-clamp-2 leading-tight">
                    {itinerary.name}
                  </h3>

                  <div className="flex flex-wrap gap-4 mt-auto">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                      <Calendar size={14} className="text-blue-500" />
                      <span className="text-xs font-bold text-slate-600">{itinerary.daysCount} 天</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                      <Clock size={14} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-500">
                        {new Date(itinerary.updatedAt).toLocaleDateString()} 更新
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Link */}
                <div className="mt-10 pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-600">DE</div>
                   </div>
                   <div className="flex items-center gap-2 text-blue-600 text-sm font-black group-hover:translate-x-1 transition-transform">
                      編輯詳情
                      <ChevronRight size={16} strokeWidth={3} />
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-8 animate-bounce">
              <Plane size={40} className="text-blue-400 -rotate-45" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-4">尚未建立行程</h2>
            <p className="text-slate-500 font-medium mb-10 leading-relaxed">
              您還沒有儲存任何行程。立即開始規劃您的第一趟精彩旅程吧！
            </p>
            <button
              onClick={() => navigate('/agency/itinerary-planner')}
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 hover:scale-105 transition-transform"
            >
              開啟行程規劃器
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AgencyTripsPage;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios';
import TopBar from '../../components/TopBar';
import CustomSelect from '../../components/ui/CustomSelect';
import { useToast } from '../../components/Toast';
import { 
  MapPin, 
  Clock, 
  MoreVertical, 
  Trash2, 
  ExternalLink, 
  Plus, 
  Search,
  Filter,
  Plane,
  ArrowLeft
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

      <main className="max-w-7xl mx-auto px-6 py-6">
        <button
          onClick={() => navigate('/agency/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors mb-6 group font-bold text-sm"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          返回
        </button>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              我的行程庫
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">管理您為客戶規劃的所有行程草稿與範本</p>
          </div>
          
          <button
            onClick={() => navigate('/agency/itinerary-planner')}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
          >
            <Plus size={18} strokeWidth={3} />
            開始規劃新行程
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="搜尋行程名稱或目的地..."
              className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-6 text-slate-700 font-medium focus:border-slate-400 focus:ring-0 transition-all outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-6 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <Filter size={14} />
              排序
            </div>
            <CustomSelect
              containerClassName="!flex-row !items-center !gap-2 !border-none !shadow-none !p-0"
              className="!bg-transparent !border-none !focus:ring-0 !text-sm !font-bold !text-slate-700 !pl-0 !pr-6 !py-0 !min-w-[80px]"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <option>最新優先</option>
              <option>最舊優先</option>
            </CustomSelect>
          </div>
        </div>

        {/* Itinerary List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : filteredItineraries.length > 0 ? (
          <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm relative">
            <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 bg-slate-50/50 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest rounded-t-[24px]">
              <div className="col-span-5">行程名稱</div>
              <div className="col-span-2 text-center">目的地</div>
              <div className="col-span-1 text-center">天數</div>
              <div className="col-span-2 text-center">最後更新</div>
              <div className="col-span-1 text-center">狀態</div>
              <div className="col-span-1 text-right">操作</div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredItineraries.map((itinerary, index) => (
                <div 
                  key={itinerary.id}
                  onClick={() => navigate(`/agency/trips/${itinerary.id}`)}
                  className={`group grid grid-cols-1 md:grid-cols-12 gap-4 px-8 py-6 hover:bg-slate-50 transition-colors cursor-pointer items-center ${
                    index === filteredItineraries.length - 1 ? 'rounded-b-[24px]' : ''
                  }`}
                >
                  {/* Name */}
                  <div className="col-span-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                      <Plane size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
                        {itinerary.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium md:hidden mt-1">{itinerary.destination || '未設定'}</p>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="col-span-2 text-center hidden md:block">
                    <div className="flex items-center justify-center gap-1.5 text-sm text-slate-600 font-medium">
                      <MapPin size={14} className="text-slate-400" />
                      {itinerary.destination || '—'}
                    </div>
                  </div>

                  {/* Days */}
                  <div className="col-span-1 text-center hidden md:block">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 text-xs font-bold ring-1 ring-inset ring-slate-200/50">
                      {itinerary.daysCount}天
                    </div>
                  </div>

                  {/* Date */}
                  <div className="col-span-2 text-center hidden md:block">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Clock size={14} />
                      {new Date(itinerary.updatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-1 text-center hidden md:block">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ring-1 ring-inset ${
                      itinerary.status === 'draft' 
                        ? 'bg-slate-50 text-slate-500 ring-slate-200' 
                        : 'bg-green-50 text-green-600 ring-green-600/20'
                    }`}>
                      {itinerary.status === 'draft' ? '草稿' : '已發佈'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 text-right flex justify-end">
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === itinerary.id ? null : itinerary.id);
                        }}
                        className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {activeDropdown === itinerary.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-[60]" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(null);
                            }}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-[70] animate-in fade-in slide-in-from-top-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/agency/itinerary-planner?itineraryId=${itinerary.id}`);
                              }}
                              className="w-full px-4 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                            >
                              <ExternalLink size={16} className="text-slate-400" />
                              編輯行程
                            </button>
                            <button 
                              onClick={(e) => handleDelete(itinerary.id, e)}
                              className="w-full px-4 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                            >
                              <Trash2 size={16} />
                              刪除行程
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center py-20 px-6">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-8">
              <Plane size={32} className="text-slate-300 -rotate-45" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-3">尚未建立行程</h2>
            <p className="text-slate-500 text-sm font-medium mb-10 leading-relaxed">
              您還沒有儲存任何外部行程草稿。<br/>立即開始規劃您的第一趟精彩旅程吧！
            </p>
            <button
              onClick={() => navigate('/agency/itinerary-planner')}
              className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-slate-200 hover:scale-105 transition-all text-sm"
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

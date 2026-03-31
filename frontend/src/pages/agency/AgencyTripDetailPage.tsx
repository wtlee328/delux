import React, { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, Utensils, BedDouble, Info, ChevronDown, ChevronUp, Edit3, ArrowLeft, MapPin, Calendar, Clock } from 'lucide-react';
import TopBar from '../../components/TopBar';

type TripStatus = '草稿' | '待審核' | '已通過' | '已退回';

interface TripDetail {
  id: string;
  name: string;
  destination: string;
  daysCount: number;
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
  supplierName?: string;
  category?: string;
  days: any[];
}

const AgencyTripDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isTemplate = searchParams.get('type') === 'template';
  
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (id) {
      fetchTrip();
    }
  }, [id, isTemplate]);

  const fetchTrip = async () => {
    try {
      setLoading(true);
      setError(null);
      const endpoint = isTemplate ? `/api/agency/trips/${id}` : `/api/itinerary/${id}`;
      const response = await axios.get(endpoint);
      
      const data = response.data;
      if (!isTemplate && data.timelineData) {
        setTrip({
          ...data,
          days: data.timelineData.map((day: any) => ({
            ...day,
            dayIndex: day.dayNumber,
            items: day.items.map((item: any) => ({
              ...item,
              productTitle: item.title
            }))
          }))
        });
      } else {
        setTrip(data);
      }
    } catch (err: any) {
      setError('無法載入行程詳情');
      console.error('Error fetching trip:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (isTemplate) {
      navigate(`/agency/itinerary-planner?tripId=${id}`);
    } else {
      navigate(`/agency/itinerary-planner/${id}`);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">載入行程中...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-bold text-xl mb-4">{error || '找不到行程'}</p>
          <button onClick={handleBack} className="px-6 py-2 bg-slate-800 text-white rounded-lg">返回</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <TopBar title="行程預覽" />
      
      <main className="w-[75%] mx-auto p-6 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <button 
            onClick={handleBack} 
            className="group flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors font-bold text-sm"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            返回列表
          </button>

          <button 
            onClick={handleEdit}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-bold shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Edit3 size={18} />
            {isTemplate ? '以此範本建立新行程' : '編輯此行程'}
          </button>
        </div>

        <div className="bg-white rounded-[32px] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-200/60 overflow-hidden mb-10">
          {/* Hero Header */}
          <div className="p-8 md:p-12 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest border border-white/10">
                {trip.category || '自訂行程'}
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-500 text-[10px] font-black uppercase tracking-widest">
                {isTemplate ? '供應商範本' : '我的草稿'}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black mb-8 leading-tight tracking-tight">
              {trip.name}
            </h1>

            <div className="flex flex-wrap gap-y-4 gap-x-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <MapPin size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-0.5">目的地</p>
                  <p className="font-bold text-lg">{trip.destination || '未設定'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Calendar size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-0.5">總天數</p>
                  <p className="font-bold text-lg">{trip.daysCount} 天</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Clock size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-0.5">最後更新</p>
                  <p className="font-bold text-lg">{new Date(trip.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Content */}
          <div className="p-8 md:p-12">
            <h2 className="text-2xl font-black text-slate-800 mb-10 flex items-center gap-3">
              <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
              每日行程規劃
            </h2>

            <div className="space-y-16 relative before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-200/50">
              {trip.days?.map((day: any) => (
                <div key={day.id || day.dayIndex} className="relative pl-20 group">
                  {/* Modern Day Marker */}
                  <div className="absolute left-0 top-0 w-14 h-[72px] bg-white border border-slate-200 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] rounded-2xl flex flex-col items-center justify-center z-10 transition-transform group-hover:scale-105 duration-300">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DAY</span>
                    <span className="text-3xl font-black text-slate-800 leading-none">{day.dayIndex}</span>
                  </div>
                  
                  <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-blue-200/50 transition-all duration-500 overflow-hidden">
                    <div className="p-1">
                      {/* Attractions Section */}
                      <div className="p-7 md:p-8 pb-4">
                        <div className="flex flex-wrap items-center gap-3">
                          {day.items?.length > 0 ? (
                            day.items.map((item: any, idx: number) => (
                              <React.Fragment key={item.id}>
                                <div className="px-5 py-3.5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-blue-50/30 hover:border-blue-100 transition-all cursor-default">
                                  <span className="font-bold text-slate-700 text-sm md:text-base">{item.productTitle || '未設定名稱'}</span>
                                </div>
                                {idx < day.items.length - 1 && (
                                  <div className="flex items-center text-slate-300">
                                    <ArrowRight size={18} strokeWidth={3} />
                                  </div>
                                )}
                              </React.Fragment>
                            ))
                          ) : (
                            <div className="w-full text-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 font-medium italic">
                              本日尚無景點安排
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info Bar - Compact Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-12 border-t border-slate-50">
                        {/* Meals Column */}
                        <div className="md:col-span-7 p-7 md:p-8 md:border-r border-slate-50">
                          <div className="flex items-center gap-2 font-black text-[10px] text-slate-400 uppercase tracking-widest mb-6 px-1">
                            <Utensils size={14} className="text-blue-500" />
                            美食饗宴
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                              { label: '早餐', value: day.breakfastCustom || day.breakfastTitle },
                              { label: '午餐', value: day.lunchCustom || day.lunchTitle },
                              { label: '晚餐', value: day.dinnerCustom || day.dinnerTitle }
                            ].map((meal, i) => (
                              <div key={i} className="bg-slate-50/50 rounded-xl p-3.5 border border-slate-100/50 flex flex-col gap-1 hover:bg-white hover:border-slate-200 transition-colors">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{meal.label}</span>
                                <span className="text-sm font-bold text-slate-700 truncate">{meal.value || '自理'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Hotel Column */}
                        <div className="md:col-span-5 p-7 md:p-8 flex flex-col">
                          <div className="flex items-center gap-2 font-black text-[10px] text-slate-400 uppercase tracking-widest mb-6 px-1">
                            <BedDouble size={14} className="text-blue-500" />
                            住宿憩所
                          </div>
                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col justify-center shadow-inner">
                            <p className="text-xs font-bold text-blue-400/60 uppercase tracking-tighter mb-1 select-none">Overnight At</p>
                            <p className="text-base font-black text-white leading-tight">
                              {day.hotelCustom || day.hotelTitle || '自理 / 溫暖的家'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Note Section (If exists) */}
                      {day.notes && (
                        <div className="px-7 md:px-8 pb-8">
                           <div className="mt-2 bg-blue-50/30 rounded-2xl border border-blue-100/50 overflow-hidden">
                            <button 
                              onClick={() => setExpandedDays(prev => ({ ...prev, [day.id || day.dayIndex]: !prev[day.id || day.dayIndex] }))}
                              className="w-full flex items-center justify-between px-5 py-3 text-blue-700 font-bold text-xs transition-colors hover:bg-blue-50/50"
                            >
                              <div className="flex items-center gap-2">
                                <Info size={14} />
                                查看行程備註與細節
                              </div>
                              {expandedDays[day.id || day.dayIndex] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            {expandedDays[day.id || day.dayIndex] && (
                              <div className="px-5 pb-5 pt-1 text-slate-600 text-sm leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-top-1 duration-300">
                                {day.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center mt-12">
           <button 
            onClick={handleEdit}
            className="group relative flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-16 py-5 rounded-[22px] font-black shadow-2xl shadow-slate-300 transition-all hover:scale-[1.03] active:scale-[0.97] text-lg overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <Edit3 size={24} className="relative z-10" />
            <span className="relative z-10">{isTemplate ? '立即預約規劃行程' : '進入行程編輯模式'}</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default AgencyTripDetailPage;

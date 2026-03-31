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
      // Use different endpoints based on whether it's a template or a personal draft
      const endpoint = isTemplate ? `/api/agency/trips/${id}` : `/api/itinerary/${id}`;
      const response = await axios.get(endpoint);
      
      // Normalize data structure if needed
      const data = response.data;
      if (!isTemplate && data.timelineData) {
        // Map personal draft (itinerary) structure to match the detail view
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
      
      <main className="max-w-5xl mx-auto p-6 md:p-10">
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

            <div className="space-y-12 relative before:absolute before:left-[31px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
              {trip.days?.map((day: any) => (
                <div key={day.id || day.dayIndex} className="relative pl-16">
                  {/* Day Marker Circle */}
                  <div className="absolute left-0 top-0 w-16 h-16 bg-white border-4 border-[#F8FAFC] shadow-lg rounded-2xl flex flex-col items-center justify-center z-10">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter -mb-1">DAY</span>
                    <span className="text-2xl font-black text-slate-800">{day.dayIndex}</span>
                  </div>
                  
                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                    {/* Attractions Timeline */}
                    <div className="flex flex-wrap items-center gap-4 mb-8">
                      {day.items?.length > 0 ? (
                        day.items.map((item: any, idx: number) => (
                          <React.Fragment key={item.id}>
                            <div className="px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:border-blue-100 transition-colors">
                              <span className="font-bold text-slate-700">{item.productTitle || '未設定名稱'}</span>
                            </div>
                            {idx < day.items.length - 1 && (
                              <ArrowRight className="text-slate-300" size={20} />
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        <span className="text-slate-400 italic bg-slate-50 px-5 py-3 rounded-2xl border border-dashed border-slate-200">本日尚無景點安排</span>
                      )}
                    </div>

                    {/* Meals & Accommodation Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100/50">
                        <div className="flex items-center gap-2 font-black text-[11px] text-slate-400 uppercase tracking-widest mb-4">
                          <Utensils size={14} />
                          美食饗宴
                        </div>
                        <div className="space-y-4">
                          {[
                            { label: '早餐', value: day.breakfastCustom || day.breakfastTitle },
                            { label: '午餐', value: day.lunchCustom || day.lunchTitle },
                            { label: '晚餐', value: day.dinnerCustom || day.dinnerTitle }
                          ].map((meal, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-white last:border-0">
                              <span className="text-xs font-bold text-slate-400">{meal.label}</span>
                              <span className="text-sm font-bold text-slate-700">{meal.value || '自理'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100/50">
                        <div className="flex items-center gap-2 font-black text-[11px] text-slate-400 uppercase tracking-widest mb-4">
                          <BedDouble size={14} />
                          住宿憩所
                        </div>
                        <div className="h-full flex items-center">
                          <p className="text-lg font-bold text-slate-700 leading-snug">
                            {day.hotelCustom || day.hotelTitle || '自理 / 溫暖的家'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Notes */}
                    {day.notes && (
                      <div className="mt-6">
                        <button 
                          onClick={() => setExpandedDays(prev => ({ ...prev, [day.id || day.dayIndex]: !prev[day.id || day.dayIndex] }))}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors"
                        >
                          <Info size={14} />
                          查看行程細節
                          {expandedDays[day.id || day.dayIndex] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        {expandedDays[day.id || day.dayIndex] && (
                          <div className="mt-4 p-6 bg-white border border-blue-100 rounded-2xl text-slate-600 text-sm leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-top-2 duration-300">
                            {day.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Sidebar / Bottom Bar */}
        <div className="flex justify-center">
           <button 
            onClick={handleEdit}
            className="flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-12 py-5 rounded-[24px] font-black shadow-2xl shadow-slate-300 transition-all hover:scale-[1.05] active:scale-[0.95] text-lg"
          >
            <Edit3 size={24} />
            {isTemplate ? '立即開始規劃' : '進入編輯模式'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default AgencyTripDetailPage;

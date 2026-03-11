import React, { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Utensils, BedDouble, Info, ChevronDown, ChevronUp } from 'lucide-react';
import TopBar from '../../components/TopBar';

type TripStatus = '草稿' | '審核中' | '已通過' | '已退回';

interface TripDetail {
  id: string;
  name: string;
  destination: string;
  daysCount: number;
  status: TripStatus;
  rejectionReason?: string;
  createdAt: string;
  days: any[];
}

const AdminTripDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (id) {
      fetchTrip();
    }
  }, [id]);

  const fetchTrip = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/admin/trips/${id}`);
      setTrip(response.data);
    } catch (err: any) {
      setError('無法載入行程詳情');
      console.error('Error fetching trip:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: TripStatus, reason?: string) => {
    try {
      setUpdating(true);
      await axios.put(`/api/admin/trips/${id}/status`, { status, rejectionReason: reason });
      await fetchTrip();
      setShowRevisionModal(false);
      setRevisionFeedback('');
    } catch (err: any) {
      alert('更新狀態失敗');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-10 text-center">載入中...</div>;
  if (!trip) return <div className="p-10 text-center text-red-500">{error || '找不到行程'}</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <TopBar title="行程審核" />
      <main className="max-w-4xl mx-auto p-6 mt-6">
        <button onClick={() => navigate('/admin/trips')} className="mb-6 text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium">
          ← 返回行程列表
        </button>

        <div className="bg-white rounded-xl shadow-sm p-8 mb-6 border border-slate-200">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">{trip.name}</h1>
              <p className="text-slate-500 font-medium">目的地：{trip.destination} | {trip.daysCount} 天 | 建立於 {new Date(trip.createdAt).toLocaleDateString()}</p>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${
              trip.status === '已通過' ? 'bg-green-500 text-white' : 
              trip.status === '審核中' ? 'bg-amber-400 text-black' : 
              trip.status === '已退回' ? 'bg-red-500 text-white' : 'bg-slate-400 text-white'
            }`}>
              {trip.status}
            </div>
          </div>

          {trip.status === '審核中' ? (
            <div className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-8">
              <button 
                onClick={() => handleUpdateStatus('已通過')}
                disabled={updating}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                核准通過
              </button>
              <button 
                onClick={() => setShowRevisionModal(true)}
                disabled={updating}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                退回修改
              </button>
            </div>
          ) : null}

          {trip.status === '已退回' && trip.rejectionReason && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-8 border border-red-100">
              <p className="font-bold mb-1">退回原因：</p>
              <p>{trip.rejectionReason}</p>
            </div>
          )}

          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-700 border-b pb-2 mb-4">行程詳情</h2>
            {trip.days?.map((day: any) => (
              <div key={day.id} className="bg-slate-50/50 rounded-xl p-5 shadow-sm border border-slate-200">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-16 h-16 bg-slate-800 text-white rounded-xl flex flex-col items-center justify-center font-bold shadow-sm">
                    <span className="text-[10px] opacity-80 uppercase tracking-wider mb-0.5">Day</span>
                    <span className="text-2xl leading-none">{day.dayIndex}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-1">
                    {/* Products / Attractions */}
                    <div className="flex flex-wrap items-center gap-3 mb-5">
                      {day.items?.length > 0 ? (
                        day.items.map((item: any, idx: number) => (
                          <React.Fragment key={item.id}>
                            <span className="font-semibold text-slate-800 text-lg">{item.productTitle || item.productId}</span>
                            {idx < day.items.length - 1 && (
                              <ArrowRight className="text-slate-400" size={18} strokeWidth={2.5} />
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">無景點安排</span>
                      )}
                    </div>

                    {/* Meals & Hotel Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 bg-white rounded-lg border border-slate-200 text-sm">
                      <div>
                        <div className="flex items-center gap-2 font-bold text-slate-700 mb-2">
                          <Utensils size={16} className="text-slate-400" />
                          餐食安排
                        </div>
                        <div className="space-y-1.5 text-slate-600 ml-6">
                          <div className="flex items-start"><span className="text-slate-400 w-10 shrink-0 inline-block font-medium">早餐</span> <span className="flex-1">{day.breakfastCustom || day.breakfastTitle || '自理'}</span></div>
                          <div className="flex items-start"><span className="text-slate-400 w-10 shrink-0 inline-block font-medium">午餐</span> <span className="flex-1">{day.lunchCustom || day.lunchTitle || '自理'}</span></div>
                          <div className="flex items-start"><span className="text-slate-400 w-10 shrink-0 inline-block font-medium">晚餐</span> <span className="flex-1">{day.dinnerCustom || day.dinnerTitle || '自理'}</span></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 font-bold text-slate-700 mb-2">
                          <BedDouble size={16} className="text-slate-400" />
                          住宿安排
                        </div>
                        <div className="text-slate-600 ml-6 leading-relaxed">
                          {day.hotelCustom || day.hotelTitle || '自理 / 溫暖的家'}
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {day.notes && (
                      <div className="mt-4 p-4 bg-blue-50/60 rounded-lg border border-blue-100 text-sm">
                        <button 
                          onClick={() => setExpandedDays(prev => ({ ...prev, [day.id]: !prev[day.id] }))}
                          className="flex items-center gap-2 font-bold text-blue-900 w-full text-left"
                        >
                          <Info size={16} className="text-blue-500" />
                          詳細行程
                          <span className="ml-auto text-blue-500">
                            {expandedDays[day.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </span>
                        </button>
                        {expandedDays[day.id] && (
                          <div className="text-slate-700 whitespace-pre-wrap ml-6 mt-3 leading-relaxed">
                            {day.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {showRevisionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">退回修改</h3>
            <p className="text-slate-600 mb-4">請說明退回原因或提供修改建議：</p>
            <textarea
              value={revisionFeedback}
              onChange={(e) => setRevisionFeedback(e.target.value)}
              className="w-full p-4 border border-slate-300 rounded-lg mb-6 min-h-[150px] outline-none focus:ring-2 focus:ring-red-500"
              placeholder="例如：行程第2天景點過於擁擠，建議調整..."
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRevisionModal(false)} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">取消</button>
              <button 
                onClick={() => handleUpdateStatus('已退回', revisionFeedback)}
                disabled={!revisionFeedback.trim() || updating}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
              >
                確認退回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTripDetailPage;

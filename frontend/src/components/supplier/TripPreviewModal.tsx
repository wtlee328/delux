import React, { useEffect, useState } from 'react';
import { X, ArrowRight, Utensils, BedDouble, Info } from 'lucide-react';
import axios from '../../config/axios';

interface TripPreviewModalProps {
  tripId: string;
  onClose: () => void;
}

const TripPreviewModal: React.FC<TripPreviewModalProps> = ({ tripId, onClose }) => {
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/supplier/trips/${tripId}`);
        setTrip(res.data);
      } catch (err: any) {
        setError('載入行程資訊失敗');
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [tripId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-3 text-slate-600 font-medium">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-800"></div>
          載入中...
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-lg">
          <p className="text-red-500 font-medium mb-4">{error}</p>
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors">
            關閉
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 bg-white">
          <div className="pr-8">
            <h2 className="text-2xl font-bold text-slate-800 leading-tight">{trip.name}</h2>
            <div className="flex flex-wrap gap-2 mt-3 text-sm font-medium text-slate-600">
              <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">{trip.destination}</span>
              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full">{trip.category}</span>
              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full">{trip.daysCount} 天</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0 bg-slate-50">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="space-y-6 max-w-3xl mx-auto">
            {trip.days?.map((day: any) => (
              <div key={day.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
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
                            <span className="font-semibold text-slate-800 text-lg">{item.productTitle}</span>
                            {idx < day.items.length - 1 && (
                              <ArrowRight className="text-indigo-400" size={18} strokeWidth={2.5} />
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">無景點安排</span>
                      )}
                    </div>

                    {/* Meals & Hotel Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm">
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
                        <div className="flex items-center gap-2 font-bold text-blue-900 mb-2">
                          <Info size={16} className="text-blue-500" />
                          備註 / Note
                        </div>
                        <div className="text-slate-700 whitespace-pre-wrap ml-6 leading-relaxed">
                          {day.notes}
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
    </div>
  );
};

export default TripPreviewModal;

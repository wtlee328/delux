import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios';
import FilterBar from '../../components/supplier/FilterBar';
import TripPreviewModal from '../../components/supplier/TripPreviewModal';

interface Trip {
  id: string;
  name: string;
  destination: string;
  category: string;
  daysCount: number;
  status: string;
  createdAt: string;
}

const SupplierTripList: React.FC = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewTripId, setPreviewTripId] = useState<string | null>(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/supplier/trips');
      setTrips(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || '載入行程失敗');
    } finally {
      setLoading(false);
    }
  };

  const [filterDestination, setFilterDestination] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filteredTrips = React.useMemo(() => {
    let result = [...trips];
    if (filterDestination) {
      result = result.filter(t => t.destination === filterDestination);
    }
    if (filterCategory) {
      result = result.filter(t => t.category === filterCategory);
    }
    if (filterStatus) {
      result = result.filter(t => t.status === filterStatus);
    }
    return result;
  }, [trips, filterDestination, filterCategory, filterStatus]);

  const uniqueDestinations = React.useMemo(() => {
    return Array.from(new Set(trips.map(t => t.destination))).filter(Boolean).sort();
  }, [trips]);

  const categories = React.useMemo(() => {
    const uniqueCats = Array.from(new Set(trips.map(t => t.category))).filter(Boolean);
    return uniqueCats.map(c => ({ value: c, label: c }));
  }, [trips]);

  const statuses = ['草稿', '審核中', '已通過', '已退回'];

  const handleDeleteTrip = async (tripId: string, tripName: string) => {
    const confirmMessage = `⚠️ 警告：刪除行程\n\n您即將刪除行程：\n標題：${tripName}\n\n確定要繼續嗎？`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await axios.delete(`/api/supplier/trips/${tripId}`);
      await fetchTrips();
    } catch (err: any) {
      setError('刪除行程失敗');
      console.error('Error deleting trip:', err);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">我的行程</h2>
        <button
          onClick={() => navigate('/supplier/trips/new')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
        >
          + 新增行程
        </button>
      </div>

      {/* Filter Bar */}
      <FilterBar
        destinations={uniqueDestinations}
        categories={categories}
        statuses={statuses}
        filters={{
          destination: filterDestination,
          category: filterCategory,
          status: filterStatus
        }}
        onFilterChange={(key, value) => {
          if (key === 'destination') setFilterDestination(value);
          if (key === 'category') setFilterCategory(value);
          if (key === 'status') setFilterStatus(value);
        }}
        onClear={() => {
          setFilterDestination('');
          setFilterCategory('');
          setFilterStatus('');
        }}
      />

      {loading && <p className="text-center text-slate-500 py-8">載入中...</p>}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4 border border-red-200">{error}</div>
      )}

      {!loading && !error && trips.length === 0 && (
        <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <p className="text-slate-500 mb-4 text-lg">尚無行程</p>
          <button
            onClick={() => navigate('/supplier/trips/new')}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
          >
            建立第一個行程
          </button>
        </div>
      )}

      {!loading && !error && trips.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-left font-semibold text-slate-700 text-sm">行程名稱</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700 text-sm">目的地</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700 text-sm">天數</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700 text-sm">狀態</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700 text-sm">建立日期</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700 text-sm">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTrips.map((trip) => (
                <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-700 font-medium">{trip.name}</td>
                  <td className="px-6 py-4 text-slate-600">{trip.destination}</td>
                  <td className="px-6 py-4 text-slate-600">{trip.daysCount} 天</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      trip.status === '已通過' ? 'bg-green-50 text-green-700 border-green-200' :
                      trip.status === '審核中' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      trip.status === '已退回' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(trip.createdAt).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => setPreviewTripId(trip.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-md transition-colors font-medium border border-transparent hover:border-slate-300"
                      >
                        預覽
                      </button>
                      <button
                        onClick={() => navigate(`/supplier/trips/edit/${trip.id}`)}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-sm rounded-md transition-colors font-medium"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => handleDeleteTrip(trip.id, trip.name)}
                        className="px-3 py-1.5 bg-white border border-red-200 hover:border-red-300 text-red-600 hover:bg-red-50 text-sm rounded-md transition-colors font-medium"
                      >
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {previewTripId && (
        <TripPreviewModal 
          tripId={previewTripId} 
          onClose={() => setPreviewTripId(null)} 
        />
      )}
    </>
  );
};

export default SupplierTripList;

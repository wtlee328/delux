import React, { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TopBar from '../../components/TopBar';
import CustomSelect from '../../components/ui/CustomSelect';

type TripStatus = '草稿' | '待審核' | '已通過' | '已退回';

interface Trip {
  id: string;
  name: string;
  supplierId: string;
  supplierName?: string;
  status: TripStatus;
  createdAt: string;
  destination: string;
  daysCount: number;
}

const AdminTripsPage: React.FC = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const [filterDestination, setFilterDestination] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchTrips();
  }, [showPendingOnly]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const endpoint = showPendingOnly ? '/api/admin/trips/pending' : '/api/admin/trips';
      const response = await axios.get(endpoint);
      setTrips(response.data);
    } catch (err: any) {
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: TripStatus) => {
    const statusConfig = {
      '草稿': 'bg-slate-500 text-white',
      '待審核': 'bg-amber-400 text-black',
      '已通過': 'bg-green-500 text-white',
      '已退回': 'bg-red-500 text-white',
    };
    const classes = statusConfig[status] || statusConfig['草稿'];
    return `px-3 py-1 rounded-full text-sm font-bold inline-block ${classes}`;
  };

  const filteredTrips = trips.filter(trip => {
    if (trip.status === '草稿') return false;
    if (filterDestination && !trip.destination.toLowerCase().includes(filterDestination.toLowerCase())) return false;
    if (filterStatus && trip.status !== filterStatus) return false;
    return true;
  });

  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar title="後台管理" />
      <div className="bg-white border-b border-slate-200 py-4 flex justify-center sticky top-16 z-30 shadow-sm">
        <nav className="flex p-1 bg-slate-100 rounded-xl">
          {user?.role === 'super_admin' && (
            <button
              onClick={() => navigate('/admin/users')}
              className="px-6 py-2.5 text-slate-500 hover:text-slate-700 font-medium transition-all"
            >
              用戶管理
            </button>
          )}
          <button
            onClick={() => navigate('/admin/tours')}
            className="px-6 py-2.5 text-slate-500 hover:text-slate-700 font-medium transition-all"
          >
            產品管理
          </button>
          <button
            onClick={() => navigate('/admin/trips')}
            className="px-6 py-2.5 bg-white text-slate-900 shadow-sm rounded-lg font-bold transition-all"
          >
            行程管理
          </button>
        </nav>
      </div>

      <main className="p-8 max-w-7xl mx-auto pb-20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">行程列表</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPendingOnly(false)}
              className={`px-4 py-2 rounded-lg border transition-colors font-medium ${!showPendingOnly ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
            >
              全部行程
            </button>
            <button
              onClick={() => setShowPendingOnly(true)}
              className={`px-4 py-2 rounded-lg border transition-colors font-medium ${showPendingOnly ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
            >
              待審核
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="搜尋目的地..."
            value={filterDestination}
            onChange={(e) => setFilterDestination(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-800 h-[38px] transition-all hover:border-slate-400 shadow-sm"
          />
          <CustomSelect
            containerClassName="min-w-[150px]"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">全部狀態</option>
            <option value="待審核">待審核</option>
            <option value="已通過">已通過</option>
            <option value="已退回">已退回</option>
          </CustomSelect>
        </div>

        {loading ? (
          <p className="text-center py-10 text-slate-500">載入中...</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">行程名稱</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">目的地</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">天數</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">狀態</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">建立日期</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrips.map(trip => (
                  <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-800 font-medium">{trip.name}</td>
                    <td className="px-6 py-4 text-slate-600">{trip.destination}</td>
                    <td className="px-6 py-4 text-slate-600">{trip.daysCount} 天</td>
                    <td className="px-6 py-4">
                      <span className={getStatusStyle(trip.status)}>{trip.status}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {new Date(trip.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/admin/trips/${trip.id}`)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-md transition-colors font-medium border border-transparent hover:border-slate-300"
                      >
                        查看詳情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTrips.length === 0 && (
              <p className="p-10 text-center text-slate-400">尚無行程</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminTripsPage;

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../config/axios';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

interface LocationState {
  roles: ('admin' | 'supplier' | 'agency' | 'super_admin')[];
  userName: string;
}

const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showError } = useToast();
  const { updateUser, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const state = location.state as LocationState;
  const roles = state?.roles || [];
  const userName = state?.userName || '';

  // If no roles provided, redirect to login
  useEffect(() => {
    if (roles.length === 0) {
      navigate('/login');
    }
  }, [roles, navigate]);

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'super_admin':
        return '系統管理員';
      case 'admin':
        return '後台管理員';
      case 'supplier':
        return '產品供應商';
      case 'agency':
        return '分銷旅行社';
      default:
        return role;
    }
  };

  const getRoleDescription = (role: string): string => {
    switch (role) {
      case 'super_admin':
        return 'System oversight & global settings';
      case 'admin':
        return 'Operations & user management';
      case 'supplier':
        return 'Product publishing & inventory';
      case 'agency':
        return 'Tour planning & reservations';
      default:
        return '';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="material-symbols-outlined text-3xl">verified_user</span>;
      case 'admin':
        return <span className="material-symbols-outlined text-3xl">settings_account_box</span>;
      case 'supplier':
        return <span className="material-symbols-outlined text-3xl">hub</span>;
      case 'agency':
        return <span className="material-symbols-outlined text-3xl">travel_explore</span>;
      default:
        return <span className="material-symbols-outlined text-3xl">person</span>;
    }
  };

  const getRedirectPath = (role: string): string => {
    switch (role) {
      case 'super_admin':
        return '/admin/users';
      case 'admin':
        return '/admin/tours';
      case 'supplier':
        return '/supplier/dashboard';
      case 'agency':
        return '/agency/dashboard';
      default:
        return '/';
    }
  };

  const handleRoleSelect = async (role: 'admin' | 'supplier' | 'agency' | 'super_admin') => {
    setIsLoading(true);

    try {
      const response = await axios.post('/api/auth/select-role', { role });
      const { token, user } = response.data;
      updateUser(token, user);
      navigate(getRedirectPath(role), { replace: true });
    } catch (error) {
      console.error('Role selection error:', error);
      showError('角色選擇失敗，請重試');
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col">
      {/* Sleek Header */}
      <header className="h-20 flex justify-between items-center px-8 sm:px-12">
        <div className="flex items-center">
          <img src="/logo.png" alt="Delux+" className="h-7 w-auto" />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-900 transition-colors text-sm font-bold group"
        >
          <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>登出</span>
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center -mt-10 px-6">
        <div className="w-full max-w-2xl">
          {/* Welcome Text */}
          <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
              Welcome Back
            </span>
            <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              {userName || '使用者'}，請選擇登入角色
            </h1>
            <p className="text-slate-400 font-medium">
              依據您所屬的權限，選擇合適的工作空間開始運作
            </p>
          </div>

          {/* Role Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
            {[...roles]
              .sort((a, b) => {
                const order = ['agency', 'supplier', 'admin', 'super_admin'];
                return order.indexOf(a) - order.indexOf(b);
              })
              .map((role, index) => (
              <button
                key={role}
                onClick={() => handleRoleSelect(role as any)}
                disabled={isLoading}
                style={{ animationDelay: `${index * 100}ms` }}
                className="group relative flex flex-col items-start p-8 bg-white border border-slate-100 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:bg-slate-900 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
              >
                {/* Icon Container */}
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 mb-8 group-hover:bg-white/10 group-hover:text-white transition-colors duration-300">
                  {getRoleIcon(role)}
                </div>

                {/* Text Content */}
                <div className="text-left">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-white transition-colors duration-300">
                    {getRoleLabel(role)}
                  </h3>
                  <p className="text-sm text-slate-400 font-medium group-hover:text-slate-300 transition-colors duration-300 line-clamp-1">
                    {getRoleDescription(role)}
                  </p>
                </div>

                {/* Arrow */}
                <div className="absolute bottom-8 right-8 overflow-hidden">
                  <div className="transform translate-y-12 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="material-symbols-outlined text-white text-xl">arrow_right_alt</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer Info */}
          <div className="mt-16 text-center animate-in fade-in duration-1000 delay-500">
            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">
              Delux+ Operations Center • v1.0.0
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoleSelectionPage;

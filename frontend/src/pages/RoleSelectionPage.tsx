import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../config/axios';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, LogOut } from 'lucide-react';

interface LocationState {
  roles: ('admin' | 'supplier' | 'agency')[];
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
      case 'admin':
        return '管理員';
      case 'supplier':
        return '供應商';
      case 'agency':
        return '旅行社';
      default:
        return role;
    }
  };

  const getRoleDescription = (role: string): string => {
    switch (role) {
      case 'admin':
        return '管理用戶和審核產品';
      case 'supplier':
        return '上傳和管理旅遊產品';
      case 'agency':
        return '瀏覽和發現旅遊產品';
      default:
        return '';
    }
  };

  const getRoleIcon = (role: string): string => {
    switch (role) {
      case 'admin':
        return '👤';
      case 'supplier':
        return '🏢';
      case 'agency':
        return '✈️';
      default:
        return '📋';
    }
  };

  const getRedirectPath = (role: string): string => {
    switch (role) {
      case 'admin':
        return '/admin/users';
      case 'supplier':
        return '/supplier/dashboard';
      case 'agency':
        return '/agency/dashboard';
      default:
        return '/';
    }
  };

  const handleRoleSelect = async (role: 'admin' | 'supplier' | 'agency') => {
    setIsLoading(true);

    try {
      console.log('Selecting role:', role);
      const response = await axios.post('/api/auth/select-role', { role });
      console.log('Role selection response:', response.data);
      const { token, user } = response.data;

      console.log('New user role:', user.role);
      console.log('New token (first 50 chars):', token.substring(0, 50));

      // Update AuthContext directly (no page reload needed)
      updateUser(token, user);

      const redirectPath = getRedirectPath(role);
      console.log('Redirecting to:', redirectPath);

      // Navigate without reloading - AuthContext is already updated
      navigate(redirectPath, { replace: true });
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white h-16 border-b border-slate-200 shadow-sm px-6 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-800">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <LayoutDashboard size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">Delux+</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-600 font-medium text-sm">{userName}</span>
          <div className="h-8 w-px bg-slate-200"></div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            <span>登出</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">選擇您的角色</h2>
            <p className="text-slate-500">
              歡迎回來！請選擇您要使用的角色以繼續
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => handleRoleSelect(role)}
                disabled={isLoading}
                className="flex flex-col items-center p-6 bg-white border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">
                  {getRoleIcon(role)}
                </div>
                <div className="text-lg font-bold text-slate-800 mb-1">
                  {getRoleLabel(role)}
                </div>
                <div className="text-xs text-slate-500 text-center">
                  {getRoleDescription(role)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoleSelectionPage;

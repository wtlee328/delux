import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { validateLoginForm } from '../utils/validation';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const validation = validateLoginForm(email, password);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      showSuccess('登入成功');
      // After successful login, get the user from context
      // The navigation will happen via useEffect below
    } catch (err: any) {
      if (err.response?.status === 401) {
        showError('電子郵件或密碼無效');
      } else {
        showError('登入失敗，請稍後再試');
      }
      setIsLoading(false);
    }
  };

  // Redirect based on role after successful login
  React.useEffect(() => {
    if (user) {
      // Check if user has multiple roles
      if (user.roles && user.roles.length > 1) {
        // Navigate to role selection page
        navigate('/select-role', {
          state: {
            roles: user.roles,
            userName: user.name,
          },
        });
      } else {
        // Single role user - redirect directly
        switch (user.role) {
          case 'admin':
            navigate('/admin/users');
            break;
          case 'supplier':
            navigate('/supplier/dashboard');
            break;
          case 'agency':
            navigate('/agency/dashboard');
            break;
        }
      }
    }
  }, [user, navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-slate-200">
        <div className="mb-8 text-center flex flex-col items-center">
          <img src="/logo.png" alt="Delux+ Logo" className="h-20 w-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Delux+ 帝樂旅遊平台
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            B2B2B Travel Supply Chain Platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-slate-700 block">
              電子郵件
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors(prev => ({ ...prev, email: '' }));
                }
              }}
              className={`w-full px-4 py-3 border rounded-lg text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent ${errors.email
                ? 'border-red-400 bg-red-50 focus:ring-red-400'
                : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
              disabled={isLoading}
              placeholder="請輸入您的電子郵件"
            />
            {errors.email && (
              <span className="text-xs text-red-600 font-medium block mt-1">
                {errors.email}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700 block">
              密碼
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) {
                  setErrors(prev => ({ ...prev, password: '' }));
                }
              }}
              className={`w-full px-4 py-3 border rounded-lg text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent ${errors.password
                ? 'border-red-400 bg-red-50 focus:ring-red-400'
                : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
              disabled={isLoading}
              placeholder="請輸入您的密碼"
            />
            {errors.password && (
              <span className="text-xs text-red-600 font-medium block mt-1">
                {errors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-800 hover:to-slate-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            disabled={isLoading}
          >
            {isLoading ? '登入中...' : '登入'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-600 mb-2">
            <span className="text-slate-400 font-medium">您是供應商嗎？</span>
            {' · '}
            <span className="text-slate-400 font-medium">管理員登入</span>
          </p>
          <p className="text-xs text-slate-400 mt-2">
            使用您的帳號登入以存取平台功能
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;


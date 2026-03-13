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
    <div className="flex min-h-screen bg-white">
      {/* Left Section: Brand & Messaging (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-16 relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-white rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <img src="/logo.png" alt="Delux+" className="h-10 w-auto invert brightness-0" />
          </div>

          <div className="max-w-md">
            <h1 className="text-5xl font-black text-white leading-tight mb-8 tracking-tight">
              引領旅遊產業 <br />
              <span className="text-slate-400">數位轉型</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed mb-12">
              全方位的 B2B2B 旅遊供應鏈生態系，連接供應商與旅行社，共同打造精彩旅程。
            </p>

            <div className="space-y-6">
              {[
                { label: '智慧化行程規劃系統', icon: 'auto_awesome' },
                { label: '全球供應商夥伴網路', icon: 'hub' },
                { label: '自動化業務營運管理', icon: 'settings_suggest' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 text-white/80 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  </div>
                  <span className="font-bold text-sm tracking-wide">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
            Delux+ 智慧營運系統 v1.2.4
          </span>
        </div>
      </div>

      {/* Right Section: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white">
        <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {/* Mobile Logo Only */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <img src="/logo.png" alt="Delux+" className="h-8 w-auto" />
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">登入系統</h2>
            <p className="text-slate-400 font-medium">歡迎回來！請輸入您的憑證以管理您的業務。</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">
                電子郵件
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                className={`w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl text-sm font-medium transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-slate-900 placeholder:text-slate-300 ${
                  errors.email ? 'ring-2 ring-red-400/20 bg-red-50' : 'hover:bg-slate-100'
                }`}
                disabled={isLoading}
                placeholder="name@company.com"
              />
              {errors.email && (
                <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider pl-1 pt-1 block">
                  {errors.email}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="password" className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  密碼
                </label>
                <button type="button" className="text-[11px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">
                  忘記密碼？
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                }}
                className={`w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl text-sm font-medium transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-slate-900 placeholder:text-slate-300 ${
                  errors.password ? 'ring-2 ring-red-400/20 bg-red-50' : 'hover:bg-slate-100'
                }`}
                disabled={isLoading}
                placeholder="••••••••"
              />
              {errors.password && (
                <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider pl-1 pt-1 block">
                  {errors.password}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input type="checkbox" id="remember" className="w-5 h-5 rounded-lg border-slate-200 text-slate-900 focus:ring-slate-900" />
              <label htmlFor="remember" className="text-sm text-slate-500 font-medium cursor-pointer">記住我的登入資訊</label>
            </div>

            <button
              type="submit"
              className="w-full py-4.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed mt-8 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>正在驗證憑證...</span>
                </>
              ) : (
                <>
                  <span>立即登入</span>
                  <span className="material-symbols-outlined text-lg">arrow_right_alt</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-12 flex items-center gap-6">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] whitespace-nowrap">
              Secure B2B Access
            </span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <p className="mt-12 text-center text-slate-400 text-xs font-medium">
            還沒有帳號？ <button className="text-slate-900 font-bold hover:underline">聯繫商務團隊</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;


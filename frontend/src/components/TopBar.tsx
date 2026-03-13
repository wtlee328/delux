import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from '../config/axios';
import { useToast } from './Toast';
import { ChevronDown, LogOut, User as UserIcon, Check } from 'lucide-react';

interface TopBarProps {
    title?: string;
    actions?: React.ReactNode;
    middleContent?: React.ReactNode;
}

const TopBar: React.FC<TopBarProps> = ({ title, actions, middleContent }) => {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    const { showError, showSuccess } = useToast();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getRoleLabel = (role: string): string => {
        switch (role) {
            case 'super_admin':
                return 'Super Admin';
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

    const handleRoleSwitch = async (role: 'admin' | 'supplier' | 'agency' | 'super_admin') => {
        if (role === user?.role) {
            setIsDropdownOpen(false);
            return;
        }

        setIsSwitching(true);
        try {
            const response = await axios.post('/api/auth/select-role', { role });
            const { token, user: newUser } = response.data;

            updateUser(token, newUser);
            showSuccess(`已切換至 ${getRoleLabel(role)} 身份`);

            const redirectPath = getRedirectPath(role);
            navigate(redirectPath, { replace: true });
            setIsDropdownOpen(false);
        } catch (error) {
            console.error('Role switch error:', error);
            showError('切換身份失敗，請重試');
        } finally {
            setIsSwitching(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const hasMultipleRoles = user?.roles && user.roles.length > 1;

    return (
        <header className="bg-white h-16 border-b border-slate-200 shadow-sm px-6 flex justify-between items-center sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <img src="/logo.png" alt="Delux+ Logo" className="h-8 w-auto" />
                </Link>
                {title && (
                    <>
                        <div className="h-6 w-px bg-slate-200 mx-2"></div>
                        <h1 className="text-lg font-medium text-slate-600">{title}</h1>
                    </>
                )}
                {middleContent}
            </div>

            <div className="flex items-center gap-4">
                {actions}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        disabled={isSwitching}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors border border-transparent hover:border-slate-200"
                    >
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                            <UserIcon size={16} />
                        </div>
                        <div className="flex flex-col items-start text-sm">
                            <span className="font-medium">{user?.name}</span>
                            <span className="text-xs text-slate-500">{getRoleLabel(user?.role || '')}</span>
                        </div>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                            {/* User Info Section */}
                            <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 mb-1">
                                <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-0.5">{getRoleLabel(user?.role || '')}</p>
                            </div>

                            {/* Navigation Section */}
                            <div className="py-1">
                                {user?.role === 'agency' && (
                                    <Link
                                        to="/agency/trips"
                                        onClick={() => setIsDropdownOpen(false)}
                                        className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all text-sm font-bold group"
                                    >
                                        <span className="material-symbols-outlined text-xl text-slate-400 group-hover:text-blue-500 transition-colors">travel_explore</span>
                                        我的行程庫
                                    </Link>
                                )}
                            </div>

                            {/* Role Switch Section (Lower level) */}
                            {hasMultipleRoles && (
                                <div className="mt-1 pt-1 border-t border-slate-50">
                                    <div className="px-4 py-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">身分切換</p>
                                    </div>
                                    {user?.roles.map((role) => (
                                        <button
                                            key={role}
                                            onClick={() => handleRoleSwitch(role)}
                                            className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors group"
                                        >
                                            <span className={`text-sm font-medium ${role === user.role ? 'text-blue-600' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                                {getRoleLabel(role)}
                                            </span>
                                            {role === user.role && <Check size={14} className="text-blue-600" strokeWidth={3} />}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Logout Section */}
                            <div className="mt-1 pt-1 border-t border-slate-100 px-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-3 py-2.5 text-left flex items-center gap-3 text-red-500 hover:bg-red-50 rounded-lg transition-all text-sm font-bold group"
                                >
                                    <LogOut size={18} className="text-red-400 group-hover:text-red-500" />
                                    登出系統
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopBar;

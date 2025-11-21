import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from '../config/axios';
import { useToast } from './Toast';
import { ChevronDown, LogOut, User as UserIcon, Check } from 'lucide-react';

interface TopBarProps {
    title?: string;
    actions?: React.ReactNode;
}

const TopBar: React.FC<TopBarProps> = ({ title, actions }) => {
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

    const handleRoleSwitch = async (role: 'admin' | 'supplier' | 'agency') => {
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
            </div>

            <div className="flex items-center gap-4">
                {actions}
                {hasMultipleRoles ? (
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
                            <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-2 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">切換身份</p>
                                </div>
                                {user?.roles.map((role) => (
                                    <button
                                        key={role}
                                        onClick={() => handleRoleSwitch(role)}
                                        className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors group"
                                    >
                                        <span className={`text-sm font-medium ${role === user.role ? 'text-blue-600' : 'text-slate-700 group-hover:text-slate-900'}`}>
                                            {getRoleLabel(role)}
                                        </span>
                                        {role === user.role && <Check size={16} className="text-blue-600" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center">
                            <UserIcon size={16} />
                        </div>
                        <div className="flex flex-col text-sm">
                            <span className="font-medium text-slate-700">{user?.name}</span>
                            <span className="text-xs text-slate-500">{getRoleLabel(user?.role || '')}</span>
                        </div>
                    </div>
                )}

                <div className="h-8 w-px bg-slate-200"></div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                    title="登出"
                >
                    <LogOut size={18} />
                    <span>登出</span>
                </button>
            </div>
        </header>
    );
};

export default TopBar;

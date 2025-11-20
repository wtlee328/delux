import React, { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { validateUserForm } from '../../utils/validation';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'supplier' | 'agency';
  roles: ('admin' | 'supplier' | 'agency')[];
  createdAt: string;
}

const AdminUsersPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'supplier' as 'admin' | 'supplier' | 'agency',
    roles: [] as ('admin' | 'supplier' | 'agency')[],
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/users');
      setUsers(response.data);
    } catch (err: any) {
      showError('無法載入用戶列表');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRoleCheckboxChange = (role: 'admin' | 'supplier' | 'agency') => {
    setFormData(prev => {
      const roles = prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role];
      return { ...prev, roles };
    });
  };

  const handleEdit = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setFormData({
      email: userToEdit.email,
      password: '',
      name: userToEdit.name,
      role: userToEdit.role,
      roles: userToEdit.roles || [userToEdit.role],
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'supplier',
      roles: [],
    });
    setShowForm(false);
    setFieldErrors({});
  };

  const handleDelete = async (userId: string, userName: string, userEmail: string) => {
    const confirmMessage = `⚠️ 警告：刪除用戶帳號\n\n您即將刪除用戶：\n姓名：${userName}\n電子郵件：${userEmail}\n\n此操作將永久刪除該用戶的帳號及相關數據，且無法撤銷。\n\n確定要繼續嗎？`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await axios.delete(`/api/admin/users/${userId}`);
      showSuccess('用戶已成功刪除');
      await fetchUsers();
    } catch (err: any) {
      showError('刪除用戶失敗，請稍後再試');
      console.error('Error deleting user:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate at least one role is selected
    if (formData.roles.length === 0) {
      setFieldErrors({ role: '請至少選擇一個角色' });
      showError('請至少選擇一個角色');
      return;
    }

    // For edit, password is optional
    if (!editingUser) {
      const validation = validateUserForm(formData);
      if (!validation.isValid) {
        setFieldErrors(validation.errors);
        showError('請修正表單錯誤');
        return;
      }
    }

    try {
      setSubmitting(true);
      setFieldErrors({});

      if (editingUser) {
        // Update existing user
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          roles: formData.roles,
        };

        // Only include password if it's been changed
        if (formData.password) {
          updateData.password = formData.password;
        }

        await axios.put(`/api/admin/users/${editingUser.id}`, updateData);
        showSuccess('用戶更新成功');
      } else {
        // Create new user
        await axios.post('/api/admin/users', formData);
        showSuccess('用戶創建成功');
      }

      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'supplier',
        roles: [],
      });
      setEditingUser(null);

      // Refresh user list
      await fetchUsers();

      // Hide form after a short delay
      setTimeout(() => {
        setShowForm(false);
      }, 1000);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setFieldErrors({ email: '此電子郵件已被註冊' });
        showError('此電子郵件已被註冊');
      } else {
        showError(editingUser ? '更新用戶失敗，請稍後再試' : '創建用戶失敗，請稍後再試');
      }
      console.error('Error saving user:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '帝樂 Admin';
      case 'supplier':
        return '當地供應商';
      case 'agency':
        return '台灣旅行社';
      default:
        return role;
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const nameMatch = u.name.toLowerCase().includes(query);
    const emailMatch = u.email.toLowerCase().includes(query);

    return nameMatch || emailMatch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white px-8 py-4 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold text-slate-800">用戶管理</h1>
          <nav className="flex gap-4">
            <button onClick={() => navigate('/admin/users')} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium">用戶管理</button>
            <button onClick={() => navigate('/admin/tours')} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium">產品管理</button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-600 font-medium">{user?.name} ({getRoleLabel(user?.role || '')})</span>
          <button onClick={logout} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium">
            登出
          </button>
        </div>
      </header>
      <main className="p-8 max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center gap-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="搜尋用戶 (姓名或電子郵件)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent shadow-sm"
            />
          </div>
          <button
            onClick={() => {
              if (showForm) {
                handleCancelEdit();
              } else {
                setShowForm(true);
              }
            }}
            className={`px-6 py-3 rounded-lg font-medium transition-colors shadow-sm ${showForm ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
          >
            {showForm ? '取消' : '新增用戶'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8 animate-in fade-in slide-in-from-top-4 duration-200">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">{editingUser ? '編輯用戶' : '新增用戶'}</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="font-semibold text-slate-700 text-sm">
                  電子郵件 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className={`px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all ${fieldErrors.email ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
                {fieldErrors.email && (
                  <span className="text-red-500 text-sm mt-1">{fieldErrors.email}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="font-semibold text-slate-700 text-sm">
                  {editingUser ? '新密碼 (留空表示不更改)' : '臨時密碼'} {!editingUser && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={submitting}
                  placeholder={editingUser ? '留空表示不更改密碼' : ''}
                  className={`px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all ${fieldErrors.password ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
                {fieldErrors.password && (
                  <span className="text-red-500 text-sm mt-1">{fieldErrors.password}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="font-semibold text-slate-700 text-sm">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className={`px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all ${fieldErrors.name ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
                {fieldErrors.name && (
                  <span className="text-red-500 text-sm mt-1">{fieldErrors.name}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-semibold text-slate-700 text-sm">
                  角色 <span className="text-red-500">*</span>
                  <span className="text-slate-400 font-normal text-xs ml-2">(可選擇多個)</span>
                </label>
                <div className="flex flex-col gap-3 py-2">
                  <label className="flex items-center gap-3 cursor-pointer text-slate-700 hover:text-slate-900 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.roles.includes('supplier')}
                      onChange={() => handleRoleCheckboxChange('supplier')}
                      disabled={submitting}
                      className="w-5 h-5 rounded border-slate-300 text-slate-800 focus:ring-slate-400"
                    />
                    <span>當地供應商</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer text-slate-700 hover:text-slate-900 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.roles.includes('agency')}
                      onChange={() => handleRoleCheckboxChange('agency')}
                      disabled={submitting}
                      className="w-5 h-5 rounded border-slate-300 text-slate-800 focus:ring-slate-400"
                    />
                    <span>台灣旅行社</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer text-slate-700 hover:text-slate-900 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.roles.includes('admin')}
                      onChange={() => handleRoleCheckboxChange('admin')}
                      disabled={submitting}
                      className="w-5 h-5 rounded border-slate-300 text-slate-800 focus:ring-slate-400"
                    />
                    <span>帝樂 Admin</span>
                  </label>
                </div>
                {fieldErrors.role && (
                  <span className="text-red-500 text-sm mt-1">{fieldErrors.role}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {submitting ? (editingUser ? '更新中...' : '創建中...') : (editingUser ? '更新用戶' : '創建用戶')}
              </button>
            </form>
          </div>
        )}

        {loading && <p className="text-center text-slate-500 py-8">載入中...</p>}
        {!loading && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 text-sm">姓名</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 text-sm">電子郵件</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 text-sm">角色</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 text-sm">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-700 font-medium">{u.name}</td>
                    <td className="px-6 py-4 text-slate-600">{u.email}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {u.roles && u.roles.length > 0
                        ? u.roles.map(r => getRoleLabel(r)).join(', ')
                        : getRoleLabel(u.role)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEdit(u)}
                          className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-sm rounded-md transition-colors font-medium"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.name, u.email)}
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
            {users.length === 0 && (
              <p className="p-8 text-center text-slate-500">尚無用戶</p>
            )}
            {users.length > 0 && filteredUsers.length === 0 && (
              <p className="p-8 text-center text-slate-500">找不到符合搜尋條件的用戶</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminUsersPage;


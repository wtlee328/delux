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

  const handleDelete = async (userId: string, userName: string) => {
    if (!window.confirm(`確定要刪除用戶 "${userName}" 嗎？此操作無法撤銷。`)) {
      return;
    }

    try {
      await axios.delete(`/api/admin/users/${userId}`);
      showSuccess('用戶已刪除');
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

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1>用戶管理</h1>
          <nav style={styles.nav}>
            <button onClick={() => navigate('/admin/users')} style={styles.navLink}>用戶管理</button>
            <button onClick={() => navigate('/admin/tours')} style={styles.navLink}>產品管理</button>
          </nav>
        </div>
        <div style={styles.userInfo}>
          <span>{user?.name} ({getRoleLabel(user?.role || '')})</span>
          <button onClick={logout} style={styles.logoutButton}>
            登出
          </button>
        </div>
      </header>
      <main style={styles.main}>
        <div style={styles.actionBar}>
          <button 
            onClick={() => {
              if (showForm) {
                handleCancelEdit();
              } else {
                setShowForm(true);
              }
            }} 
            style={styles.addButton}
          >
            {showForm ? '取消' : '新增用戶'}
          </button>
        </div>

        {showForm && (
          <div style={styles.formContainer}>
            <h2 style={styles.formTitle}>{editingUser ? '編輯用戶' : '新增用戶'}</h2>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label htmlFor="email" style={styles.label}>
                  電子郵件 <span style={styles.required}>*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={submitting}
                  style={{
                    ...styles.input,
                    ...(fieldErrors.email ? styles.inputError : {})
                  }}
                />
                {fieldErrors.email && (
                  <span style={styles.errorText}>{fieldErrors.email}</span>
                )}
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="password" style={styles.label}>
                  {editingUser ? '新密碼 (留空表示不更改)' : '臨時密碼'} {!editingUser && <span style={styles.required}>*</span>}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={submitting}
                  placeholder={editingUser ? '留空表示不更改密碼' : ''}
                  style={{
                    ...styles.input,
                    ...(fieldErrors.password ? styles.inputError : {})
                  }}
                />
                {fieldErrors.password && (
                  <span style={styles.errorText}>{fieldErrors.password}</span>
                )}
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="name" style={styles.label}>
                  姓名 <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={submitting}
                  style={{
                    ...styles.input,
                    ...(fieldErrors.name ? styles.inputError : {})
                  }}
                />
                {fieldErrors.name && (
                  <span style={styles.errorText}>{fieldErrors.name}</span>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  角色 <span style={styles.required}>*</span>
                  <span style={styles.helpText}> (可選擇多個)</span>
                </label>
                <div style={styles.checkboxGroup}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.roles.includes('supplier')}
                      onChange={() => handleRoleCheckboxChange('supplier')}
                      disabled={submitting}
                      style={styles.checkbox}
                    />
                    <span>當地供應商</span>
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.roles.includes('agency')}
                      onChange={() => handleRoleCheckboxChange('agency')}
                      disabled={submitting}
                      style={styles.checkbox}
                    />
                    <span>台灣旅行社</span>
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.roles.includes('admin')}
                      onChange={() => handleRoleCheckboxChange('admin')}
                      disabled={submitting}
                      style={styles.checkbox}
                    />
                    <span>帝樂 Admin</span>
                  </label>
                </div>
                {fieldErrors.role && (
                  <span style={styles.errorText}>{fieldErrors.role}</span>
                )}
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                style={submitting ? { ...styles.submitButton, ...styles.submitButtonDisabled } : styles.submitButton}
              >
                {submitting ? (editingUser ? '更新中...' : '創建中...') : (editingUser ? '更新用戶' : '創建用戶')}
              </button>
            </form>
          </div>
        )}

        {loading && <p>載入中...</p>}
        {!loading && (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>姓名</th>
                  <th style={styles.th}>電子郵件</th>
                  <th style={styles.th}>角色</th>
                  <th style={styles.th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={styles.tr}>
                    <td style={styles.td}>{u.name}</td>
                    <td style={styles.td}>{u.email}</td>
                    <td style={styles.td}>
                      {u.roles && u.roles.length > 0
                        ? u.roles.map(r => getRoleLabel(r)).join(', ')
                        : getRoleLabel(u.role)}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button
                          onClick={() => handleEdit(u)}
                          style={styles.editButton}
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          style={styles.deleteButton}
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
              <p style={styles.emptyMessage}>尚無用戶</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: '1rem 2rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  },
  nav: {
    display: 'flex',
    gap: '1rem',
  },
  navLink: {
    padding: '0.5rem 1rem',
    textDecoration: 'none',
    color: '#495057',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  main: {
    padding: '2rem',
  },
  actionBar: {
    marginBottom: '1.5rem',
  },
  addButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 500,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    padding: '2rem',
    marginBottom: '2rem',
  },
  formTitle: {
    marginTop: 0,
    marginBottom: '1.5rem',
    fontSize: '1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  label: {
    fontWeight: 500,
    fontSize: '0.95rem',
  },
  required: {
    color: '#dc3545',
  },
  input: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    outline: 'none',
  },
  select: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    outline: 'none',
    backgroundColor: 'white',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    padding: '0.5rem 0',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  helpText: {
    fontSize: '0.875rem',
    color: '#6c757d',
    fontWeight: 'normal',
  },
  submitButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 500,
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed',
  },
  inputError: {
    borderColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    fontSize: '0.875rem',
    marginTop: '0.25rem',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    padding: '1rem',
    textAlign: 'left' as const,
    backgroundColor: '#f8f9fa',
    fontWeight: 600,
    borderBottom: '2px solid #dee2e6',
  },
  tr: {
    borderBottom: '1px solid #dee2e6',
  },
  td: {
    padding: '1rem',
  },
  emptyMessage: {
    padding: '2rem',
    textAlign: 'center' as const,
    color: '#6c757d',
  },
  actionButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  editButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'background-color 0.2s',
  },
  deleteButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'background-color 0.2s',
  },
};

export default AdminUsersPage;

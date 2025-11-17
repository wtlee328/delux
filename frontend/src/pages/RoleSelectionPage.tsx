import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../config/axios';
import { useToast } from '../components/Toast';

interface LocationState {
  roles: ('admin' | 'supplier' | 'agency')[];
  userName: string;
}

const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const state = location.state as LocationState;
  const roles = state?.roles || [];
  const userName = state?.userName || '';

  // If no roles provided, redirect to login
  React.useEffect(() => {
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
      const response = await axios.post('/api/auth/select-role', { role });
      const { token, user } = response.data;

      // Update localStorage with new token and user info
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Update axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Navigate to appropriate dashboard
      navigate(getRedirectPath(role));
    } catch (error) {
      console.error('Role selection error:', error);
      showError('角色選擇失敗，請重試');
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>選擇您的角色</h1>
          <p style={styles.subtitle}>
            歡迎回來，{userName}！請選擇您要使用的角色
          </p>
        </div>

        <div style={styles.roleGrid}>
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => handleRoleSelect(role)}
              disabled={isLoading}
              style={styles.roleButton}
            >
              <div style={styles.roleIcon}>{getRoleIcon(role)}</div>
              <div style={styles.roleLabel}>{getRoleLabel(role)}</div>
              <div style={styles.roleDescription}>{getRoleDescription(role)}</div>
            </button>
          ))}
        </div>

        <div style={styles.footer}>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/login');
            }}
            style={styles.backButton}
            disabled={isLoading}
          >
            返回登入
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '1rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '2.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '600px',
  },
  header: {
    marginBottom: '2rem',
    textAlign: 'center' as const,
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#666',
  },
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  roleButton: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '1.5rem 1rem',
    backgroundColor: 'white',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      borderColor: '#007bff',
      backgroundColor: '#f8f9fa',
    },
  },
  roleIcon: {
    fontSize: '3rem',
    marginBottom: '0.75rem',
  },
  roleLabel: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '0.25rem',
  },
  roleDescription: {
    fontSize: '0.75rem',
    color: '#666',
    textAlign: 'center' as const,
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid #eee',
  },
  backButton: {
    padding: '0.5rem 1.5rem',
    backgroundColor: 'transparent',
    color: '#666',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default RoleSelectionPage;

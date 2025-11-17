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
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Delux+ 帝樂旅遊平台</h1>
          <p style={styles.subtitle}>B2B2B Travel Supply Chain Platform</p>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>
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
              style={{
                ...styles.input,
                ...(errors.email ? styles.inputError : {})
              }}
              disabled={isLoading}
              placeholder="請輸入您的電子郵件"
            />
            {errors.email && (
              <span style={styles.errorText}>{errors.email}</span>
            )}
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>
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
              style={{
                ...styles.input,
                ...(errors.password ? styles.inputError : {})
              }}
              disabled={isLoading}
              placeholder="請輸入您的密碼"
            />
            {errors.password && (
              <span style={styles.errorText}>{errors.password}</span>
            )}
          </div>

          <button
            type="submit"
            style={styles.button}
            disabled={isLoading}
          >
            {isLoading ? '登入中...' : '登入'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            <span style={styles.contextLinkDisabled}>您是供應商嗎？</span>
            {' · '}
            <span style={styles.contextLinkDisabled}>管理員登入</span>
          </p>
          <p style={styles.helpText}>
            使用您的帳號登入以存取平台功能
          </p>
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
    maxWidth: '440px',
  },
  header: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    textAlign: 'center' as const,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#666',
    textAlign: 'center' as const,
    fontWeight: '400',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#333',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '1rem',
    transition: 'border-color 0.2s',
  },
  inputError: {
    borderColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    fontSize: '0.75rem',
    marginTop: '0.25rem',
  },
  button: {
    padding: '0.875rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '0.5rem',
    transition: 'background-color 0.2s',
  },
  footer: {
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #eee',
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: '0.875rem',
    color: '#666',
    marginBottom: '0.5rem',
  },
  contextLinkDisabled: {
    color: '#999',
    fontWeight: '500',
  },
  helpText: {
    fontSize: '0.75rem',
    color: '#999',
    marginTop: '0.5rem',
  },
};

export default LoginPage;

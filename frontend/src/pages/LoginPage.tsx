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
  }, [user, navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Delux+ 帝樂旅遊平台</h1>
        <p style={styles.subtitle}>B2B2B Travel Supply Chain Platform</p>
        
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
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#666',
    marginBottom: '2rem',
    textAlign: 'center' as const,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  input: {
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
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
    padding: '0.75rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
};

export default LoginPage;

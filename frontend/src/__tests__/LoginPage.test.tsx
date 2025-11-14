import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import LoginPage from '../pages/LoginPage';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../components/Toast';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <LoginPage />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it('renders login form with email and password fields', () => {
    renderLoginPage();
    
    expect(screen.getByLabelText(/電子郵件/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/密碼/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /登入/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderLoginPage();
    const user = userEvent.setup();
    
    const submitButton = screen.getByRole('button', { name: /登入/i });
    await user.click(submitButton);
    
    // Custom validation should show error messages
    await waitFor(() => {
      expect(screen.getByText(/電子郵件為必填/i)).toBeInTheDocument();
    });
  });

  it('handles successful login and redirects admin to /admin/users', async () => {
    const mockUser = {
      id: '1',
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'admin',
    };
    
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        token: 'test-token',
        user: mockUser,
      },
    });

    renderLoginPage();
    const user = userEvent.setup();
    
    const emailInput = screen.getByLabelText(/電子郵件/i);
    const passwordInput = screen.getByLabelText(/密碼/i);
    const submitButton = screen.getByRole('button', { name: /登入/i });
    
    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'admin@test.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
    });
    
    expect(localStorage.getItem('token')).toBe('test-token');
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
  });

  it('handles successful login and redirects supplier to /supplier/dashboard', async () => {
    const mockUser = {
      id: '2',
      email: 'supplier@test.com',
      name: 'Supplier User',
      role: 'supplier',
    };
    
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        token: 'test-token',
        user: mockUser,
      },
    });

    renderLoginPage();
    const user = userEvent.setup();
    
    const emailInput = screen.getByLabelText(/電子郵件/i);
    const passwordInput = screen.getByLabelText(/密碼/i);
    const submitButton = screen.getByRole('button', { name: /登入/i });
    
    await user.type(emailInput, 'supplier@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/supplier/dashboard');
    });
  });

  it('handles successful login and redirects agency to /agency/dashboard', async () => {
    const mockUser = {
      id: '3',
      email: 'agency@test.com',
      name: 'Agency User',
      role: 'agency',
    };
    
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        token: 'test-token',
        user: mockUser,
      },
    });

    renderLoginPage();
    const user = userEvent.setup();
    
    const emailInput = screen.getByLabelText(/電子郵件/i);
    const passwordInput = screen.getByLabelText(/密碼/i);
    const submitButton = screen.getByRole('button', { name: /登入/i });
    
    await user.type(emailInput, 'agency@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/agency/dashboard');
    });
  });

  it('displays error message for invalid credentials', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        status: 401,
        data: { message: 'Invalid credentials' },
      },
    });

    renderLoginPage();
    const user = userEvent.setup();
    
    const emailInput = screen.getByLabelText(/電子郵件/i);
    const passwordInput = screen.getByLabelText(/密碼/i);
    const submitButton = screen.getByRole('button', { name: /登入/i });
    
    await user.type(emailInput, 'wrong@test.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('電子郵件或密碼無效');
    });
    
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('displays generic error message for server errors', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        status: 500,
        data: { message: 'Server error' },
      },
    });

    renderLoginPage();
    const user = userEvent.setup();
    
    const emailInput = screen.getByLabelText(/電子郵件/i);
    const passwordInput = screen.getByLabelText(/密碼/i);
    const submitButton = screen.getByRole('button', { name: /登入/i });
    
    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('登入失敗，請稍後再試');
    });
  });

  it('disables form during submission', async () => {
    mockedAxios.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderLoginPage();
    const user = userEvent.setup();
    
    const emailInput = screen.getByLabelText(/電子郵件/i);
    const passwordInput = screen.getByLabelText(/密碼/i);
    const submitButton = screen.getByRole('button', { name: /登入/i });
    
    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    expect(screen.getByRole('button', { name: /登入中/i })).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
  });
});

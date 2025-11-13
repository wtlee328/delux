import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import { AuthProvider } from '../contexts/AuthContext';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

const mockAdminUser = {
  id: '1',
  email: 'admin@test.com',
  name: 'Admin User',
  role: 'admin' as const,
};

const mockUsers = [
  {
    id: '1',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'supplier@test.com',
    name: 'Supplier User',
    role: 'supplier',
    createdAt: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    email: 'agency@test.com',
    name: 'Agency User',
    role: 'agency',
    createdAt: '2024-01-03T00:00:00Z',
  },
];

const renderAdminUsersPage = () => {
  // Mock localStorage to simulate logged-in admin
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('user', JSON.stringify(mockAdminUser));
  
  // Set axios default header
  mockedAxios.defaults = { headers: { common: {} } };
  
  return render(
    <BrowserRouter>
      <AuthProvider>
        <AdminUsersPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('User List Rendering', () => {
    it('renders user list with name, email, and role columns', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockUsers });

      renderAdminUsersPage();

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument();
      });

      expect(screen.getByText('admin@test.com')).toBeInTheDocument();
      expect(screen.getByText('帝樂 Admin')).toBeInTheDocument();
      
      expect(screen.getByText('Supplier User')).toBeInTheDocument();
      expect(screen.getByText('supplier@test.com')).toBeInTheDocument();
      expect(screen.getByText('當地供應商')).toBeInTheDocument();
      
      expect(screen.getByText('Agency User')).toBeInTheDocument();
      expect(screen.getByText('agency@test.com')).toBeInTheDocument();
      expect(screen.getByText('台灣旅行社')).toBeInTheDocument();
    });

    it('fetches users from GET /api/admin/users', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockUsers });

      renderAdminUsersPage();

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/admin/users');
      });
    });

    it('displays loading state while fetching users', () => {
      mockedAxios.get.mockImplementation(() => new Promise(() => {}));

      renderAdminUsersPage();

      expect(screen.getByText('載入中...')).toBeInTheDocument();
    });

    it('displays error message when fetch fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      renderAdminUsersPage();

      await waitFor(() => {
        expect(screen.getByText('無法載入用戶列表')).toBeInTheDocument();
      });
    });

    it('displays empty message when no users exist', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [] });

      renderAdminUsersPage();

      await waitFor(() => {
        expect(screen.getByText('尚無用戶')).toBeInTheDocument();
      });
    });
  });

  describe('User Creation Form', () => {
    it('shows form when "新增用戶" button is clicked', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockUsers });

      renderAdminUsersPage();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: '新增用戶' });
      await user.click(addButton);

      expect(screen.getByText('新增用戶')).toBeInTheDocument();
      expect(screen.getByLabelText(/電子郵件/)).toBeInTheDocument();
      expect(screen.getByLabelText(/臨時密碼/)).toBeInTheDocument();
      expect(screen.getByLabelText(/姓名/)).toBeInTheDocument();
      expect(screen.getByLabelText(/角色/)).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockUsers });

      renderAdminUsersPage();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: '新增用戶' });
      await user.click(addButton);

      // Check that required fields have the required attribute
      const emailInput = screen.getByLabelText(/電子郵件/) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/臨時密碼/) as HTMLInputElement;
      const nameInput = screen.getByLabelText(/姓名/) as HTMLInputElement;
      const roleSelect = screen.getByLabelText(/角色/) as HTMLSelectElement;

      expect(emailInput).toBeRequired();
      expect(passwordInput).toBeRequired();
      expect(nameInput).toBeRequired();
      expect(roleSelect).toBeRequired();
    });

    it('submits form with valid data to POST /api/admin/users', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockUsers });
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          id: '4',
          email: 'new@test.com',
          name: 'New User',
          role: 'supplier',
        },
      });
      mockedAxios.get.mockResolvedValueOnce({ data: [...mockUsers, {
        id: '4',
        email: 'new@test.com',
        name: 'New User',
        role: 'supplier',
        createdAt: '2024-01-04T00:00:00Z',
      }] });

      renderAdminUsersPage();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: '新增用戶' });
      await user.click(addButton);

      const emailInput = screen.getByLabelText(/電子郵件/);
      const passwordInput = screen.getByLabelText(/臨時密碼/);
      const nameInput = screen.getByLabelText(/姓名/);
      const roleSelect = screen.getByLabelText(/角色/);

      await user.type(emailInput, 'new@test.com');
      await user.type(passwordInput, 'password123');
      await user.type(nameInput, 'New User');
      await user.selectOptions(roleSelect, 'supplier');

      const submitButton = screen.getByRole('button', { name: '創建用戶' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith('/api/admin/users', {
          email: 'new@test.com',
          password: 'password123',
          name: 'New User',
          role: 'supplier',
        });
      });
    });

    it('displays success message on user creation', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockUsers });
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          id: '4',
          email: 'new@test.com',
          name: 'New User',
          role: 'supplier',
        },
      });
      mockedAxios.get.mockResolvedValueOnce({ data: mockUsers });

      renderAdminUsersPage();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: '新增用戶' });
      await user.click(addButton);

      await user.type(screen.getByLabelText(/電子郵件/), 'new@test.com');
      await user.type(screen.getByLabelText(/臨時密碼/), 'password123');
      await user.type(screen.getByLabelText(/姓名/), 'New User');

      const submitButton = screen.getByRole('button', { name: '創建用戶' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('用戶創建成功')).toBeInTheDocument();
      });
    });

    it('displays error for duplicate email', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockUsers });
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 409,
          data: { message: 'Email already exists' },
        },
      });

      renderAdminUsersPage();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: '新增用戶' });
      await user.click(addButton);

      await user.type(screen.getByLabelText(/電子郵件/), 'admin@test.com');
      await user.type(screen.getByLabelText(/臨時密碼/), 'password123');
      await user.type(screen.getByLabelText(/姓名/), 'Duplicate User');

      const submitButton = screen.getByRole('button', { name: '創建用戶' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('此電子郵件已被註冊')).toBeInTheDocument();
      });
    });

    it('clears form and refreshes user list after successful creation', async () => {
      const newUser = {
        id: '4',
        email: 'new@test.com',
        name: 'New User',
        role: 'supplier',
        createdAt: '2024-01-04T00:00:00Z',
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockUsers });
      mockedAxios.post.mockResolvedValueOnce({ data: newUser });
      mockedAxios.get.mockResolvedValueOnce({ data: [...mockUsers, newUser] });

      renderAdminUsersPage();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: '新增用戶' });
      await user.click(addButton);

      await user.type(screen.getByLabelText(/電子郵件/), 'new@test.com');
      await user.type(screen.getByLabelText(/臨時密碼/), 'password123');
      await user.type(screen.getByLabelText(/姓名/), 'New User');

      const submitButton = screen.getByRole('button', { name: '創建用戶' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(screen.getByText('New User')).toBeInTheDocument();
        expect(screen.getByText('new@test.com')).toBeInTheDocument();
      });
    });
  });
});

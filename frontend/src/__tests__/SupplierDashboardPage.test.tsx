import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import SupplierDashboardPage from '../pages/supplier/SupplierDashboardPage';
import { AuthProvider } from '../contexts/AuthContext';

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

const renderSupplierDashboard = () => {
  const mockUser = {
    id: '1',
    email: 'supplier@test.com',
    name: 'Test Supplier',
    role: 'supplier' as const,
  };
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('user', JSON.stringify(mockUser));

  return render(
    <BrowserRouter>
      <AuthProvider>
        <SupplierDashboardPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('SupplierDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it('renders product list with status badges', async () => {
    const mockProducts = [
      {
        id: '1',
        title: 'Tokyo Tour',
        status: 'published',
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        title: 'Osaka Adventure',
        status: 'pending',
        createdAt: '2024-01-02T00:00:00Z',
      },
    ];

    mockedAxios.get.mockResolvedValueOnce({ data: mockProducts });

    renderSupplierDashboard();

    await waitFor(() => {
      expect(screen.getByText('Tokyo Tour')).toBeInTheDocument();
      expect(screen.getByText('Osaka Adventure')).toBeInTheDocument();
    });

    expect(screen.getByText('已發佈')).toBeInTheDocument();
    expect(screen.getByText('待審核')).toBeInTheDocument();
  });

  it('displays loading state while fetching products', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {}));

    renderSupplierDashboard();

    expect(screen.getByText('載入中...')).toBeInTheDocument();
  });

  it('displays error message when fetch fails', async () => {
    mockedAxios.get.mockRejectedValueOnce({
      response: {
        data: { message: '載入產品失敗' },
      },
    });

    renderSupplierDashboard();

    await waitFor(() => {
      expect(screen.getByText('載入產品失敗')).toBeInTheDocument();
    });
  });

  it('displays empty state when no products exist', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    renderSupplierDashboard();

    await waitFor(() => {
      expect(screen.getByText('尚無產品')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /建立第一個產品/i })).toBeInTheDocument();
    });
  });

  it('navigates to create product page when clicking new product button', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    renderSupplierDashboard();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('尚無產品')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /建立第一個產品/i });
    await user.click(createButton);

    expect(mockNavigate).toHaveBeenCalledWith('/supplier/tours/new');
  });

  it('navigates to edit page when clicking edit button', async () => {
    const mockProducts = [
      {
        id: '1',
        title: 'Tokyo Tour',
        status: 'published',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    mockedAxios.get.mockResolvedValueOnce({ data: mockProducts });

    renderSupplierDashboard();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('Tokyo Tour')).toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: /編輯/i });
    await user.click(editButton);

    expect(mockNavigate).toHaveBeenCalledWith('/supplier/tours/edit/1');
  });

  it('displays products in table format with correct columns', async () => {
    const mockProducts = [
      {
        id: '1',
        title: 'Tokyo Tour',
        status: 'published',
        createdAt: '2024-01-15T00:00:00Z',
      },
    ];

    mockedAxios.get.mockResolvedValueOnce({ data: mockProducts });

    renderSupplierDashboard();

    await waitFor(() => {
      expect(screen.getByText('產品標題')).toBeInTheDocument();
      expect(screen.getByText('狀態')).toBeInTheDocument();
      expect(screen.getByText('建立日期')).toBeInTheDocument();
      expect(screen.getByText('操作')).toBeInTheDocument();
    });
  });

  it('formats creation date correctly', async () => {
    const mockProducts = [
      {
        id: '1',
        title: 'Tokyo Tour',
        status: 'published',
        createdAt: '2024-01-15T00:00:00Z',
      },
    ];

    mockedAxios.get.mockResolvedValueOnce({ data: mockProducts });

    renderSupplierDashboard();

    await waitFor(() => {
      expect(screen.getByText('Tokyo Tour')).toBeInTheDocument();
    });

    const formattedDate = new Date('2024-01-15T00:00:00Z').toLocaleDateString('zh-TW');
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });

  it('navigates to create product page from action bar button', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    renderSupplierDashboard();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('我的產品')).toBeInTheDocument();
    });

    const createButtons = screen.getAllByRole('button', { name: /新增產品/i });
    await user.click(createButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/supplier/tours/new');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import AdminToursPage from '../pages/admin/AdminToursPage';
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

const mockAdminUser = {
  id: '1',
  email: 'admin@test.com',
  name: 'Admin User',
  role: 'admin' as const,
};

const mockProducts = [
  {
    id: '1',
    title: '東京五日遊',
    supplierName: 'Tokyo Tours',
    status: 'pending',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: '大阪美食之旅',
    supplierName: 'Osaka Adventures',
    status: 'published',
    createdAt: '2024-01-02T00:00:00Z',
  },
];

const renderAdminToursPage = () => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('user', JSON.stringify(mockAdminUser));
  
  mockedAxios.defaults = { headers: { common: {} } };
  
  return render(
    <BrowserRouter>
      <AuthProvider>
        <AdminToursPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AdminToursPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockNavigate.mockClear();
  });

  describe('Product List Rendering', () => {
    it('renders product list with 產品標題, 供應商名稱, and status columns', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockProducts });

      renderAdminToursPage();

      await waitFor(() => {
        expect(screen.getByText('東京五日遊')).toBeInTheDocument();
      });

      expect(screen.getByText('Tokyo Tours')).toBeInTheDocument();
      expect(screen.getByText('待審核')).toBeInTheDocument();
      
      expect(screen.getByText('大阪美食之旅')).toBeInTheDocument();
      expect(screen.getByText('Osaka Adventures')).toBeInTheDocument();
      expect(screen.getByText('已發佈')).toBeInTheDocument();
    });

    it('fetches products from GET /api/admin/tours', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockProducts });

      renderAdminToursPage();

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/admin/tours');
      });
    });

    it('displays loading state while fetching products', () => {
      mockedAxios.get.mockImplementation(() => new Promise(() => {}));

      renderAdminToursPage();

      expect(screen.getByText('載入中...')).toBeInTheDocument();
    });

    it('displays error message when fetch fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      renderAdminToursPage();

      await waitFor(() => {
        expect(screen.getByText('無法載入產品列表')).toBeInTheDocument();
      });
    });

    it('displays empty message when no products exist', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [] });

      renderAdminToursPage();

      await waitFor(() => {
        expect(screen.getByText('尚無產品')).toBeInTheDocument();
      });
    });

    it('navigates to product detail when clicking on a product', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockProducts });

      renderAdminToursPage();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('東京五日遊')).toBeInTheDocument();
      });

      const productRow = screen.getByText('東京五日遊').closest('tr');
      if (productRow) {
        await user.click(productRow);
      }

      expect(mockNavigate).toHaveBeenCalledWith('/admin/tours/1');
    });
  });
});

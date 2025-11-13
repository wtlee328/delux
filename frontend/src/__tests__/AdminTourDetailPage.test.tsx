import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import AdminTourDetailPage from '../pages/admin/AdminTourDetailPage';
import { AuthProvider } from '../contexts/AuthContext';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
const mockParams = { id: '1' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

const mockAdminUser = {
  id: '1',
  email: 'admin@test.com',
  name: 'Admin User',
  role: 'admin' as const,
};

const mockProduct = {
  id: '1',
  title: '東京五日遊',
  destination: '東京',
  durationDays: 5,
  description: '<p>這是一個精彩的東京之旅</p>',
  coverImageUrl: 'https://example.com/image.jpg',
  netPrice: 25000,
  status: 'pending',
  supplierName: 'Tokyo Tours',
  createdAt: '2024-01-01T00:00:00Z',
};

const renderAdminTourDetailPage = () => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('user', JSON.stringify(mockAdminUser));
  
  mockedAxios.defaults = { headers: { common: {} } };
  
  return render(
    <BrowserRouter>
      <AuthProvider>
        <AdminTourDetailPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AdminTourDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockNavigate.mockClear();
    mockParams.id = '1';
  });

  describe('Product Detail Display', () => {
    it('displays all product details', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockProduct });

      renderAdminTourDetailPage();

      await waitFor(() => {
        expect(screen.getByText('東京五日遊')).toBeInTheDocument();
      });

      expect(screen.getByText('Tokyo Tours')).toBeInTheDocument();
      expect(screen.getByText('東京')).toBeInTheDocument();
      expect(screen.getByText('5 天')).toBeInTheDocument();
      expect(screen.getByText('NT$25,000')).toBeInTheDocument();
      expect(screen.getAllByText('待審核').length).toBeGreaterThan(0);
      
      const description = screen.getByText('這是一個精彩的東京之旅');
      expect(description).toBeInTheDocument();
      
      const image = screen.getByAltText('東京五日遊') as HTMLImageElement;
      expect(image.src).toBe('https://example.com/image.jpg');
    });

    it('fetches product details from GET /api/admin/tours/:id', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockProduct });

      renderAdminTourDetailPage();

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/admin/tours/1');
      });
    });

    it('displays loading state while fetching product', () => {
      mockedAxios.get.mockImplementation(() => new Promise(() => {}));

      renderAdminTourDetailPage();

      expect(screen.getByText('載入中...')).toBeInTheDocument();
    });

    it('displays error message when fetch fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      renderAdminTourDetailPage();

      await waitFor(() => {
        expect(screen.getByText('無法載入產品詳情')).toBeInTheDocument();
      });
    });
  });

  describe('Product Status Update', () => {
    it('displays status update buttons', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockProduct });

      renderAdminTourDetailPage();

      await waitFor(() => {
        expect(screen.getByText('東京五日遊')).toBeInTheDocument();
      });

      const pendingButton = screen.getByRole('button', { name: '待審核' });
      const publishedButton = screen.getByRole('button', { name: '已發佈' });

      expect(pendingButton).toBeInTheDocument();
      expect(publishedButton).toBeInTheDocument();
    });

    it('updates status to published when clicking 已發佈 button', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockProduct });
      mockedAxios.put.mockResolvedValueOnce({ 
        data: { ...mockProduct, status: 'published' } 
      });

      renderAdminTourDetailPage();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('東京五日遊')).toBeInTheDocument();
      });

      const publishedButton = screen.getByRole('button', { name: '已發佈' });
      await user.click(publishedButton);

      await waitFor(() => {
        expect(mockedAxios.put).toHaveBeenCalledWith('/api/admin/tours/1/status', {
          status: 'published',
        });
      });
    });

    it('updates status to pending when clicking 待審核 button', async () => {
      const publishedProduct = { ...mockProduct, status: 'published' };
      mockedAxios.get.mockResolvedValueOnce({ data: publishedProduct });
      mockedAxios.put.mockResolvedValueOnce({ 
        data: { ...publishedProduct, status: 'pending' } 
      });

      renderAdminTourDetailPage();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('東京五日遊')).toBeInTheDocument();
      });

      const pendingButton = screen.getByRole('button', { name: '待審核' });
      await user.click(pendingButton);

      await waitFor(() => {
        expect(mockedAxios.put).toHaveBeenCalledWith('/api/admin/tours/1/status', {
          status: 'pending',
        });
      });
    });

    it('displays success message after status update', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockProduct });
      mockedAxios.put.mockResolvedValueOnce({ 
        data: { ...mockProduct, status: 'published' } 
      });

      renderAdminTourDetailPage();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('東京五日遊')).toBeInTheDocument();
      });

      const publishedButton = screen.getByRole('button', { name: '已發佈' });
      await user.click(publishedButton);

      await waitFor(() => {
        expect(screen.getByText('狀態更新成功')).toBeInTheDocument();
      });
    });

    it('displays error message when status update fails', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockProduct });
      mockedAxios.put.mockRejectedValueOnce(new Error('Network error'));

      renderAdminTourDetailPage();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('東京五日遊')).toBeInTheDocument();
      });

      const publishedButton = screen.getByRole('button', { name: '已發佈' });
      await user.click(publishedButton);

      await waitFor(() => {
        expect(screen.getByText('更新狀態失敗')).toBeInTheDocument();
      });
    });

    it('updates UI immediately after status change', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockProduct });
      mockedAxios.put.mockResolvedValueOnce({ 
        data: { ...mockProduct, status: 'published' } 
      });

      renderAdminTourDetailPage();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('東京五日遊')).toBeInTheDocument();
      });

      // Initially shows 待審核
      expect(screen.getAllByText('待審核').length).toBeGreaterThan(0);

      const publishedButton = screen.getByRole('button', { name: '已發佈' });
      await user.click(publishedButton);

      await waitFor(() => {
        // After update, should show 已發佈
        const statusElements = screen.getAllByText('已發佈');
        expect(statusElements.length).toBeGreaterThan(0);
      });
    });
  });
});

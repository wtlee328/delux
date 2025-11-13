import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import AgencyTourDetailPage from '../pages/agency/AgencyTourDetailPage';
import { AuthProvider } from '../contexts/AuthContext';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock useNavigate and useParams
const mockNavigate = vi.fn();
const mockParams = { id: 'product-123' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

const mockAgencyUser = {
  id: '1',
  email: 'agency@test.com',
  name: 'Agency User',
  role: 'agency' as const,
};

const mockProductDetail = {
  id: 'product-123',
  title: '東京五日遊',
  destination: 'Tokyo',
  durationDays: 5,
  description: '<p>這是一個精彩的<strong>東京之旅</strong>，包含<img src="https://example.com/image.jpg" />景點。</p>',
  coverImageUrl: 'https://example.com/tokyo.jpg',
  netPrice: 25000,
  supplierName: 'Tokyo Tours',
};

const renderAgencyTourDetailPage = () => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('user', JSON.stringify(mockAgencyUser));
  
  mockedAxios.defaults = { headers: { common: {} } };
  
  return render(
    <BrowserRouter>
      <AuthProvider>
        <AgencyTourDetailPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AgencyTourDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockNavigate.mockClear();
  });

  describe('Product Detail Display', () => {
    it('displays complete product information', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockProductDetail });

      renderAgencyTourDetailPage();

      await waitFor(() => {
        expect(screen.getByText('東京五日遊')).toBeInTheDocument();
      });

      expect(screen.getByText('Tokyo')).toBeInTheDocument();
      expect(screen.getByText('5天')).toBeInTheDocument();
      expect(screen.getByText('Tokyo Tours')).toBeInTheDocument();
      expect(screen.getByText('NT$25,000')).toBeInTheDocument();
    });

    it('renders rich text 產品描述 with formatting and images', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockProductDetail });

      renderAgencyTourDetailPage();

      await waitFor(() => {
        expect(screen.getByText('東京五日遊')).toBeInTheDocument();
      });

      const descriptionSection = screen.getByText('產品描述').parentElement;
      expect(descriptionSection?.innerHTML).toContain('<strong>東京之旅</strong>');
      expect(descriptionSection?.innerHTML).toContain('<img src="https://example.com/image.jpg"');
    });

    it('formats 淨價 in TWD currency format', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockProductDetail });

      renderAgencyTourDetailPage();

      await waitFor(() => {
        expect(screen.getByText('NT$25,000')).toBeInTheDocument();
      });
    });

    it('fetches product details from GET /api/agency/tours/:id', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockProductDetail });

      renderAgencyTourDetailPage();

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/agency/tours/product-123');
      });
    });

    it('displays loading state while fetching product', () => {
      mockedAxios.get.mockImplementation(() => new Promise(() => {}));

      renderAgencyTourDetailPage();

      expect(screen.getByText('載入中...')).toBeInTheDocument();
    });

    it('displays error message when fetch fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      renderAgencyTourDetailPage();

      await waitFor(() => {
        expect(screen.getByText('無法載入產品詳情')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates back to dashboard when clicking back button', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockProductDetail });

      renderAgencyTourDetailPage();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText(/返回產品列表/)).toBeInTheDocument();
      });

      const backButton = screen.getByText(/返回產品列表/);
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/agency/dashboard');
    });
  });
});

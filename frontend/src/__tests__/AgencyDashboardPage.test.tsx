import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import AgencyDashboardPage from '../pages/agency/AgencyDashboardPage';
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

const mockAgencyUser = {
  id: '1',
  email: 'agency@test.com',
  name: 'Agency User',
  role: 'agency' as const,
};

const mockProducts = [
  {
    id: '1',
    title: '東京五日遊',
    destination: 'Tokyo',
    durationDays: 5,
    coverImageUrl: 'https://example.com/tokyo.jpg',
    netPrice: 25000,
    supplierName: 'Tokyo Tours',
  },
  {
    id: '2',
    title: '大阪美食之旅',
    destination: 'Osaka',
    durationDays: 3,
    coverImageUrl: 'https://example.com/osaka.jpg',
    netPrice: 18000,
    supplierName: 'Osaka Adventures',
  },
];

const renderAgencyDashboardPage = () => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('user', JSON.stringify(mockAgencyUser));
  
  mockedAxios.defaults = { headers: { common: {} } };
  
  return render(
    <BrowserRouter>
      <AuthProvider>
        <AgencyDashboardPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AgencyDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockNavigate.mockClear();
  });

  describe('Product Card Rendering', () => {
    it('renders product cards with 封面圖, 產品標題, 天數, 供應商名稱, 淨價', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockProducts });

      renderAgencyDashboardPage();

      await waitFor(() => {
        expect(screen.getByText('東京五日遊')).toBeInTheDocument();
      });

      expect(screen.getByText('天數：5天')).toBeInTheDocument();
      expect(screen.getByText('供應商：Tokyo Tours')).toBeInTheDocument();
      expect(screen.getByText('NT$25,000')).toBeInTheDocument();
      
      expect(screen.getByText('大阪美食之旅')).toBeInTheDocument();
      expect(screen.getByText('天數：3天')).toBeInTheDocument();
      expect(screen.getByText('供應商：Osaka Adventures')).toBeInTheDocument();
      expect(screen.getByText('NT$18,000')).toBeInTheDocument();

      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('src', 'https://example.com/tokyo.jpg');
      expect(images[1]).toHaveAttribute('src', 'https://example.com/osaka.jpg');
    });

    it('fetches products from GET /api/agency/tours', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockProducts });

      renderAgencyDashboardPage();

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/agency/tours?');
      });
    });

    it('displays loading state while fetching products', () => {
      mockedAxios.get.mockImplementation(() => new Promise(() => {}));

      renderAgencyDashboardPage();

      expect(screen.getByText('載入中...')).toBeInTheDocument();
    });

    it('displays error message when fetch fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      renderAgencyDashboardPage();

      await waitFor(() => {
        expect(screen.getByText('無法載入產品列表')).toBeInTheDocument();
      });
    });
  });

  describe('Product Filtering', () => {
    it('applies destination filter via API query parameters', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockProducts });

      renderAgencyDashboardPage();
      const user = userEvent.setup();

      // Wait for products to load first (which populates the dropdown options)
      await waitFor(() => {
        expect(screen.getByText('東京五日遊')).toBeInTheDocument();
      });

      // Clear the mock to track the next call
      mockedAxios.get.mockClear();
      mockedAxios.get.mockResolvedValue({ data: [mockProducts[0]] });

      const destinationSelect = screen.getByLabelText('目的地：') as HTMLSelectElement;
      await user.selectOptions(destinationSelect, 'Tokyo');

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/agency/tours?destination=Tokyo');
      });
    });

    it('applies duration filter via API query parameters', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockProducts });

      renderAgencyDashboardPage();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByLabelText('天數：')).toBeInTheDocument();
      });

      const durationSelect = screen.getByLabelText('天數：') as HTMLSelectElement;
      await user.selectOptions(durationSelect, '5');

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/agency/tours?durationDays=5');
      });
    });

    it('applies multiple filters simultaneously', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockProducts });

      renderAgencyDashboardPage();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByLabelText('目的地：')).toBeInTheDocument();
      });

      const destinationSelect = screen.getByLabelText('目的地：') as HTMLSelectElement;
      const durationSelect = screen.getByLabelText('天數：') as HTMLSelectElement;

      await user.selectOptions(destinationSelect, 'Tokyo');
      await user.selectOptions(durationSelect, '5');

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/agency/tours?destination=Tokyo&durationDays=5');
      });
    });

    it('displays "no products found" message when filters return empty results', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [] });

      renderAgencyDashboardPage();

      await waitFor(() => {
        expect(screen.getByText('找不到符合條件的產品')).toBeInTheDocument();
      });
    });
  });

  describe('Product Detail Navigation', () => {
    it('navigates to product detail page when clicking on a card', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockProducts });

      renderAgencyDashboardPage();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('東京五日遊')).toBeInTheDocument();
      });

      const productCard = screen.getByText('東京五日遊').closest('div');
      if (productCard) {
        await user.click(productCard);
      }

      expect(mockNavigate).toHaveBeenCalledWith('/agency/tours/1');
    });
  });
});

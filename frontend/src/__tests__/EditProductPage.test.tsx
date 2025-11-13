import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import EditProductPage from '../pages/supplier/EditProductPage';
import { AuthProvider } from '../contexts/AuthContext';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock useNavigate and useParams
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

// Mock ReactQuill
vi.mock('react-quill', () => ({
  default: ({ value, onChange }: any) => (
    <textarea
      data-testid="quill-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const renderEditProductPage = () => {
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
        <EditProductPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('EditProductPage', () => {
  const mockProduct = {
    id: '1',
    title: 'Tokyo Tour',
    destination: 'Tokyo',
    durationDays: 5,
    description: 'A wonderful tour of Tokyo',
    coverImageUrl: 'https://example.com/image.jpg',
    netPrice: 10000,
    status: 'published',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it('loads and displays product data in form', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockProduct });

    renderEditProductPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Tokyo Tour')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Tokyo')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A wonderful tour of Tokyo')).toBeInTheDocument();
    });

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/supplier/tours/1');
  });

  it('displays loading state while fetching product', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {}));

    renderEditProductPage();

    expect(screen.getByText('載入中...')).toBeInTheDocument();
  });

  it('displays error when product fetch fails', async () => {
    mockedAxios.get.mockRejectedValueOnce({
      response: {
        data: { message: '載入產品失敗' },
      },
    });

    renderEditProductPage();

    await waitFor(() => {
      expect(screen.getByText('載入產品失敗')).toBeInTheDocument();
    });
  });

  it('updates product successfully with modified data', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockProduct });
    mockedAxios.put.mockResolvedValueOnce({ data: { ...mockProduct, title: 'Updated Tour' } });

    renderEditProductPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Tokyo Tour')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/產品標題/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Tour');

    const submitButton = screen.getByRole('button', { name: /更新產品/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        '/api/supplier/tours/1',
        expect.any(FormData),
        expect.objectContaining({
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/supplier/dashboard');
    });
  });

  it('allows updating without changing the image', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockProduct });
    mockedAxios.put.mockResolvedValueOnce({ data: mockProduct });

    renderEditProductPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Tokyo Tour')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/產品標題/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Modified Tour');

    const submitButton = screen.getByRole('button', { name: /更新產品/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalled();
    });

    expect(mockNavigate).toHaveBeenCalledWith('/supplier/dashboard');
  });

  it('validates form fields on update', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockProduct });

    renderEditProductPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Tokyo Tour')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/產品標題/i);
    await user.clear(titleInput);

    const submitButton = screen.getByRole('button', { name: /更新產品/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('產品標題為必填欄位')).toBeInTheDocument();
    });

    expect(mockedAxios.put).not.toHaveBeenCalled();
  });

  it('displays error message on update failure', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockProduct });
    mockedAxios.put.mockRejectedValueOnce({
      response: {
        data: { message: '更新失敗' },
      },
    });

    renderEditProductPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Tokyo Tour')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /更新產品/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('更新失敗')).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates back to dashboard when cancel button is clicked', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockProduct });

    renderEditProductPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Tokyo Tour')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /取消/i });
    await user.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith('/supplier/dashboard');
  });

  it('shows existing image preview', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockProduct });

    renderEditProductPage();

    await waitFor(() => {
      const preview = screen.getByAltText('預覽');
      expect(preview).toBeInTheDocument();
      expect(preview).toHaveAttribute('src', 'https://example.com/image.jpg');
    });
  });

  it('updates image preview when new image is selected', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockProduct });

    renderEditProductPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Tokyo Tour')).toBeInTheDocument();
    });

    const validFile = new File(['new image'], 'new.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/封面圖/i);
    await user.upload(fileInput, validFile);

    await waitFor(() => {
      const preview = screen.getByAltText('預覽');
      expect(preview).toBeInTheDocument();
    });
  });
});

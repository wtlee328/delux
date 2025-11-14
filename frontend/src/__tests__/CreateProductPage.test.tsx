import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import CreateProductPage from '../pages/supplier/CreateProductPage';
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

const renderCreateProductPage = () => {
  // Set up authenticated user
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
        <ToastProvider>
          <CreateProductPage />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('CreateProductPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it('renders product creation form with all required fields', () => {
    renderCreateProductPage();
    
    expect(screen.getByLabelText(/產品標題/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/目的地/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/天數/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/淨價/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/封面圖/i)).toBeInTheDocument();
    expect(screen.getByTestId('quill-editor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /提交產品/i })).toBeInTheDocument();
  });

  it('validates required fields on submission', async () => {
    renderCreateProductPage();
    const user = userEvent.setup();
    
    const submitButton = screen.getByRole('button', { name: /提交產品/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('產品標題為必填欄位')).toBeInTheDocument();
      expect(screen.getByText('目的地為必填欄位')).toBeInTheDocument();
      expect(screen.getByText('天數必須為正整數')).toBeInTheDocument();
      expect(screen.getByText('產品描述為必填欄位')).toBeInTheDocument();
      expect(screen.getByText('封面圖為必填欄位')).toBeInTheDocument();
      expect(screen.getByText('淨價必須為正數')).toBeInTheDocument();
    });
    
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('validates image file type', async () => {
    renderCreateProductPage();
    const user = userEvent.setup();
    
    const fileInput = screen.getByLabelText(/封面圖/i);
    const invalidFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    
    await user.upload(fileInput, invalidFile);
    
    const submitButton = screen.getByRole('button', { name: /提交產品/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('只接受 JPEG、PNG 或 WebP 格式的圖片')).toBeInTheDocument();
    });
  });

  it('validates image file size (5MB max)', async () => {
    renderCreateProductPage();
    const user = userEvent.setup();
    
    // Create a file larger than 5MB
    const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
    const largeFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
    
    const fileInput = screen.getByLabelText(/封面圖/i);
    await user.upload(fileInput, largeFile);
    
    const submitButton = screen.getByRole('button', { name: /提交產品/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('圖片大小不得超過 5MB')).toBeInTheDocument();
    });
  });

  it('submits form successfully with valid data', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        id: '1',
        產品標題: 'Test Tour',
        status: 'pending',
      },
    });

    renderCreateProductPage();
    const user = userEvent.setup();
    
    // Fill in form fields
    await user.type(screen.getByLabelText(/產品標題/i), 'Test Tour');
    await user.type(screen.getByLabelText(/目的地/i), 'Tokyo');
    await user.type(screen.getByLabelText(/天數/i), '5');
    await user.type(screen.getByLabelText(/淨價/i), '10000');
    
    // Fill in description
    const descriptionField = screen.getByTestId('quill-editor');
    await user.type(descriptionField, 'This is a test tour description');
    
    // Upload image
    const validFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB
    const fileInput = screen.getByLabelText(/封面圖/i);
    await user.upload(fileInput, validFile);
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /提交產品/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/supplier/tours',
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

  it('displays error message on submission failure', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { message: 'Invalid product data' },
      },
    });

    renderCreateProductPage();
    const user = userEvent.setup();
    
    // Fill in form with valid data
    await user.type(screen.getByLabelText(/產品標題/i), 'Test Tour');
    await user.type(screen.getByLabelText(/目的地/i), 'Tokyo');
    await user.type(screen.getByLabelText(/天數/i), '5');
    await user.type(screen.getByLabelText(/淨價/i), '10000');
    
    const descriptionField = screen.getByTestId('quill-editor');
    await user.type(descriptionField, 'Description');
    
    const validFile = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(validFile, 'size', { value: 1024 });
    await user.upload(screen.getByLabelText(/封面圖/i), validFile);
    
    const submitButton = screen.getByRole('button', { name: /提交產品/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid product data')).toBeInTheDocument();
    });
    
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows image preview after file selection', async () => {
    renderCreateProductPage();
    const user = userEvent.setup();
    
    const validFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/封面圖/i);
    
    await user.upload(fileInput, validFile);
    
    await waitFor(() => {
      const preview = screen.getByAltText('預覽');
      expect(preview).toBeInTheDocument();
    });
  });

  it('navigates back to dashboard when cancel button is clicked', async () => {
    renderCreateProductPage();
    const user = userEvent.setup();
    
    const cancelButton = screen.getByRole('button', { name: /取消/i });
    await user.click(cancelButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/supplier/dashboard');
  });

  it('disables form during submission', async () => {
    mockedAxios.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderCreateProductPage();
    const user = userEvent.setup();
    
    // Fill in form
    await user.type(screen.getByLabelText(/產品標題/i), 'Test Tour');
    await user.type(screen.getByLabelText(/目的地/i), 'Tokyo');
    await user.type(screen.getByLabelText(/天數/i), '5');
    await user.type(screen.getByLabelText(/淨價/i), '10000');
    
    const descriptionField = screen.getByTestId('quill-editor');
    await user.type(descriptionField, 'Description');
    
    const validFile = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(validFile, 'size', { value: 1024 });
    await user.upload(screen.getByLabelText(/封面圖/i), validFile);
    
    const submitButton = screen.getByRole('button', { name: /提交產品/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /提交中/i })).toBeDisabled();
    });
  });
});

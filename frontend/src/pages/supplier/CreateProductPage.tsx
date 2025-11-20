import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { validateProductForm } from '../../utils/validation';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import axiosInstance from '../../config/axios';

interface FormData {
  產品標題: string;
  目的地: string;
  天數: string;
  產品描述: string;
  封面圖: File | null;
  淨價: string;
}

interface FormErrors {
  產品標題?: string;
  目的地?: string;
  天數?: string;
  產品描述?: string;
  封面圖?: string;
  淨價?: string;
  submit?: string;
}

const CreateProductPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const [formData, setFormData] = useState<FormData>({
    產品標題: '',
    目的地: '',
    天數: '',
    產品描述: '',
    封面圖: null,
    淨價: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({ ...prev, 產品描述: value }));
    // Clear error for description
    if (errors.產品描述) {
      setErrors(prev => ({ ...prev, 產品描述: undefined }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, 封面圖: file }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Clear error for image
      if (errors.封面圖) {
        setErrors(prev => ({ ...prev, 封面圖: undefined }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent, status: '草稿' | '待審核' = '待審核') => {
    e.preventDefault();

    // Validate form using utility
    const validation = validateProductForm({
      title: formData.產品標題,
      destination: formData.目的地,
      durationDays: formData.天數,
      description: formData.產品描述,
      netPrice: formData.淨價,
      coverImage: formData.封面圖
    }, false);

    if (!validation.isValid) {
      // Map validation errors to form field names
      const mappedErrors: FormErrors = {};
      if (validation.errors.title) mappedErrors.產品標題 = validation.errors.title;
      if (validation.errors.destination) mappedErrors.目的地 = validation.errors.destination;
      if (validation.errors.durationDays) mappedErrors.天數 = validation.errors.durationDays;
      if (validation.errors.description) mappedErrors.產品描述 = validation.errors.description;
      if (validation.errors.netPrice) mappedErrors.淨價 = validation.errors.netPrice;
      if (validation.errors.coverImage) mappedErrors.封面圖 = validation.errors.coverImage;

      setErrors(mappedErrors);
      showError('請修正表單錯誤');
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const submitData = new FormData();
      submitData.append('title', formData.產品標題);
      submitData.append('destination', formData.目的地);
      submitData.append('durationDays', formData.天數);
      submitData.append('description', formData.產品描述);
      submitData.append('netPrice', formData.淨價);
      submitData.append('status', status);
      if (formData.封面圖) {
        submitData.append('coverImage', formData.封面圖);
      }

      // Use raw axios for FormData to avoid Content-Type header issues
      // Get the base URL and auth token from the configured instance
      const baseURL = axiosInstance.defaults.baseURL;
      const token = localStorage.getItem('token');

      await axios.post(`${baseURL}/api/supplier/tours`, submitData, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      const message = status === '草稿' ? '產品已儲存為草稿' : '產品已提交審核';
      showSuccess(message);
      // Redirect to dashboard on success
      setTimeout(() => navigate('/supplier/dashboard'), 1000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || '提交失敗，請稍後再試';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white px-8 py-4 shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">新增旅遊產品</h1>
        <div className="flex items-center gap-4">
          <span className="text-slate-600 font-medium">{user?.name} ({user?.role})</span>
          <button onClick={logout} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium">
            登出
          </button>
        </div>
      </header>
      <main className="p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <button
            onClick={() => navigate('/supplier/dashboard')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors mb-6 flex items-center gap-2"
          >
            ← 返回控制台
          </button>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {errors.submit && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{errors.submit}</div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="產品標題" className="font-bold text-slate-700">
                產品標題 <span className="text-red-500">*</span>
              </label>
              <input
                id="產品標題"
                type="text"
                name="產品標題"
                value={formData.產品標題}
                onChange={handleInputChange}
                className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="請輸入產品標題"
              />
              {errors.產品標題 && (
                <span className="text-red-500 text-sm">{errors.產品標題}</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="目的地" className="font-bold text-slate-700">
                目的地 <span className="text-red-500">*</span>
              </label>
              <input
                id="目的地"
                type="text"
                name="目的地"
                value={formData.目的地}
                onChange={handleInputChange}
                className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="請輸入目的地"
              />
              {errors.目的地 && (
                <span className="text-red-500 text-sm">{errors.目的地}</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="天數" className="font-bold text-slate-700">
                天數 <span className="text-red-500">*</span>
              </label>
              <input
                id="天數"
                type="number"
                name="天數"
                value={formData.天數}
                onChange={handleInputChange}
                className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="請輸入天數"
                min="1"
              />
              {errors.天數 && (
                <span className="text-red-500 text-sm">{errors.天數}</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="淨價" className="font-bold text-slate-700">
                淨價 (TWD) <span className="text-red-500">*</span>
              </label>
              <input
                id="淨價"
                type="number"
                name="淨價"
                value={formData.淨價}
                onChange={handleInputChange}
                className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="請輸入淨價"
                min="0"
                step="0.01"
              />
              {errors.淨價 && (
                <span className="text-red-500 text-sm">{errors.淨價}</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="封面圖" className="font-bold text-slate-700">
                封面圖 <span className="text-red-500">*</span>
              </label>
              <input
                id="封面圖"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="預覽" className="max-w-[300px] max-h-[200px] rounded-lg border border-slate-200 object-cover" />
                </div>
              )}
              {errors.封面圖 && (
                <span className="text-red-500 text-sm">{errors.封面圖}</span>
              )}
              <small className="text-slate-500 text-sm">
                接受 JPEG、PNG、WebP 格式，檔案大小不超過 5MB
              </small>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="產品描述" className="font-bold text-slate-700">
                產品描述 <span className="text-red-500">*</span>
              </label>
              <div className="prose-editor">
                <ReactQuill
                  id="產品描述"
                  theme="snow"
                  value={formData.產品描述}
                  onChange={handleDescriptionChange}
                  modules={quillModules}
                  className="bg-white min-h-[200px] rounded-lg"
                />
              </div>
              {errors.產品描述 && (
                <span className="text-red-500 text-sm">{errors.產品描述}</span>
              )}
            </div>

            <div className="flex gap-4 justify-end mt-4">
              <button
                type="button"
                onClick={() => navigate('/supplier/dashboard')}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, '草稿')}
                className="px-6 py-2.5 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? '儲存中...' : '儲存為草稿'}
              </button>
              <button
                type="submit"
                onClick={(e) => handleSubmit(e, '待審核')}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? '提交中...' : '提交審核'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateProductPage;


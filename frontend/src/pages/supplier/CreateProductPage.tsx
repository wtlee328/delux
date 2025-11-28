import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import axiosInstance from '../../config/axios';
import TopBar from '../../components/TopBar';

interface FormData {
  產品標題: string;
  目的地: string;
  類別: string;
  產品描述: string;
  封面圖: File | null;
  淨價: string;
  購物行程: boolean;
  門票: boolean;
  門票價格: string;
  停留時間: string;
}

interface FormErrors {
  產品標題?: string;
  目的地?: string;
  類別?: string;
  產品描述?: string;
  封面圖?: string;
  淨價?: string;
  submit?: string;
}

const CreateProductPage: React.FC = () => {
  useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const [formData, setFormData] = useState<FormData>({
    產品標題: '',
    目的地: '',
    類別: '地標',
    產品描述: '',
    封面圖: null,
    淨價: '',
    購物行程: false,
    門票: false,
    門票價格: '',
    停留時間: '1',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

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

    // Validate form using utility (Note: validation util needs update, doing inline for now or assuming util update)
    // Simple inline validation for now to match the change
    const newErrors: FormErrors = {};
    if (!formData.產品標題) newErrors.產品標題 = '請輸入產品標題';
    if (!formData.目的地) newErrors.目的地 = '請輸入目的地';
    if (!formData.類別) newErrors.類別 = '請選擇類別';
    if (!formData.產品描述) newErrors.產品描述 = '請輸入產品描述';
    if (!formData.淨價) newErrors.淨價 = '請輸入淨價';
    if (!formData.封面圖) newErrors.封面圖 = '請上傳封面圖';
    if (formData.門票 && !formData.門票價格) newErrors.submit = '請輸入門票價格';
    if (!formData.停留時間) newErrors.submit = '請輸入停留時間';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showError('請修正表單錯誤');
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const submitData = new FormData();
      submitData.append('title', formData.產品標題);
      submitData.append('destination', formData.目的地);
      submitData.append('category', formData.類別 === '地標' ? 'landmark' :
        formData.類別 === '住宿' ? 'accommodation' :
          formData.類別 === '餐飲' ? 'food' : 'transportation');
      submitData.append('description', formData.產品描述);
      submitData.append('netPrice', formData.淨價);
      submitData.append('hasShopping', formData.購物行程.toString());
      submitData.append('hasTicket', formData.門票.toString());
      if (formData.門票) {
        submitData.append('ticketPrice', formData.門票價格);
      }
      submitData.append('duration', formData.停留時間);
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
      <TopBar title="新增旅遊產品" />
      <main className="p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <button
            onClick={() => navigate('/supplier/dashboard')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors mb-6 flex items-center gap-2"
          >
            ← 返回控制台
          </button>

          <form onSubmit={(e) => handleSubmit(e)} className="flex flex-col gap-6">
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
              <label htmlFor="類別" className="font-bold text-slate-700">
                類別 <span className="text-red-500">*</span>
              </label>
              <select
                id="類別"
                name="類別"
                value={formData.類別}
                onChange={handleInputChange}
                className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                <option value="地標">地標</option>
                <option value="住宿">住宿</option>
                <option value="餐飲">餐飲</option>
                <option value="交通">交通</option>
              </select>
              {errors.類別 && (
                <span className="text-red-500 text-sm">{errors.類別}</span>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-bold text-slate-700">
                  購物行程
                </label>
                <div className="flex items-center gap-2 p-3 border border-slate-300 rounded-lg bg-white">
                  <input
                    type="checkbox"
                    id="購物行程"
                    name="購物行程"
                    checked={formData.購物行程}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="購物行程" className="text-slate-700 cursor-pointer select-none">
                    包含購物行程
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="停留時間" className="font-bold text-slate-700">
                  停留時間 (小時) <span className="text-red-500">*</span>
                </label>
                <input
                  id="停留時間"
                  type="number"
                  name="停留時間"
                  value={formData.停留時間}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="請輸入停留時間"
                  min="0.1"
                  step="0.1"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-bold text-slate-700">
                門票
              </label>
              <div className="flex flex-col gap-4 p-4 border border-slate-300 rounded-lg bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="門票"
                    name="門票"
                    checked={formData.門票}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="門票" className="text-slate-700 cursor-pointer select-none">
                    需要門票
                  </label>
                </div>

                {formData.門票 && (
                  <div className="pl-7">
                    <label htmlFor="門票價格" className="font-bold text-slate-700 block mb-1">
                      門票價格 (TWD) <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="門票價格"
                      type="number"
                      name="門票價格"
                      value={formData.門票價格}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="請輸入門票價格"
                      min="0"
                      step="1"
                    />
                  </div>
                )}
              </div>
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

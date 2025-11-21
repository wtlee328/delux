import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from '../../config/axios';
import TopBar from '../../components/TopBar';

type ProductStatus = '草稿' | '待審核' | '已發佈' | '需要修改';

interface FormData {
  產品標題: string;
  目的地: string;
  類別: string;
  產品描述: string;
  封面圖: File | null;
  淨價: string;
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

const EditProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // const { showSuccess, showError } = useToast(); // Removed unused

  const [formData, setFormData] = useState<FormData>({
    產品標題: '',
    目的地: '',
    類別: '地標',
    產品描述: '',
    封面圖: null,
    淨價: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<ProductStatus>('草稿');

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/supplier/tours/${id}`);
      const product = response.data;

      // Map backend category to frontend display value
      const categoryMap: Record<string, string> = {
        'landmark': '地標',
        'accommodation': '住宿',
        'food': '餐飲',
        'transportation': '交通'
      };

      setFormData({
        產品標題: product.title,
        目的地: product.destination,
        類別: categoryMap[product.category] || '地標',
        產品描述: product.description,
        封面圖: null,
        淨價: product.netPrice.toString(),
      });

      setExistingImageUrl(product.coverImageUrl);
      setImagePreview(product.coverImageUrl);
      setCurrentStatus(product.status);
    } catch (err: any) {
      setErrors({ submit: err.response?.data?.message || '載入產品失敗' });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.產品標題.trim()) {
      newErrors.產品標題 = '產品標題為必填欄位';
    }

    if (!formData.目的地.trim()) {
      newErrors.目的地 = '目的地為必填欄位';
    }

    if (!formData.類別) {
      newErrors.類別 = '類別為必填欄位';
    }

    if (!formData.產品描述.trim() || formData.產品描述 === '<p><br></p>') {
      newErrors.產品描述 = '產品描述為必填欄位';
    }

    if (formData.封面圖) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(formData.封面圖.type)) {
        newErrors.封面圖 = '只接受 JPEG、PNG 或 WebP 格式的圖片';
      }
      if (formData.封面圖.size > 5 * 1024 * 1024) {
        newErrors.封面圖 = '圖片大小不得超過 5MB';
      }
    }

    if (!formData.淨價 || parseFloat(formData.淨價) <= 0) {
      newErrors.淨價 = '淨價必須為正數';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({ ...prev, 產品描述: value }));
    if (errors.產品描述) {
      setErrors(prev => ({ ...prev, 產品描述: undefined }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, 封面圖: file }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      if (errors.封面圖) {
        setErrors(prev => ({ ...prev, 封面圖: undefined }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const submitData = new FormData();
      submitData.append('title', formData.產品標題);
      submitData.append('destination', formData.目的地);

      const categoryMap: Record<string, string> = {
        '地標': 'landmark',
        '住宿': 'accommodation',
        '餐飲': 'food',
        '交通': 'transportation'
      };
      submitData.append('category', categoryMap[formData.類別] || 'landmark');

      submitData.append('description', formData.產品描述);
      submitData.append('netPrice', formData.淨價);
      if (formData.封面圖) {
        submitData.append('coverImage', formData.封面圖);
      }

      await axios.put(`/api/supplier/tours/${id}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      navigate('/supplier/dashboard');
    } catch (error: any) {
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else {
        setErrors({ submit: '更新失敗，請稍後再試' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: ProductStatus) => {
    setIsSubmitting(true);
    setErrors({});

    try {
      await axios.put(`/api/supplier/tours/${id}/status`, { status: newStatus });
      setCurrentStatus(newStatus);
      alert(`產品狀態已更新為：${newStatus}`);
    } catch (error: any) {
      if (error.response?.data?.error) {
        setErrors({ submit: error.response.data.error });
      } else {
        setErrors({ submit: '狀態更新失敗，請稍後再試' });
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TopBar title="編輯旅遊產品" />
        <main className="p-8 max-w-4xl mx-auto">
          <p className="text-center text-slate-500 py-8">載入中...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar title="編輯旅遊產品" />
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

            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-bold text-slate-700">目前狀態：</span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold inline-block ${currentStatus === '草稿' ? 'bg-slate-500 text-white' :
                currentStatus === '待審核' ? 'bg-amber-400 text-black' :
                  currentStatus === '已發佈' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                {currentStatus}
              </span>
            </div>

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

            <div className="flex flex-col gap-2">
              <label htmlFor="封面圖" className="font-bold text-slate-700">
                封面圖 {!existingImageUrl && <span className="text-red-500">*</span>}
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
                {existingImageUrl ? '留空以保留現有圖片。' : ''}
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
                type="submit"
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? '更新中...' : '儲存變更'}
              </button>
            </div>

            {(currentStatus === '草稿' || currentStatus === '需要修改') && (
              <div className="mt-4 p-6 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <p className="text-slate-600 mb-4">
                  {currentStatus === '需要修改' ? '此產品需要修改，請更新後重新提交審核' : '此產品為草稿狀態'}
                </p>
                <button
                  type="button"
                  onClick={() => handleStatusChange('待審核')}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  disabled={isSubmitting}
                >
                  提交審核
                </button>
              </div>
            )}

            {currentStatus === '待審核' && (
              <div className="mt-4 p-6 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <p className="text-slate-600 mb-4">此產品正在審核中</p>
                <button
                  type="button"
                  onClick={() => handleStatusChange('草稿')}
                  className="px-6 py-2.5 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  撤回至草稿
                </button>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditProductPage;

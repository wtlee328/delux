import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';

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

const EditProductPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
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
  const [loading, setLoading] = useState(true);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/supplier/tours/${id}`);
      const product = response.data;
      
      setFormData({
        產品標題: product.title,
        目的地: product.destination,
        天數: product.durationDays.toString(),
        產品描述: product.description,
        封面圖: null,
        淨價: product.netPrice.toString(),
      });
      
      setExistingImageUrl(product.coverImageUrl);
      setImagePreview(product.coverImageUrl);
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

    if (!formData.天數 || parseInt(formData.天數) <= 0) {
      newErrors.天數 = '天數必須為正整數';
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      submitData.append('durationDays', formData.天數);
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

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <h1>編輯旅遊產品</h1>
          <div style={styles.userInfo}>
            <span>{user?.name} ({user?.role})</span>
            <button onClick={logout} style={styles.logoutButton}>
              登出
            </button>
          </div>
        </header>
        <main style={styles.main}>
          <p>載入中...</p>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>編輯旅遊產品</h1>
        <div style={styles.userInfo}>
          <span>{user?.name} ({user?.role})</span>
          <button onClick={logout} style={styles.logoutButton}>
            登出
          </button>
        </div>
      </header>
      <main style={styles.main}>
        <div style={styles.formContainer}>
          <button
            onClick={() => navigate('/supplier/dashboard')}
            style={styles.backButton}
          >
            ← 返回控制台
          </button>

          <form onSubmit={handleSubmit} style={styles.form}>
            {errors.submit && (
              <div style={styles.errorAlert}>{errors.submit}</div>
            )}

            <div style={styles.formGroup}>
              <label htmlFor="產品標題" style={styles.label}>
                產品標題 <span style={styles.required}>*</span>
              </label>
              <input
                id="產品標題"
                type="text"
                name="產品標題"
                value={formData.產品標題}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="請輸入產品標題"
              />
              {errors.產品標題 && (
                <span style={styles.error}>{errors.產品標題}</span>
              )}
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="目的地" style={styles.label}>
                目的地 <span style={styles.required}>*</span>
              </label>
              <input
                id="目的地"
                type="text"
                name="目的地"
                value={formData.目的地}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="請輸入目的地"
              />
              {errors.目的地 && (
                <span style={styles.error}>{errors.目的地}</span>
              )}
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="天數" style={styles.label}>
                天數 <span style={styles.required}>*</span>
              </label>
              <input
                id="天數"
                type="number"
                name="天數"
                value={formData.天數}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="請輸入天數"
                min="1"
              />
              {errors.天數 && (
                <span style={styles.error}>{errors.天數}</span>
              )}
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="淨價" style={styles.label}>
                淨價 (TWD) <span style={styles.required}>*</span>
              </label>
              <input
                id="淨價"
                type="number"
                name="淨價"
                value={formData.淨價}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="請輸入淨價"
                min="0"
                step="0.01"
              />
              {errors.淨價 && (
                <span style={styles.error}>{errors.淨價}</span>
              )}
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="封面圖" style={styles.label}>
                封面圖 {!existingImageUrl && <span style={styles.required}>*</span>}
              </label>
              <input
                id="封面圖"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                style={styles.fileInput}
              />
              {imagePreview && (
                <div style={styles.imagePreviewContainer}>
                  <img src={imagePreview} alt="預覽" style={styles.imagePreview} />
                </div>
              )}
              {errors.封面圖 && (
                <span style={styles.error}>{errors.封面圖}</span>
              )}
              <small style={styles.hint}>
                {existingImageUrl ? '留空以保留現有圖片。' : ''}
                接受 JPEG、PNG、WebP 格式，檔案大小不超過 5MB
              </small>
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="產品描述" style={styles.label}>
                產品描述 <span style={styles.required}>*</span>
              </label>
              <ReactQuill
                id="產品描述"
                theme="snow"
                value={formData.產品描述}
                onChange={handleDescriptionChange}
                modules={quillModules}
                style={styles.quillEditor}
              />
              {errors.產品描述 && (
                <span style={styles.error}>{errors.產品描述}</span>
              )}
            </div>

            <div style={styles.buttonGroup}>
              <button
                type="button"
                onClick={() => navigate('/supplier/dashboard')}
                style={styles.cancelButton}
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                type="submit"
                style={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? '更新中...' : '更新產品'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: '1rem 2rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  main: {
    padding: '2rem',
  },
  formContainer: {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  label: {
    fontWeight: 'bold',
    fontSize: '0.95rem',
  },
  required: {
    color: '#dc3545',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  fileInput: {
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  imagePreviewContainer: {
    marginTop: '0.5rem',
  },
  imagePreview: {
    maxWidth: '300px',
    maxHeight: '200px',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  hint: {
    color: '#6c757d',
    fontSize: '0.85rem',
  },
  quillEditor: {
    backgroundColor: 'white',
    minHeight: '200px',
  },
  error: {
    color: '#dc3545',
    fontSize: '0.85rem',
  },
  errorAlert: {
    padding: '1rem',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
    borderRadius: '4px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    marginTop: '1rem',
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  submitButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
};

export default EditProductPage;

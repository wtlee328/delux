import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { validateProductForm } from '../../utils/validation';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from '../../config/axios';

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

  const handleSubmit = async (e: React.FormEvent) => {
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
      submitData.append('產品標題', formData.產品標題);
      submitData.append('目的地', formData.目的地);
      submitData.append('天數', formData.天數);
      submitData.append('產品描述', formData.產品描述);
      submitData.append('淨價', formData.淨價);
      if (formData.封面圖) {
        submitData.append('封面圖', formData.封面圖);
      }

      await axios.post('/api/supplier/tours', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      showSuccess('產品創建成功');
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
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>新增旅遊產品</h1>
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
                封面圖 <span style={styles.required}>*</span>
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
                {isSubmitting ? '提交中...' : '提交產品'}
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

export default CreateProductPage;

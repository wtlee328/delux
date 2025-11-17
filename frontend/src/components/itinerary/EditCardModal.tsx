import React, { useState, useEffect } from 'react';

interface Product {
  id: string;
  title: string;
  notes?: string;
}

interface EditCardModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (productId: string, notes: string) => void;
}

const EditCardModal: React.FC<EditCardModalProps> = ({
  isOpen,
  product,
  onClose,
  onSave,
}) => {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (product) {
      setNotes(product.notes || '');
    }
  }, [product]);

  if (!isOpen || !product) {
    return null;
  }

  const handleSave = () => {
    onSave(product.id, notes);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={styles.backdrop} onClick={handleBackdropClick}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>編輯行程項目</h3>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>
        <div style={styles.content}>
          <div style={styles.productInfo}>
            <h4 style={styles.productTitle}>{product.title}</h4>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>私人備註：</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="新增備註（例如：特殊需求、注意事項等）"
              style={styles.textarea}
              rows={5}
            />
          </div>
        </div>
        <div style={styles.footer}>
          <button style={styles.cancelButton} onClick={onClose}>
            取消
          </button>
          <button style={styles.saveButton} onClick={handleSave}>
            儲存
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  backdrop: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  header: {
    padding: '1.5rem',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 'bold',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#666',
    padding: '0',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: '1.5rem',
    flex: 1,
    overflow: 'auto',
  },
  productInfo: {
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
  },
  productTitle: {
    margin: 0,
    fontSize: '1rem',
    color: '#333',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    color: '#333',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
  },
  footer: {
    padding: '1rem 1.5rem',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  },
  cancelButton: {
    padding: '0.5rem 1.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  saveButton: {
    padding: '0.5rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#007bff',
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
};

export default EditCardModal;

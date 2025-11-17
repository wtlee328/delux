import React, { useState } from 'react';

interface SaveItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  defaultName?: string;
}

const SaveItineraryModal: React.FC<SaveItineraryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultName = '',
}) => {
  const [name, setName] = useState(defaultName);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName('');
      onClose();
    }
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
          <h3 style={styles.title}>儲存行程</h3>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>
        <div style={styles.content}>
          <div style={styles.formGroup}>
            <label style={styles.label}>行程名稱：</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="輸入行程名稱"
              style={styles.input}
              autoFocus
            />
          </div>
        </div>
        <div style={styles.footer}>
          <button style={styles.cancelButton} onClick={onClose}>
            取消
          </button>
          <button
            style={styles.saveButton}
            onClick={handleSave}
            disabled={!name.trim()}
          >
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
    maxWidth: '400px',
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
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.9rem',
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
    backgroundColor: '#28a745',
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
};

export default SaveItineraryModal;

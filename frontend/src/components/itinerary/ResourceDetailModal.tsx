import React from 'react';

interface Product {
    id: string;
    title: string;
    destination: string;
    durationDays: number;
    coverImageUrl: string;
    netPrice: number;
    supplierName: string;
    productType: 'activity' | 'accommodation' | 'food' | 'transportation';
    description?: string;
    notes?: string;
}

interface ResourceDetailModalProps {
    product: Product | null;
    onClose: () => void;
}

const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({ product, onClose }) => {
    if (!product) return null;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <button style={styles.closeButton} onClick={onClose}>×</button>

                <div style={styles.imageContainer}>
                    <img
                        src={product.coverImageUrl}
                        alt={product.title}
                        style={styles.image}
                    />
                    <div style={styles.typeBadge}>
                        {product.productType}
                    </div>
                </div>

                <div style={styles.content}>
                    <h2 style={styles.title}>{product.title}</h2>

                    <div style={styles.infoGrid}>
                        <div style={styles.infoItem}>
                            <span style={styles.label}>目的地</span>
                            <span style={styles.value}>{product.destination}</span>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.label}>天數</span>
                            <span style={styles.value}>{product.durationDays} 天</span>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.label}>供應商</span>
                            <span style={styles.value}>{product.supplierName}</span>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.label}>淨價</span>
                            <span style={styles.price}>NT${product.netPrice.toLocaleString()}</span>
                        </div>
                    </div>

                    {product.description && (
                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>產品描述</h3>
                            <div
                                style={styles.description}
                                dangerouslySetInnerHTML={{ __html: product.description }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        padding: '2rem',
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto' as const,
        position: 'relative' as const,
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    },
    closeButton: {
        position: 'absolute' as const,
        top: '1rem',
        right: '1rem',
        background: 'rgba(0,0,0,0.5)',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        fontSize: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 10,
        transition: 'background 0.2s',
    },
    imageContainer: {
        position: 'relative' as const,
        width: '100%',
        height: '250px',
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
    },
    typeBadge: {
        position: 'absolute' as const,
        bottom: '1rem',
        left: '1rem',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: '0.25rem 0.75rem',
        borderRadius: '20px',
        fontSize: '0.85rem',
        fontWeight: '600',
        color: '#2d3436',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    content: {
        padding: '2rem',
    },
    title: {
        margin: '0 0 1.5rem 0',
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#2d3436',
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1.5rem',
        marginBottom: '2rem',
        backgroundColor: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '12px',
    },
    infoItem: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '0.25rem',
    },
    label: {
        fontSize: '0.85rem',
        color: '#636e72',
    },
    value: {
        fontSize: '1rem',
        fontWeight: '500',
        color: '#2d3436',
    },
    price: {
        fontSize: '1.1rem',
        fontWeight: '700',
        color: '#00b894',
    },
    section: {
        marginTop: '1.5rem',
    },
    sectionTitle: {
        fontSize: '1.1rem',
        fontWeight: '600',
        marginBottom: '0.75rem',
        color: '#2d3436',
    },
    description: {
        fontSize: '0.95rem',
        lineHeight: '1.6',
        color: '#636e72',
    },
};

export default ResourceDetailModal;

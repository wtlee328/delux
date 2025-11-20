import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Product {
    id: string;
    title: string;
    destination: string;
    durationDays: number;
    coverImageUrl: string;
    netPrice: number;
    supplierName: string;
    productType: 'activity' | 'accommodation' | 'food' | 'transportation';
    notes?: string;
    location?: {
        lat: number;
        lng: number;
    };
    timelineId?: string;
    startTime?: string;
    duration?: number;
    description?: string;
}

interface TimelineActivityItemProps {
    item: Product;
    colorTheme: { primary: string; light: string; dot: string };
    onTimeUpdate: (id: string, startTime: string, duration: number) => void;
    onDelete: (id: string) => void;
    isStartTimeEditable: boolean;
    onPreview: (product: Product) => void;
}



export const TimelineActivityItem: React.FC<TimelineActivityItemProps> = ({
    item,
    colorTheme,
    onTimeUpdate,
    onDelete,
    isStartTimeEditable,
    onPreview,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTime, setEditTime] = useState(item.startTime || '09:00');
    const [editDuration, setEditDuration] = useState(item.duration || 60);
    const inputRef = useRef<HTMLInputElement>(null);
    const durationInputRef = useRef<HTMLInputElement>(null);
    const editContainerRef = useRef<HTMLDivElement>(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.timelineId! });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        ...styles.container,
        zIndex: isDragging ? 1000 : 1,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative' as const,
        touchAction: 'none',
    };

    useEffect(() => {
        if (isEditing) {
            if (isStartTimeEditable && inputRef.current) {
                inputRef.current.focus();
            } else if (!isStartTimeEditable && durationInputRef.current) {
                durationInputRef.current.focus();
            }
        }
    }, [isEditing, isStartTimeEditable]);

    // Sync local state with props when they change (e.g. from parent updates)
    useEffect(() => {
        setEditTime(item.startTime || '09:00');
        setEditDuration(item.duration || 60);
    }, [item.startTime, item.duration]);

    const handleSave = () => {
        onTimeUpdate(item.timelineId!, editTime, editDuration);
        setIsEditing(false);
    };

    // Handle click outside to save
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (isEditing && editContainerRef.current && !editContainerRef.current.contains(event.target as Node)) {
                handleSave();
            }
        };

        if (isEditing) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isEditing, editTime, editDuration]); // Dependencies are crucial for handleSave to see current state

    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditTime(item.startTime || '09:00');
            setEditDuration(item.duration || 60);
        }
    };

    if (!item.timelineId) return null;

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {/* Connection Line Segment (Top half) */}
            <div style={{ ...styles.lineSegment, backgroundColor: colorTheme.primary, top: 0, height: '100%' }} />

            {/* Dot Marker */}
            <div style={{ ...styles.dot, backgroundColor: colorTheme.dot }} />

            {/* Card */}
            <div
                style={{
                    ...styles.card,
                    transform: isDragging ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                    cursor: isDragging ? 'grabbing' : 'grab',
                }}
            >
                <div style={styles.cardContent}>
                    <div style={styles.headerRow}>
                        <h4 style={styles.title}>{item.title}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center', marginRight: '-8px', marginTop: '-4px' }}>
                            <button
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); onDelete(item.timelineId!); }}
                                style={{
                                    ...styles.deleteBtn,
                                    marginTop: 0,
                                    marginRight: 0,
                                }}
                                title="Remove"
                            >
                                ×
                            </button>
                            <button
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); onPreview(item); }}
                                style={{
                                    ...styles.deleteBtn,
                                    color: '#b2bec3',
                                    fontSize: '1rem',
                                    marginTop: 0,
                                    marginRight: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '24px',
                                    height: '24px',
                                }}
                                title="預覽"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </button>
                        </div>
                    </div>

                    {isEditing ? (
                        <div
                            ref={editContainerRef}
                            style={styles.editContainer}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <div style={styles.editRow}>
                                <span style={styles.label}>開始</span>
                                <style>
                                    {`
                                        .no-clock-icon::-webkit-calendar-picker-indicator {
                                            display: none !important;
                                        }
                                    `}
                                </style>
                                <input
                                    ref={inputRef}
                                    type="time"
                                    className="no-clock-icon"
                                    value={editTime}
                                    onChange={(e) => setEditTime(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    style={{
                                        ...styles.timeInput,
                                        backgroundColor: isStartTimeEditable ? 'white' : '#f1f2f6',
                                        color: isStartTimeEditable ? '#2d3436' : '#b2bec3',
                                    }}
                                    disabled={!isStartTimeEditable}
                                />
                            </div>
                            <div style={styles.editRow}>
                                <span style={styles.label}>停留</span>
                                <div style={{ position: 'relative', width: '100%' }}>
                                    <input
                                        ref={durationInputRef}
                                        type="number"
                                        value={editDuration}
                                        onChange={(e) => setEditDuration(parseInt(e.target.value) || 0)}
                                        onKeyDown={handleKeyDown}
                                        style={{ ...styles.durationInput, paddingRight: '40px' }}
                                        min="15"
                                        step="15"
                                    />
                                    <span style={styles.unit}>分鐘</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{
                                ...styles.timeDisplay,
                                cursor: 'pointer',
                                opacity: 1,
                            }}
                            onClick={() => setIsEditing(true)}
                            onPointerDown={(e) => e.stopPropagation()}
                            title="點擊編輯時間"
                        >
                            <span style={styles.timeText}>{item.startTime || '09:00'}</span>
                            <span style={styles.durationText}>({item.duration || 60} 分鐘)</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const TimelineActivityItemPreview: React.FC<{ item: Product }> = ({
    item,
}) => {
    return (
        <div style={{ ...styles.container, paddingLeft: 0 }}>
            {/* Card */}
            <div
                style={{
                    ...styles.card,
                    transform: 'scale(1.02)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                    opacity: 0.9,
                    cursor: 'grabbing',
                }}
            >
                <div style={styles.cardContent}>
                    <div style={styles.headerRow}>
                        <h4 style={styles.title}>{item.title}</h4>
                    </div>
                    <div style={styles.timeInfo}>
                        {item.startTime || '09:00'} • {item.duration || 60} 分鐘
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        paddingLeft: '3rem',
        marginBottom: '1rem',
        userSelect: 'none' as const,
    },
    lineSegment: {
        position: 'absolute' as const,
        left: '27px',
        width: '2px',
        zIndex: 0,
        opacity: 0.3,
    },
    dot: {
        position: 'absolute' as const,
        left: '20px',
        top: '1.5rem',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        border: '3px solid white',
        zIndex: 1,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '1rem',
        display: 'flex',
        gap: '1rem',
        border: '1px solid rgba(0,0,0,0.03)',
        transition: 'all 0.2s ease',
        cursor: 'grab',
    },
    cardContent: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '0.5rem',
        flex: 1,
        minWidth: 0,
    },
    headerRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
    },
    title: {
        margin: 0,
        fontSize: '1rem',
        fontWeight: '600',
        color: '#2d3436',
        lineHeight: 1.4,
    },
    timeInfo: {
        fontSize: '0.85rem',
        color: '#b2bec3',
    },
    deleteBtn: {
        background: 'none',
        border: 'none',
        color: '#dfe6e9',
        cursor: 'pointer',
        fontSize: '1.5rem',
        padding: '0 0.25rem',
        lineHeight: 0.5,
        marginTop: '-4px',
        marginRight: '-8px',
        transition: 'color 0.2s',
    },
    timeDisplay: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '0.5rem',
        cursor: 'pointer',
        padding: '4px 8px',
        marginLeft: '-8px',
        borderRadius: '8px',
        transition: 'background-color 0.2s',
        width: 'fit-content',
    },
    timeText: {
        fontSize: '0.9rem',
        fontWeight: '600',
        color: '#2d3436',
        fontFamily: 'monospace',
    },
    durationText: {
        fontSize: '0.85rem',
        color: '#b2bec3',
    },
    editContainer: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        marginTop: '0.5rem',
        backgroundColor: '#f8f9fa',
        padding: '8px',
        borderRadius: '12px',
        width: '100%',
        boxSizing: 'border-box' as const,
        border: '1px solid #f1f2f6',
    },
    editRow: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '4px',
        width: '100%',
    },
    label: {
        fontSize: '0.75rem',
        color: '#636e72',
        fontWeight: '700',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    },
    timeInput: {
        width: '100%',
        border: '1px solid #dfe6e9',
        borderRadius: '8px',
        padding: '4px 8px',
        fontSize: '0.9rem',
        color: '#2d3436',
        outline: 'none',
        fontFamily: 'monospace',
        backgroundColor: 'white',
        boxSizing: 'border-box' as const,
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    },
    durationInput: {
        width: '100%',
        border: '1px solid #dfe6e9',
        borderRadius: '8px',
        padding: '4px 8px',
        fontSize: '0.9rem',
        color: '#2d3436',
        outline: 'none',
        textAlign: 'center' as const,
        backgroundColor: 'white',
        boxSizing: 'border-box' as const,
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    },
    unit: {
        fontSize: '0.85rem',
        color: '#636e72',
        position: 'absolute' as const,
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none' as const,
    },
};

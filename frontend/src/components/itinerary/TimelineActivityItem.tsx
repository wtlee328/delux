import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Product {
    id: string;
    title: string;
    productType: 'activity' | 'accommodation' | 'food' | 'transportation';
    timelineId?: string;
    startTime?: string;
    duration?: number;
}

interface TimelineActivityItemProps {
    item: Product;
    colorTheme: { primary: string; light: string; dot: string };
    onTimeUpdate: (id: string, startTime: string, duration: number) => void;
    onDelete: (id: string) => void;
    isStartTimeEditable: boolean;
}

const getActivityIcon = (type: string) => {
    switch (type) {
        case 'activity': return '🎫';
        case 'accommodation': return '🏨';
        case 'food': return '🍽️';
        case 'transportation': return '🚌';
        default: return '📍';
    }
};

export const TimelineActivityItem: React.FC<TimelineActivityItemProps> = ({
    item,
    colorTheme,
    onTimeUpdate,
    onDelete,
    isStartTimeEditable,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTime, setEditTime] = useState(item.startTime || '09:00');
    const [editDuration, setEditDuration] = useState(item.duration || 60);
    const inputRef = useRef<HTMLInputElement>(null);

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
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = () => {
        onTimeUpdate(item.timelineId!, editTime, editDuration);
        setIsEditing(false);
    };

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
                }}
            >
                <div style={{ ...styles.iconBox, backgroundColor: colorTheme.light }}>
                    {getActivityIcon(item.productType)}
                </div>

                <div style={styles.content}>
                    <div style={styles.header}>
                        <h4 style={styles.title}>{item.title}</h4>
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); onDelete(item.timelineId!); }}
                            style={styles.deleteBtn}
                            title="Remove"
                        >
                            ×
                        </button>
                    </div>

                    {isEditing ? (
                        <div
                            style={styles.editContainer}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <div style={styles.editRow}>
                                <span style={styles.label}>開始</span>
                                <input
                                    ref={inputRef}
                                    type="time"
                                    value={editTime}
                                    onChange={(e) => setEditTime(e.target.value)}
                                    onBlur={handleSave}
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
                                        type="number"
                                        value={editDuration}
                                        onChange={(e) => setEditDuration(parseInt(e.target.value) || 0)}
                                        onBlur={handleSave}
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

export const TimelineActivityItemPreview: React.FC<{ item: Product; colorTheme?: { primary: string; light: string; dot: string } }> = ({
    item,
    colorTheme = { primary: '#b2bec3', light: '#f1f2f6', dot: '#636e72' } // Default muted theme
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
                }}
            >
                <div style={{ ...styles.iconBox, backgroundColor: colorTheme.light }}>
                    {getActivityIcon(item.productType)}
                </div>

                <div style={styles.content}>
                    <div style={styles.header}>
                        <h4 style={styles.title}>{item.title}</h4>
                    </div>

                    <div style={styles.timeDisplay}>
                        <span style={styles.timeText}>{item.startTime || '09:00'}</span>
                        <span style={styles.durationText}>({item.duration || 60} 分鐘)</span>
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
    iconBox: {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        flexShrink: 0,
    },
    content: {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '0.25rem',
    },
    title: {
        margin: 0,
        fontSize: '1rem',
        fontWeight: '600',
        color: '#2d3436',
        lineHeight: 1.4,
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
        padding: '6px 8px',
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
        padding: '6px 8px',
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

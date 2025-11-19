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
}

const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
        accommodation: '🏨',
        food: '🍽️',
        activity: '🎯',
        transportation: '🚗',
    };
    return icons[type] || '📍';
};

export const TimelineActivityItem: React.FC<TimelineActivityItemProps> = ({
    item,
    colorTheme,
    onTimeUpdate,
    onDelete,
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
                            <input
                                ref={inputRef}
                                type="time"
                                value={editTime}
                                onChange={(e) => setEditTime(e.target.value)}
                                onBlur={handleSave}
                                onKeyDown={handleKeyDown}
                                style={styles.timeInput}
                            />
                            <span style={styles.separator}>停留</span>
                            <input
                                type="number"
                                value={editDuration}
                                onChange={(e) => setEditDuration(parseInt(e.target.value) || 0)}
                                onBlur={handleSave}
                                onKeyDown={handleKeyDown}
                                style={styles.durationInput}
                                min="15"
                                step="15"
                            />
                            <span style={styles.unit}>分鐘</span>
                        </div>
                    ) : (
                        <div
                            style={styles.timeDisplay}
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
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: '0.25rem',
        backgroundColor: '#f8f9fa',
        padding: '4px 8px',
        borderRadius: '8px',
        width: 'fit-content',
    },
    timeInput: {
        border: '1px solid #dfe6e9',
        borderRadius: '6px',
        padding: '2px 6px',
        fontSize: '0.9rem',
        color: '#2d3436',
        outline: 'none',
        fontFamily: 'monospace',
        backgroundColor: 'white',
    },
    durationInput: {
        border: '1px solid #dfe6e9',
        borderRadius: '6px',
        padding: '2px 6px',
        fontSize: '0.9rem',
        color: '#2d3436',
        outline: 'none',
        width: '50px',
        textAlign: 'center' as const,
        backgroundColor: 'white',
    },
    separator: {
        fontSize: '0.8rem',
        color: '#b2bec3',
        fontWeight: '500',
    },
    unit: {
        fontSize: '0.8rem',
        color: '#b2bec3',
    },
};

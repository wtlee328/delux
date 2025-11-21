import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TimelineActivityItem } from './TimelineActivityItem';

interface Product {
    id: string;
    title: string;
    destination: string;
    category: string;
    coverImageUrl: string;
    netPrice: number;
    supplierName: string;
    productType: 'landmark' | 'accommodation' | 'food' | 'transportation';
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

interface TimelineDay {
    dayNumber: number;
    items: Product[];
    date?: string;
    dayOfWeek?: string;
}

interface TimelineDayColumnProps {
    day: TimelineDay;
    colorTheme: { primary: string; light: string; dot: string };
    onTimeUpdate: (id: string, startTime: string, duration: number) => void;
    onDelete: (id: string) => void;
    onPreview: (product: Product) => void;
}

export const TimelineDayColumn: React.FC<TimelineDayColumnProps> = ({
    day,
    colorTheme,
    onTimeUpdate,
    onDelete,
    onPreview,
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `day-${day.dayNumber}`,
        data: { type: 'day', dayNumber: day.dayNumber },
    });

    return (
        <div style={styles.column}>
            {/* Header */}
            <div style={styles.header}>
                <div style={{ ...styles.dayBadge, backgroundColor: colorTheme.light, color: colorTheme.primary }}>
                    第 {day.dayNumber} 天
                </div>
                {day.date && (
                    <div style={styles.dateInfo}>
                        <span style={styles.dateText}>{day.date}</span>
                        <span style={styles.dayOfWeek}>{day.dayOfWeek}</span>
                    </div>
                )}
            </div>

            {/* Timeline Area */}
            <div style={styles.timelineArea}>
                {/* Central Line Background */}
                <div style={{ ...styles.centralLine, backgroundColor: colorTheme.primary }} />

                <div
                    ref={setNodeRef}
                    style={{
                        ...styles.dropZone,
                        backgroundColor: isOver ? colorTheme.light + '20' : 'transparent',
                    }}
                >
                    <SortableContext
                        items={day.items.map(item => item.timelineId!)}
                        strategy={verticalListSortingStrategy}
                    >
                        {day.items.length === 0 ? (
                            <div style={styles.emptyState}>
                                <p style={styles.emptyText}>將活動拖曳至此</p>
                            </div>
                        ) : (
                            day.items.map((item, index) => (
                                <TimelineActivityItem
                                    key={item.timelineId}
                                    item={item}
                                    colorTheme={colorTheme}
                                    onTimeUpdate={onTimeUpdate}
                                    onDelete={onDelete}
                                    isStartTimeEditable={index === 0}
                                    onPreview={onPreview}
                                />
                            ))
                        )}
                    </SortableContext>
                </div>
            </div>
        </div>
    );
};

const styles = {
    column: {
        minWidth: '340px',
        maxWidth: '340px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        overflow: 'hidden',
        flexShrink: 0,
        border: '1px solid #f1f2f6',
    },
    header: {
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    dateInfo: {
        marginLeft: 'auto',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'flex-end',
        lineHeight: 1.2,
    },
    dateText: {
        fontSize: '0.9rem',
        fontWeight: '600',
        color: '#2d3436',
    },
    dayOfWeek: {
        fontSize: '0.75rem',
        color: '#b2bec3',
        fontWeight: '500',
    },
    dayBadge: {
        padding: '0.5rem 1rem',
        borderRadius: '20px',
        fontSize: '1rem',
        fontWeight: '700',
        letterSpacing: '0.5px',
    },
    timelineArea: {
        flex: 1,
        position: 'relative' as const,
        overflowY: 'auto' as const,
        overflowX: 'hidden' as const,
    },
    centralLine: {
        position: 'absolute' as const,
        left: '27px', // Matches TimelineActivityItem line position
        top: 0,
        bottom: 0,
        width: '2px',
        opacity: 0.2,
        zIndex: 0,
    },
    dropZone: {
        minHeight: '100%',
        padding: '0 1rem 2rem 0', // Right padding for scrollbar space
        position: 'relative' as const,
        zIndex: 1,
    },
    emptyState: {
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px dashed #f1f2f6',
        borderRadius: '16px',
        margin: '1rem 1rem 1rem 3rem', // Left margin to clear the timeline line
        backgroundColor: '#fafafa',
    },
    emptyText: {
        color: '#b2bec3',
        fontSize: '1rem',
        fontWeight: '500',
    },
};

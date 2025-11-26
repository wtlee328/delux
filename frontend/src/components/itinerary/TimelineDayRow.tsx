import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TimelineActivityItem } from './TimelineActivityItem';
import { Product, TimelineDay } from '../../types/itinerary';

interface TimelineDayRowProps {
    day: TimelineDay;
    colorTheme: { primary: string; light: string; dot: string };
    onTimeUpdate: (id: string, startTime: string, duration: number) => void;
    onDelete: (id: string) => void;
    onEdit?: (id: string) => void;
    onPreview: (product: Product) => void;
    isExpanded: boolean;
    onToggle: () => void;
}

export const TimelineDayRow: React.FC<TimelineDayRowProps> = ({
    day,
    colorTheme,
    onTimeUpdate,
    onDelete,
    onEdit,
    onPreview,
    isExpanded,
    onToggle,
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `day-${day.dayNumber}`,
        data: { type: 'day', dayNumber: day.dayNumber },
    });

    // Summary Data
    // Debug logging
    console.log(`Day ${day.dayNumber} items:`, day.items);

    const landmarks = day.items.filter(i => (i.productType === 'landmark' || i.productType === 'transportation') && i.timelineId);
    const meals = day.items.filter(i => i.productType === 'food');
    const hotels = day.items.filter(i => i.productType === 'accommodation');

    return (
        <div style={styles.container}>
            {/* Summary Card */}
            <div style={styles.summaryCard} onClick={onToggle}>
                <div style={styles.dayColumn}>
                    <div style={styles.dayNumber}>
                        第<span style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{day.dayNumber}</span>天
                    </div>
                </div>

                <div style={styles.summaryContent}>
                    {/* Route */}
                    <div style={{ ...styles.summaryRow, marginBottom: '8px' }}>
                        <div style={styles.routeText}>
                            {landmarks.length > 0 ? (
                                landmarks.map((l, i) => (
                                    <React.Fragment key={l.timelineId || i}>
                                        {i > 0 && <span style={styles.arrow}> – </span>}
                                        <span>{l.title}</span>
                                    </React.Fragment>
                                ))
                            ) : (
                                <span style={{ color: '#b2bec3' }}>點擊展開規劃行程</span>
                            )}
                        </div>
                        {day.date && (
                            <div style={styles.dateText}>
                                {day.date} {day.dayOfWeek}
                            </div>
                        )}
                    </div>

                    {/* Meals */}
                    <div style={styles.summaryRow}>
                        <span style={styles.label}>餐食：</span>
                        <span style={styles.summaryText}>
                            {meals.length > 0 ? meals.map(m => m.title).join('、') : '敬請自理'}
                        </span>
                    </div>

                    {/* Hotel */}
                    <div style={styles.summaryRow}>
                        <span style={styles.label}>住宿：</span>
                        <span style={{ ...styles.summaryText, color: hotels.length > 0 ? '#e17055' : '#b2bec3', fontWeight: hotels.length > 0 ? '600' : 'normal' }}>
                            {hotels.length > 0 ? hotels.map(h => h.title).join(' 或 ') : '尚未安排'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div style={styles.expandedArea}>
                    <div style={{ ...styles.timelineLine, backgroundColor: colorTheme.primary }} />
                    <div
                        ref={setNodeRef}
                        style={{
                            ...styles.dropZone,
                            backgroundColor: isOver ? colorTheme.light + '20' : 'transparent'
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
                                day.items.map((item) => (
                                    <TimelineActivityItem
                                        key={item.timelineId}
                                        item={item}
                                        colorTheme={colorTheme}
                                        onTimeUpdate={onTimeUpdate}
                                        onDelete={onDelete}
                                        onEdit={onEdit}
                                        isStartTimeEditable={true}
                                        onPreview={onPreview}
                                    />
                                ))
                            )}
                        </SortableContext>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        marginBottom: '1rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    },
    summaryCard: {
        display: 'flex',
        cursor: 'pointer',
        minHeight: '80px',
        transition: 'background-color 0.2s',
        borderRadius: '12px',
        overflow: 'hidden',
    },
    dayColumn: {
        width: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRight: '1px solid #f1f2f6',
        backgroundColor: '#fafafa',
        flexShrink: 0,
    },
    dayNumber: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        color: '#2d3436',
        fontSize: '0.9rem',
    },
    summaryContent: {
        flex: 1,
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        gap: '6px',
        minWidth: 0,
    },
    summaryRow: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '8px',
        fontSize: '0.9rem',
        lineHeight: 1.4,
    },
    routeText: {
        fontWeight: '600',
        color: '#2d3436',
        flex: 1,
        display: 'flex',
        flexWrap: 'wrap' as const,
        gap: '4px',
        alignItems: 'center',
    },
    arrow: {
        color: '#b2bec3',
        fontSize: '0.9rem',
        margin: '0 4px',
    },
    dateText: {
        fontSize: '0.85rem',
        color: '#b2bec3',
        marginLeft: 'auto',
        whiteSpace: 'nowrap' as const,
    },
    label: {
        color: '#636e72',
        minWidth: '45px',
        fontSize: '0.85rem',
    },
    summaryText: {
        color: '#2d3436',
        fontSize: '0.9rem',
    },
    expandedArea: {
        position: 'relative' as const,
        borderTop: '1px solid #f1f2f6',
        backgroundColor: '#fafafa',
        padding: '1rem 0',
        borderBottomLeftRadius: '12px',
        borderBottomRightRadius: '12px',
    },
    timelineLine: {
        position: 'absolute' as const,
        left: '27px',
        top: 0,
        bottom: 0,
        width: '2px',
        opacity: 0.2,
        zIndex: 0,
    },
    dropZone: {
        minHeight: '100px',
        padding: '0 1rem',
        position: 'relative' as const,
        zIndex: 1,
    },
    emptyState: {
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px dashed #dfe6e9',
        borderRadius: '8px',
        margin: '0 1rem 0 3rem',
        backgroundColor: 'white',
    },
    emptyText: {
        color: '#b2bec3',
        fontSize: '0.9rem',
    },
};

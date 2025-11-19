import React from 'react';
import { StrictModeDroppable } from './StrictModeDroppable';
import { TimelineActivityItem } from './TimelineActivityItem';

interface Product {
    id: string;
    title: string;
    productType: 'activity' | 'accommodation' | 'food' | 'transportation';
    timelineId?: string;
    startTime?: string;
    duration?: number;
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
}

export const TimelineDayColumn: React.FC<TimelineDayColumnProps> = ({
    day,
    colorTheme,
    onTimeUpdate,
    onDelete,
}) => {
    return (
        <div style={styles.column}>
            {/* Header */}
            <div style={{ ...styles.header, borderTopColor: colorTheme.primary }}>
                <div style={{ ...styles.dayBadge, backgroundColor: colorTheme.light, color: colorTheme.primary }}>
                    Day {day.dayNumber}
                </div>
                <div style={styles.dateInfo}>
                    {day.date && <span style={styles.date}>{day.date}</span>}
                    {day.dayOfWeek && <span style={styles.dayOfWeek}>{day.dayOfWeek}</span>}
                </div>
            </div>

            {/* Timeline Area */}
            <div style={styles.timelineArea}>
                {/* Central Line Background */}
                <div style={{ ...styles.centralLine, backgroundColor: colorTheme.primary }} />

                <StrictModeDroppable droppableId={`day-${day.dayNumber}`}>
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            style={{
                                ...styles.dropZone,
                                backgroundColor: snapshot.isDraggingOver ? colorTheme.light + '40' : 'transparent', // 40 is hex opacity
                            }}
                        >
                            {day.items.length === 0 ? (
                                <div style={styles.emptyState}>
                                    <p style={styles.emptyText}>Drop activities here</p>
                                </div>
                            ) : (
                                day.items.map((item, index) => (
                                    <TimelineActivityItem
                                        key={item.timelineId || item.id}
                                        item={item}
                                        index={index}
                                        colorTheme={colorTheme}
                                        onTimeUpdate={onTimeUpdate}
                                        onDelete={onDelete}
                                    />
                                ))
                            )}
                            {provided.placeholder}
                        </div>
                    )}
                </StrictModeDroppable>
            </div>
        </div>
    );
};

const styles = {
    column: {
        minWidth: '320px',
        maxWidth: '320px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        overflow: 'hidden',
        flexShrink: 0,
    },
    header: {
        padding: '1.25rem 1.5rem',
        borderTop: '4px solid',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        borderBottom: '1px solid #f1f2f6',
    },
    dayBadge: {
        padding: '0.25rem 0.75rem',
        borderRadius: '20px',
        fontSize: '0.9rem',
        fontWeight: '700',
        letterSpacing: '0.5px',
    },
    dateInfo: {
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'baseline',
    },
    date: {
        fontSize: '1.1rem',
        fontWeight: '600',
        color: '#2d3436',
    },
    dayOfWeek: {
        fontSize: '0.9rem',
        color: '#b2bec3',
        fontWeight: '500',
    },
    timelineArea: {
        flex: 1,
        position: 'relative' as const,
        overflowY: 'auto' as const,
        overflowX: 'hidden' as const,
    },
    centralLine: {
        position: 'absolute' as const,
        left: '27px', // 1.5rem padding + 11px offset roughly
        top: 0,
        bottom: 0,
        width: '2px',
        opacity: 0.2,
        zIndex: 0,
    },
    dropZone: {
        minHeight: '100%',
        padding: '1.5rem 1rem',
        position: 'relative' as const,
        zIndex: 1,
    },
    emptyState: {
        height: '150px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px dashed #f1f2f6',
        borderRadius: '12px',
        margin: '0 0.5rem',
    },
    emptyText: {
        color: '#b2bec3',
        fontSize: '0.9rem',
        fontWeight: '500',
    },
};

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
            <div style={styles.header}>
                <div style={{ ...styles.dayBadge, backgroundColor: colorTheme.light, color: colorTheme.primary }}>
                    Day {day.dayNumber}
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
                                backgroundColor: snapshot.isDraggingOver ? colorTheme.light + '20' : 'transparent',
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

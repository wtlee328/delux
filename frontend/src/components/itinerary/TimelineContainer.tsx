import React from 'react';
import { TimelineDayColumn } from './TimelineDayColumn';

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

interface TimelineContainerProps {
    timeline: TimelineDay[];
    onTimeUpdate: (dayNumber: number, itemId: string, startTime: string, duration: number) => void;
    onDelete: (dayNumber: number, itemId: string) => void;
    onAddDay: () => void;
}

const dayColorThemes = [
    { primary: '#FFB6C1', light: '#FFF0F2', dot: '#FF69B4' }, // Pink
    { primary: '#98D8C8', light: '#E8F5F1', dot: '#5FD3B3' }, // Mint Green
    { primary: '#FFD4A3', light: '#FFF4E6', dot: '#FFB347' }, // Peach
    { primary: '#B4A7D6', light: '#E8E4F3', dot: '#9370DB' }, // Lavender
    { primary: '#A8D8EA', light: '#E3F2FD', dot: '#4FC3F7' }, // Sky Blue
    { primary: '#FFE5B4', light: '#FFF8E7', dot: '#FFD54F' }, // Cream
];

export const TimelineContainer: React.FC<TimelineContainerProps> = ({
    timeline,
    onTimeUpdate,
    onDelete,
    onAddDay,
}) => {
    return (
        <div style={styles.container}>
            <div style={styles.scrollArea}>
                {timeline.map((day, index) => (
                    <TimelineDayColumn
                        key={day.dayNumber}
                        day={day}
                        colorTheme={dayColorThemes[index % dayColorThemes.length]}
                        onTimeUpdate={(itemId, startTime, duration) => onTimeUpdate(day.dayNumber, itemId, startTime, duration)}
                        onDelete={(itemId) => onDelete(day.dayNumber, itemId)}
                    />
                ))}

                {/* Add Day Button Column */}
                <div style={styles.addDayColumn}>
                    <button onClick={onAddDay} style={styles.addDayBtn}>
                        <span style={styles.plusIcon}>+</span>
                        <span>新增天數</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        height: '100%',
        backgroundColor: '#f8f9fa',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column' as const,
    },
    scrollArea: {
        flex: 1,
        display: 'flex',
        gap: '1.5rem',
        padding: '1.5rem',
        overflowX: 'auto' as const,
        overflowY: 'hidden' as const,
        scrollSnapType: 'x mandatory',
        alignItems: 'flex-start',
    },
    addDayColumn: {
        minWidth: '100px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    addDayBtn: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '0.5rem',
        padding: '1rem 1.5rem',
        backgroundColor: 'white',
        border: '2px dashed #dfe6e9',
        borderRadius: '12px',
        color: '#b2bec3',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontSize: '0.9rem',
        fontWeight: '600',
        outline: 'none',
    },
    plusIcon: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
    },
};

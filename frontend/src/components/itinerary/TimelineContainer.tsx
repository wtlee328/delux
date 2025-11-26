import React, { useState, useRef, useImperativeHandle, useEffect } from 'react';
import { TimelineDayRow } from './TimelineDayRow';
import { MiniTimeline } from './MiniTimeline';
import { Product, TimelineDay } from '../../types/itinerary';

interface TimelineContainerProps {
    timeline: TimelineDay[];
    onTimeUpdate: (dayNumber: number, itemId: string, startTime: string, duration: number) => void;
    onDelete: (dayNumber: number, itemId: string) => void;
    onPreview: (product: Product) => void;
    onAddDay?: () => void;
}

export interface TimelineContainerRef {
    scrollToDay: (dayNumber: number) => void;
}

export const dayColorThemes = [
    { primary: '#A8D8EA', light: '#E3F2FD', dot: '#4FC3F7' }, // Sky Blue
    { primary: '#98D8C8', light: '#E8F5F1', dot: '#5FD3B3' }, // Mint Green
    { primary: '#FFD4A3', light: '#FFF4E6', dot: '#FFB347' }, // Peach
    { primary: '#B4A7D6', light: '#E8E4F3', dot: '#9370DB' }, // Lavender
    { primary: '#FFB6C1', light: '#FFF0F2', dot: '#FF69B4' }, // Pink
    { primary: '#FFE5B4', light: '#FFF8E7', dot: '#FFD54F' }, // Cream
];

export const TimelineContainer = React.forwardRef<TimelineContainerRef, TimelineContainerProps>((
    {
        timeline,
        onTimeUpdate,
        onDelete,
        onPreview,
        onAddDay,
    },
    ref
) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});
    const [activeDay, setActiveDay] = useState(1);

    // Initialize first day as expanded
    useEffect(() => {
        if (timeline.length > 0 && Object.keys(expandedDays).length === 0) {
            setExpandedDays({ [timeline[0].dayNumber]: true });
        }
    }, [timeline.length]);

    const toggleDay = (dayNumber: number) => {
        setExpandedDays(prev => ({
            ...prev,
            [dayNumber]: !prev[dayNumber]
        }));
    };

    const scrollToDay = (dayNumber: number) => {
        // Expand the day we are scrolling to
        setExpandedDays(prev => ({ ...prev, [dayNumber]: true }));
        setActiveDay(dayNumber);

        // Find element and scroll
        const element = document.getElementById(`day-row-${dayNumber}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Expose scrollToDay method to parent component via ref
    useImperativeHandle(ref, () => ({
        scrollToDay
    }));

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <MiniTimeline
                    days={timeline.map(d => ({ dayNumber: d.dayNumber, date: d.date }))}
                    activeDay={activeDay}
                    onDayClick={scrollToDay}
                    colorThemes={dayColorThemes}
                />
            </div>

            <div
                ref={scrollContainerRef}
                style={styles.scrollArea}
            >
                <div style={styles.contentWrapper}>
                    {timeline.map((day, index) => (
                        <div id={`day-row-${day.dayNumber}`} key={day.dayNumber}>
                            <TimelineDayRow
                                day={day}
                                colorTheme={dayColorThemes[index % dayColorThemes.length]}
                                onTimeUpdate={(itemId, startTime, duration) => onTimeUpdate(day.dayNumber, itemId, startTime, duration)}
                                onDelete={(itemId) => onDelete(day.dayNumber, itemId)}
                                onPreview={onPreview}
                                isExpanded={!!expandedDays[day.dayNumber]}
                                onToggle={() => toggleDay(day.dayNumber)}
                            />
                        </div>
                    ))}

                    {onAddDay && (
                        <div style={styles.addDayContainer}>
                            <button onClick={onAddDay} style={styles.addDayBtn}>
                                + 新增一天
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

const styles = {
    container: {
        height: '100%',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column' as const,
        overflow: 'hidden',
    },
    header: {
        flexShrink: 0,
        backgroundColor: 'white',
        borderBottom: '1px solid #f1f2f6',
        zIndex: 10,
    },
    scrollArea: {
        flex: 1,
        overflowY: 'auto' as const,
        overflowX: 'hidden' as const,
        padding: '1.5rem',
        scrollBehavior: 'smooth' as const,
    },
    contentWrapper: {
        maxWidth: '800px', // Limit width for better readability on wide screens
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '0.5rem',
        paddingBottom: '3rem',
    },
    addDayContainer: {
        marginTop: '1rem',
        display: 'flex',
        justifyContent: 'center',
    },
    addDayBtn: {
        padding: '0.75rem 2rem',
        backgroundColor: 'white',
        border: '1px dashed #b2bec3',
        borderRadius: '8px',
        color: '#636e72',
        cursor: 'pointer',
        fontSize: '0.9rem',
        transition: 'all 0.2s',
        ':hover': {
            borderColor: '#0984e3',
            color: '#0984e3',
        }
    }
};

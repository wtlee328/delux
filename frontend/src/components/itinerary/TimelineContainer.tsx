import React, { useState, useRef, useImperativeHandle, useEffect } from 'react';
import { TimelineDayRow } from './TimelineDayRow';
import { MiniTimeline } from './MiniTimeline';
import { Product, TimelineDay } from '../../types/itinerary';

interface TimelineContainerProps {
    timeline: TimelineDay[];
    onTimeUpdate: (dayNumber: number, itemId: string, startTime: string, duration: number) => void;
    onDelete: (dayNumber: number, itemId: string) => void;
    onReorder?: (dayNumber: number, itemId: string, direction: 'up' | 'down') => void;
    onAddItem?: (dayNumber: number, productId: string) => void;
    onEdit?: (dayNumber: number, itemId: string) => void;
    onPreview: (product: Product) => void;
    onAddDay?: () => void;
    products?: Product[];
    onDayFieldChange?: (dayNumber: number, field: string, value: any) => void;
    onCalculateRoute?: (dayNumber: number) => void;
    onShowDayRoute?: (dayNumber: number) => void;
    focusedDay?: number | null;
    onItemHover?: (itemId: string | null) => void;
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
        onReorder,
        onAddItem,
        onEdit,
        onPreview,
        onAddDay,
        products,
        onDayFieldChange,
        onCalculateRoute,
        onShowDayRoute,
        focusedDay,
        onItemHover,
    },
    ref
) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});
    const [activeDay, setActiveDay] = useState(1);

    // Initialize all as collapsed (per user request)
    useEffect(() => {
        setExpandedDays({});
    }, [timeline.length]);

    const toggleDay = (dayNumber: number) => {
        setExpandedDays(prev => ({
            ...prev,
            [dayNumber]: !prev[dayNumber]
        }));
    };

    const isAllExpanded = timeline.length > 0 && timeline.every(day => expandedDays[day.dayNumber]);

    const toggleAll = () => {
        if (isAllExpanded) {
            setExpandedDays({});
        } else {
            const all: Record<number, boolean> = {};
            timeline.forEach(day => {
                all[day.dayNumber] = true;
            });
            setExpandedDays(all);
        }
    };

    const scrollToDay = (dayNumber: number) => {
        // Only scroll, do not force expand (per user request)
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
                <div style={styles.headerTop}>
                    <MiniTimeline
                        days={timeline.map(d => ({ dayNumber: d.dayNumber, date: d.date }))}
                        activeDay={activeDay}
                        onDayClick={scrollToDay}
                        colorThemes={dayColorThemes}
                    />
                    <button 
                        onClick={toggleAll}
                        style={styles.toggleAllBtn}
                        title={isAllExpanded ? "全部收合" : "全部展開"}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                            {isAllExpanded ? 'unfold_less' : 'unfold_more'}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                            {isAllExpanded ? '收合' : '展開'}
                        </span>
                    </button>
                </div>
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
                                onReorder={(itemId, direction) => onReorder?.(day.dayNumber, itemId, direction)}
                                onAddItem={(productId) => onAddItem?.(day.dayNumber, productId)}
                                onEdit={(itemId) => onEdit?.(day.dayNumber, itemId)}
                                onPreview={onPreview}
                                isExpanded={!!expandedDays[day.dayNumber]}
                                onToggle={() => toggleDay(day.dayNumber)}
                                products={products}
                                onDayFieldChange={onDayFieldChange}
                                onCalculateRoute={onCalculateRoute}
                                onShowDayRoute={onShowDayRoute}
                                isFocused={focusedDay === day.dayNumber}
                                onItemHover={onItemHover}
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
        backgroundColor: 'transparent',
        display: 'flex',
        flexDirection: 'column' as const,
        overflow: 'hidden',
    },
    header: {
        flexShrink: 0,
        backgroundColor: 'transparent',
        zIndex: 10,
        padding: '0 1.5rem',
        paddingTop: '20px', // Optical alignment
    },
    headerTop: {
        maxWidth: '800px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'flex-start', // Align to top for manual nudge
        justifyContent: 'space-between',
        gap: '1rem',
    },
    toggleAllBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 14px',
        borderRadius: '20px',
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        color: '#64748b',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        outline: 'none',
        flexShrink: 0,
        whiteSpace: 'nowrap' as const,
        marginTop: '34px', // Manually align center of button with the 50px midline of the mini timeline
        '&:hover': {
            backgroundColor: '#f8fafc',
            borderColor: '#cbd5e1',
            color: '#1e293b',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        }
    },
    scrollArea: {
        flex: 1,
        overflowY: 'auto' as const,
        overflowX: 'hidden' as const,
        padding: '1.5rem',
        scrollBehavior: 'smooth' as const,
    },
    contentWrapper: {
        maxWidth: '800px', 
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

export default TimelineContainer;

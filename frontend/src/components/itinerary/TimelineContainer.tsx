import React from 'react';
import { TimelineDayColumn } from './TimelineDayColumn';
import { MiniTimeline } from './MiniTimeline';

interface Product {
    id: string;
    title: string;
    destination: string;
    category: string;
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
    onPreview: (product: Product) => void;
}

export const dayColorThemes = [
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
    onPreview,
}) => {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = React.useState(false);
    const [showRightArrow, setShowRightArrow] = React.useState(false);
    const [activeDay, setActiveDay] = React.useState(1);
    const isProgrammaticScroll = React.useRef(false);
    const scrollTimeout = React.useRef<NodeJS.Timeout>();
    const prevTimelineLength = React.useRef(timeline.length);

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10); // -10 buffer

            // Update active day based on scroll position only if not scrolling programmatically
            if (!isProgrammaticScroll.current) {
                const cardWidth = 340 + 24; // Width + gap
                const index = Math.round(scrollLeft / cardWidth);
                if (timeline[index]) {
                    setActiveDay(timeline[index].dayNumber);
                }
            }
        }
    };

    // Watch for new days
    React.useEffect(() => {
        if (timeline.length > prevTimelineLength.current) {
            // Day added, scroll to the last day
            const lastDay = timeline[timeline.length - 1];
            // Use a small timeout to ensure DOM is ready
            setTimeout(() => {
                scrollToDay(lastDay.dayNumber);
            }, 100);
        }
        prevTimelineLength.current = timeline.length;
    }, [timeline.length]);

    const scrollToDay = (dayNumber: number) => {
        const index = timeline.findIndex(d => d.dayNumber === dayNumber);
        if (index !== -1 && scrollContainerRef.current) {
            isProgrammaticScroll.current = true;
            setActiveDay(dayNumber); // Update immediately

            const scrollAmount = 340 + 24;
            scrollContainerRef.current.scrollTo({
                left: index * scrollAmount,
                behavior: 'smooth'
            });

            // Reset flag after scroll animation
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
            scrollTimeout.current = setTimeout(() => {
                isProgrammaticScroll.current = false;
            }, 800); // Slightly longer than smooth scroll duration
        }
    };

    React.useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [timeline]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 340 + 24; // Card width + gap
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    return (
        <div style={styles.container}>
            <MiniTimeline
                days={timeline.map(d => ({ dayNumber: d.dayNumber, date: d.date }))}
                activeDay={activeDay}
                onDayClick={scrollToDay}
                colorThemes={dayColorThemes}
            />

            {showLeftArrow && (
                <button
                    onClick={() => scroll('left')}
                    style={{ ...styles.scrollArrow, left: '20px' }}
                    aria-label="Scroll left"
                >
                    ←
                </button>
            )}

            {showRightArrow && (
                <button
                    onClick={() => scroll('right')}
                    style={{ ...styles.scrollArrow, right: '20px' }}
                    aria-label="Scroll right"
                >
                    →
                </button>
            )}

            <div
                ref={scrollContainerRef}
                style={styles.scrollArea}
                onScroll={checkScroll}
            >
                {timeline.map((day, index) => (
                    <TimelineDayColumn
                        key={day.dayNumber}
                        day={day}
                        colorTheme={dayColorThemes[index % dayColorThemes.length]}
                        onTimeUpdate={(itemId, startTime, duration) => onTimeUpdate(day.dayNumber, itemId, startTime, duration)}
                        onDelete={(itemId) => onDelete(day.dayNumber, itemId)}
                        onPreview={onPreview}
                    />
                ))}
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
        position: 'relative' as const,
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
        scrollbarWidth: 'none' as const, // Hide scrollbar for cleaner look
        msOverflowStyle: 'none' as const,
    },
    scrollArrow: {
        position: 'absolute' as const,
        top: '50%',
        transform: 'translateY(-50%)',
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: 'white',
        border: '1px solid #f1f2f6',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 10,
        fontSize: '1.2rem',
        color: '#2d3436',
        transition: 'all 0.2s ease',
        outline: 'none',
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

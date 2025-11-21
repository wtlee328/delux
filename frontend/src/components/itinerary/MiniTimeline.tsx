import React from 'react';

interface MiniTimelineProps {
    days: { dayNumber: number; date?: string }[];
    activeDay: number;
    onDayClick: (dayNumber: number) => void;
    colorThemes: { primary: string; light: string; dot: string }[];
}

export const MiniTimeline: React.FC<MiniTimelineProps> = ({
    days,
    activeDay,
    onDayClick,
    colorThemes
}) => {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll the mini-timeline to keep active day visible
    React.useEffect(() => {
        if (scrollContainerRef.current) {
            const activeNode = scrollContainerRef.current.querySelector(`[data-day="${activeDay}"]`);
            if (activeNode) {
                activeNode.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    }, [activeDay]);

    return (
        <div style={styles.wrapper}>
            <div ref={scrollContainerRef} style={styles.container}>
                {/* Connecting Line */}
                <div style={styles.line} />

                {days.map((day, index) => {
                    const isActive = day.dayNumber === activeDay;
                    const theme = colorThemes[index % colorThemes.length];

                    return (
                        <button
                            key={day.dayNumber}
                            data-day={day.dayNumber}
                            onClick={() => onDayClick(day.dayNumber)}
                            style={{
                                ...styles.nodeBtn,
                                ...(isActive ? { transform: 'scale(1.1)' } : {}),
                            }}
                            aria-label={`Go to Day ${day.dayNumber}${day.date ? `, ${day.date}` : ''}`}
                            title={`Day ${day.dayNumber} ${day.date ? `— ${day.date}` : ''}`}
                        >
                            <div
                                style={{
                                    ...styles.circle,
                                    backgroundColor: isActive ? theme.primary : '#f1f2f6',
                                    color: isActive ? 'white' : '#b2bec3',
                                    border: isActive ? `2px solid ${theme.dot}` : '2px solid transparent',
                                    boxShadow: isActive ? `0 0 0 2px white, 0 0 0 4px ${theme.light}` : 'none',
                                }}
                            >
                                {day.dayNumber}
                            </div>
                            {isActive && (
                                <span style={{ ...styles.label, color: theme.dot }}>
                                    {day.date || `Day ${day.dayNumber}`}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Fade gradients for scroll indication */}
            <div style={styles.fadeLeft} />
            <div style={styles.fadeRight} />
        </div>
    );
};

const styles = {
    wrapper: {
        position: 'relative' as const,
        width: '100%',
        height: '80px',
        backgroundColor: 'white',
        borderBottom: '1px solid #f1f2f6',
        display: 'flex',
        alignItems: 'center',
        zIndex: 20,
    },
    container: {
        display: 'flex',
        alignItems: 'center',
        gap: '40px',
        padding: '0 40px',
        overflowX: 'auto' as const,
        scrollbarWidth: 'none' as const,
        msOverflowStyle: 'none' as const,
        width: '100%',
        height: '100%',
        position: 'relative' as const,
    },
    line: {
        position: 'absolute' as const,
        left: 0,
        right: 0,
        top: '50%',
        transform: 'translateY(-18px)', // Adjust based on circle center
        height: '2px',
        backgroundColor: '#f1f2f6',
        zIndex: 0,
    },
    nodeBtn: {
        position: 'relative' as const,
        background: 'none',
        border: 'none',
        padding: '10px 0',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '8px',
        zIndex: 1,
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        minWidth: '40px',
    },
    circle: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        transition: 'all 0.3s ease',
    },
    label: {
        position: 'absolute' as const,
        top: '48px',
        whiteSpace: 'nowrap' as const,
        fontSize: '0.75rem',
        fontWeight: '600',
        opacity: 0,
        animation: 'fadeIn 0.3s forwards',
    },
    fadeLeft: {
        position: 'absolute' as const,
        left: 0,
        top: 0,
        bottom: 0,
        width: '40px',
        background: 'linear-gradient(to right, white, transparent)',
        pointerEvents: 'none' as const,
        zIndex: 2,
    },
    fadeRight: {
        position: 'absolute' as const,
        right: 0,
        top: 0,
        bottom: 0,
        width: '40px',
        background: 'linear-gradient(to left, white, transparent)',
        pointerEvents: 'none' as const,
        zIndex: 2,
    },
};

// Add global style for animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(styleSheet);

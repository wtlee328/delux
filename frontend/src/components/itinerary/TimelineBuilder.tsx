import React, { useState, useCallback } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';

interface Product {
  id: string;
  title: string;
  destination: string;
  durationDays: number;
  coverImageUrl: string;
  netPrice: number;
  supplierName: string;
  productType: 'activity' | 'accommodation' | 'food' | 'transportation';
  notes?: string;
  timelineId?: string;
  startTime?: string; // Format: "HH:mm"
  duration?: number; // Duration in minutes
}

interface TimelineDay {
  dayNumber: number;
  items: Product[];
  date?: string; // Format: "MM/DD"
  dayOfWeek?: string; // e.g., "Mon", "Tue"
}

interface TimelineBuilderProps {
  timeline: TimelineDay[];
  onEditCard?: (dayNumber: number, itemId: string) => void;
  onDeleteCard?: (dayNumber: number, itemId: string) => void;
  onAddDay?: () => void;
  onUpdateTime?: (dayNumber: number, itemId: string, startTime: string, duration: number) => void;
}

// Pastel color themes for each day (cycling through 9 colors)
const dayColorThemes = [
  { primary: '#FFB6C1', light: '#FFE4E9', dot: '#FF69B4' }, // Pink
  { primary: '#98D8C8', light: '#E8F5F1', dot: '#5FD3B3' }, // Mint Green
  { primary: '#FFD4A3', light: '#FFF4E6', dot: '#FFB347' }, // Peach
  { primary: '#B4A7D6', light: '#E8E4F3', dot: '#9370DB' }, // Lavender
  { primary: '#A8D8EA', light: '#E3F2FD', dot: '#4FC3F7' }, // Sky Blue
  { primary: '#FFE5B4', light: '#FFF8E7', dot: '#FFD54F' }, // Cream
  { primary: '#D4A5A5', light: '#F5E6E6', dot: '#CD5C5C' }, // Rose
  { primary: '#C5E1A5', light: '#F1F8E9', dot: '#9CCC65' }, // Light Green
  { primary: '#FFCCBC', light: '#FFF3E0', dot: '#FF8A65' }, // Coral
];

const getActivityIcon = (type: string) => {
  const icons: Record<string, string> = {
    accommodation: '🏨',
    food: '🍽️',
    activity: '🎯',
    transportation: '🚗',
  };
  return icons[type] || '📍';
};

const TimelineBuilder: React.FC<TimelineBuilderProps> = ({
  timeline,
  onEditCard,
  onDeleteCard,
  onAddDay,
  onUpdateTime,
}) => {
  const [editingTime, setEditingTime] = useState<{ dayNumber: number; itemId: string } | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Calculate which 3 days to show based on scroll position
  const visibleDayStart = Math.floor(scrollPosition / 3);
  const visibleDays = timeline.slice(visibleDayStart, visibleDayStart + 3);

  const handleScrollLeft = useCallback(() => {
    setScrollPosition(Math.max(0, scrollPosition - 1));
  }, [scrollPosition]);

  const handleScrollRight = useCallback(() => {
    setScrollPosition(Math.min(timeline.length - 3, scrollPosition + 1));
  }, [scrollPosition, timeline.length]);

  const handleTimeEdit = useCallback((dayNumber: number, itemId: string) => {
    setEditingTime({ dayNumber, itemId });
  }, []);

  const handleTimeSave = useCallback((dayNumber: number, itemId: string, time: string, duration: number) => {
    onUpdateTime?.(dayNumber, itemId, time, duration);
    setEditingTime(null);
  }, [onUpdateTime]);

  const getColorTheme = (dayNumber: number) => {
    return dayColorThemes[(dayNumber - 1) % dayColorThemes.length];
  };

  const formatDate = (day: TimelineDay) => {
    if (day.date && day.dayOfWeek) {
      return `${day.date} ${day.dayOfWeek}`;
    }
    return '';
  };

  return (
    <div style={styles.container}>
      {timeline.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>從左側拖曳產品到這裡開始規劃行程</p>
          <button style={styles.addFirstDayButton} onClick={onAddDay}>
            + 新增第一天
          </button>
        </div>
      ) : (
        <>
          {/* Navigation Controls */}
          <div style={styles.navigationBar}>
            <button
              style={{
                ...styles.navButton,
                ...(scrollPosition === 0 ? styles.navButtonDisabled : {}),
              }}
              onClick={handleScrollLeft}
              disabled={scrollPosition === 0}
            >
              ← 前一天
            </button>
            <span style={styles.dayIndicator}>
              顯示第 {visibleDayStart + 1} - {Math.min(visibleDayStart + 3, timeline.length)} 天
              （共 {timeline.length} 天）
            </span>
            <button
              style={{
                ...styles.navButton,
                ...(scrollPosition >= timeline.length - 3 ? styles.navButtonDisabled : {}),
              }}
              onClick={handleScrollRight}
              disabled={scrollPosition >= timeline.length - 3}
            >
              下一天 →
            </button>
          </div>

          {/* Timeline Columns */}
          <div style={styles.timelineGrid}>
            {visibleDays.map((day) => {
              const colorTheme = getColorTheme(day.dayNumber);
              
              return (
                <div key={day.dayNumber} style={styles.dayColumn}>
                  {/* Day Header */}
                  <div
                    style={{
                      ...styles.dayHeader,
                      backgroundColor: colorTheme.light,
                      borderLeftColor: colorTheme.primary,
                    }}
                  >
                    <h3
                      style={{
                        ...styles.dayTitle,
                        color: colorTheme.primary,
                      }}
                    >
                      Day {day.dayNumber}
                    </h3>
                    {formatDate(day) && (
                      <p
                        style={{
                          ...styles.dayDate,
                          color: colorTheme.primary,
                        }}
                      >
                        {formatDate(day)}
                      </p>
                    )}
                  </div>

                  {/* Timeline Content */}
                  <Droppable droppableId={`day-${day.dayNumber}`}>
                    {(provided: any, snapshot: any) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          ...styles.timelineContent,
                          ...(snapshot.isDraggingOver ? {
                            backgroundColor: colorTheme.light,
                          } : {}),
                        }}
                      >
                        {/* Vertical Timeline Line */}
                        <div
                          style={{
                            ...styles.timelineLine,
                            backgroundColor: colorTheme.primary,
                          }}
                        />

                        {day.items.length === 0 ? (
                          <div style={styles.emptyDayPlaceholder}>
                            <p style={styles.placeholderText}>拖曳活動到這裡</p>
                          </div>
                        ) : (
                          day.items.map((item, index) => {
                            const uniqueKey = item.timelineId || `${item.id}-${index}`;
                            const draggableId = `timeline-${uniqueKey}`;
                            const isEditing = editingTime?.dayNumber === day.dayNumber && 
                                            editingTime?.itemId === uniqueKey;

                            return (
                              <Draggable key={uniqueKey} draggableId={draggableId} index={index}>
                                {(provided: any, snapshot: any) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      ...styles.activityItem,
                                      ...provided.draggableProps.style,
                                      ...(snapshot.isDragging ? styles.activityDragging : {}),
                                    }}
                                  >
                                    {/* Timeline Dot */}
                                    <div
                                      style={{
                                        ...styles.timelineDot,
                                        backgroundColor: colorTheme.dot,
                                      }}
                                    />

                                    {/* Activity Card */}
                                    <div style={styles.activityCard}>
                                      {/* Icon */}
                                      <div
                                        style={{
                                          ...styles.activityIcon,
                                          backgroundColor: colorTheme.light,
                                        }}
                                      >
                                        <span style={styles.iconEmoji}>
                                          {getActivityIcon(item.productType)}
                                        </span>
                                      </div>

                                      {/* Content */}
                                      <div style={styles.activityContent}>
                                        <h4 style={styles.activityTitle}>{item.title}</h4>
                                        
                                        {/* Time Display/Edit */}
                                        {isEditing ? (
                                          <div style={styles.timeEditContainer}>
                                            <input
                                              type="time"
                                              defaultValue={item.startTime || '09:00'}
                                              style={styles.timeInput}
                                              onBlur={(e) => {
                                                handleTimeSave(
                                                  day.dayNumber,
                                                  uniqueKey,
                                                  e.target.value,
                                                  item.duration || 60
                                                );
                                              }}
                                              autoFocus
                                            />
                                            <input
                                              type="number"
                                              defaultValue={item.duration || 60}
                                              min="15"
                                              step="15"
                                              style={styles.durationInput}
                                              placeholder="分鐘"
                                              onBlur={(e) => {
                                                handleTimeSave(
                                                  day.dayNumber,
                                                  uniqueKey,
                                                  item.startTime || '09:00',
                                                  parseInt(e.target.value) || 60
                                                );
                                              }}
                                            />
                                          </div>
                                        ) : (
                                          <p
                                            style={styles.activityTime}
                                            onClick={() => handleTimeEdit(day.dayNumber, uniqueKey)}
                                          >
                                            {item.startTime || '點擊設定時間'}
                                            {item.duration && ` (${item.duration}分鐘)`}
                                          </p>
                                        )}

                                        {/* Action Buttons */}
                                        <div style={styles.activityActions}>
                                          <button
                                            style={styles.actionBtn}
                                            onClick={() => onEditCard?.(day.dayNumber, uniqueKey)}
                                            title="編輯備註"
                                          >
                                            ✏️
                                          </button>
                                          <button
                                            style={styles.actionBtn}
                                            onClick={() => onDeleteCard?.(day.dayNumber, uniqueKey)}
                                            title="刪除"
                                          >
                                            🗑️
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>

          {/* Add Day Button */}
          <div style={styles.addDayContainer}>
            <button style={styles.addDayButton} onClick={onAddDay}>
              + 新增一天
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#fafafa',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '3rem',
  },
  emptyText: {
    color: '#999',
    fontSize: '1rem',
    marginBottom: '1.5rem',
  },
  addFirstDayButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  navigationBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
  },
  navButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s',
  },
  navButtonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  dayIndicator: {
    fontSize: '0.9rem',
    color: '#666',
    fontWeight: '500',
  },
  timelineGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.5rem',
    padding: '1.5rem',
    flex: 1,
    overflow: 'auto',
  },
  dayColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    minHeight: '500px',
  },
  dayHeader: {
    padding: '1.25rem',
    borderLeft: '4px solid',
    textAlign: 'center' as const,
  },
  dayTitle: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '0.25rem',
  },
  dayDate: {
    margin: 0,
    fontSize: '0.9rem',
    fontWeight: '500',
    opacity: 0.8,
  },
  timelineContent: {
    flex: 1,
    padding: '1.5rem 1rem',
    position: 'relative' as const,
    transition: 'background-color 0.2s',
  },
  timelineLine: {
    position: 'absolute' as const,
    left: '2.5rem',
    top: '1.5rem',
    bottom: '1.5rem',
    width: '2px',
    opacity: 0.3,
  },
  emptyDayPlaceholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '200px',
  },
  placeholderText: {
    color: '#bbb',
    fontSize: '0.9rem',
  },
  activityItem: {
    position: 'relative' as const,
    marginBottom: '1.5rem',
    paddingLeft: '3rem',
    transition: 'all 0.2s',
  },
  activityDragging: {
    opacity: 0.8,
    transform: 'scale(1.02)',
  },
  timelineDot: {
    position: 'absolute' as const,
    left: '1.75rem',
    top: '1rem',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '3px solid white',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    zIndex: 2,
  },
  activityCard: {
    display: 'flex',
    gap: '0.75rem',
    padding: '0.75rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #f0f0f0',
    transition: 'all 0.2s',
    cursor: 'grab',
  },
  activityIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: {
    fontSize: '1.25rem',
  },
  activityContent: {
    flex: 1,
    minWidth: 0,
  },
  activityTitle: {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#333',
    marginBottom: '0.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  activityTime: {
    margin: 0,
    fontSize: '0.8rem',
    color: '#999',
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  timeEditContainer: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.25rem',
  },
  timeInput: {
    padding: '0.25rem 0.5rem',
    fontSize: '0.8rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    width: '80px',
  },
  durationInput: {
    padding: '0.25rem 0.5rem',
    fontSize: '0.8rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    width: '60px',
  },
  activityActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '0.25rem',
    opacity: 0.6,
    transition: 'opacity 0.2s',
  },
  addDayContainer: {
    padding: '1rem',
    borderTop: '1px solid #e0e0e0',
    backgroundColor: 'white',
  },
  addDayButton: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#f8f9fa',
    border: '2px dashed #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: '#666',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
};

export default React.memo(TimelineBuilder);

import React, { useState, useCallback, useRef, useLayoutEffect } from 'react';
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

const dayColorThemes = [
  { primary: '#FFB6C1', light: '#FFF0F2', dot: '#FF69B4' }, // Pink
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
  const timelineGridRef = useRef<HTMLDivElement>(null);

  const handleTimeEdit = useCallback((dayNumber: number, itemId:string) => {
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

  useLayoutEffect(() => {
    if (timelineGridRef.current) {
      const grid = timelineGridRef.current;
      const lastDay = grid.children[grid.children.length - 1];
      if (lastDay) {
        lastDay.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
      }
    }
  }, [timeline.length]);

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
        <div style={styles.timelineWrapper}>
          <div style={styles.timelineGrid} ref={timelineGridRef}>
            {timeline.map((day) => {
              const colorTheme = getColorTheme(day.dayNumber);
              
              return (
                <div key={day.dayNumber} style={styles.dayColumn}>
                  <div
                    style={{
                      ...styles.dayHeader,
                      backgroundColor: colorTheme.light,
                      borderTopColor: colorTheme.primary,
                    }}
                  >
                    <h3 style={{ ...styles.dayTitle, color: colorTheme.primary }}>
                      Day {day.dayNumber}
                    </h3>
                    {formatDate(day) && (
                      <p style={{ ...styles.dayDate, color: colorTheme.primary }}>
                        {formatDate(day)}
                      </p>
                    )}
                  </div>

                  <Droppable droppableId={`day-${day.dayNumber}`}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          ...styles.timelineContent,
                          backgroundColor: snapshot.isDraggingOver ? colorTheme.light : 'transparent',
                        }}
                      >
                        <div style={{ ...styles.timelineLine, backgroundColor: colorTheme.primary }} />

                        {day.items.length === 0 ? (
                          <div style={styles.emptyDayPlaceholder}>
                            <p style={styles.placeholderText}>拖曳活動到這裡</p>
                          </div>
                        ) : (
                          day.items.map((item, index) => {
                            if (!item.timelineId) {
                              console.error("Timeline item is missing a timelineId and will not be rendered.", item);
                              return null;
                            }
                            
                            const draggableId = `timeline-item-${item.timelineId}`;
                            const isEditing = editingTime?.dayNumber === day.dayNumber && 
                                            editingTime?.itemId === item.timelineId;

                            return (
                              <Draggable key={draggableId} draggableId={draggableId} index={index}>
                                {(provided, snapshot) => (
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
                                    <div style={{ ...styles.timelineDot, backgroundColor: colorTheme.dot }} />
                                    <div style={styles.activityCard}>
                                      <div style={{ ...styles.activityIcon, backgroundColor: colorTheme.light }}>
                                        <span style={styles.iconEmoji}>
                                          {getActivityIcon(item.productType)}
                                        </span>
                                      </div>
                                      <div style={styles.activityContent}>
                                        <h4 style={styles.activityTitle}>{item.title}</h4>
                                        
                                        {isEditing ? (
                                          <div style={styles.timeEditContainer}>
                                            <input
                                              type="time"
                                              defaultValue={item.startTime || '09:00'}
                                              style={styles.timeInput}
                                              onBlur={(e) => handleTimeSave(day.dayNumber, item.timelineId!, e.target.value, item.duration || 60)}
                                              autoFocus
                                            />
                                            <input
                                              type="number"
                                              defaultValue={item.duration || 60}
                                              min="15"
                                              step="15"
                                              style={styles.durationInput}
                                              placeholder="分鐘"
                                              onBlur={(e) => handleTimeSave(day.dayNumber, item.timelineId!, item.startTime || '09:00', parseInt(e.target.value) || 60)}
                                            />
                                          </div>
                                        ) : (
                                          <p style={styles.activityTime} onClick={() => handleTimeEdit(day.dayNumber, item.timelineId!)}>
                                            {item.startTime || '點擊設定時間'}
                                            {item.duration && ` (${item.duration}分鐘)`}
                                          </p>
                                        )}
                                      </div>
                                      <div style={styles.activityActions}>
                                        <button style={styles.actionBtn} onClick={() => onEditCard?.(day.dayNumber, item.timelineId!)} title="編輯備註">✏️</button>
                                        <button style={styles.actionBtn} onClick={() => onDeleteCard?.(day.dayNumber, item.timelineId!)} title="刪除">🗑️</button>
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
            <div style={styles.addDayContainer}>
              <button style={styles.addDayButton} onClick={onAddDay}>
                + 新增一天
              </button>
            </div>
          </div>
        </div>
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
  emptyText: { color: '#999', fontSize: '1rem', marginBottom: '1.5rem' },
  addFirstDayButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '500',
  },
  timelineWrapper: {
    flex: 1,
    overflowX: 'auto' as const,
    overflowY: 'hidden' as const,
    padding: '1rem',
  },
  timelineGrid: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '1.5rem',
    minHeight: '100%',
  },
  dayColumn: {
    width: '350px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
  },
  dayHeader: {
    padding: '1rem',
    borderTop: '4px solid',
    textAlign: 'center' as const,
  },
  dayTitle: { margin: 0, fontSize: '1.25rem', fontWeight: '600' },
  dayDate: { margin: 0, fontSize: '0.9rem', fontWeight: '500', opacity: 0.8 },
  timelineContent: {
    flex: 1,
    padding: '1.5rem 1rem',
    position: 'relative' as const,
    transition: 'background-color 0.2s',
    overflowY: 'auto' as const,
  },
timelineLine: {
    position: 'absolute' as const,
    left: '2.25rem',
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
    minHeight: '150px',
  },
  placeholderText: { color: '#bbb', fontSize: '0.9rem' },
  activityItem: {
    position: 'relative' as const,
    marginBottom: '1.5rem',
    paddingLeft: '3.5rem',
  },
  activityDragging: { opacity: 0.9, transform: 'scale(1.02)' },
  timelineDot: {
    position: 'absolute' as const,
    left: '1.75rem',
    top: '0.5rem',
    width: '16px',
    height: '16px',
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
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    cursor: 'grab',
    position: 'relative' as const,
  },
  activityIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: { fontSize: '1.1rem' },
  activityContent: { flex: 1, minWidth: 0 },
  activityTitle: {
    margin: 0,
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#333',
    marginBottom: '0.25rem',
  },
  activityTime: {
    margin: 0,
    fontSize: '0.8rem',
    color: '#999',
    cursor: 'pointer',
  },
  timeEditContainer: { display: 'flex', gap: '0.5rem', marginTop: '0.25rem' },
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
    position: 'absolute' as const,
    top: '0.5rem',
    right: '0.5rem',
    display: 'flex',
    gap: '0.25rem',
    backgroundColor: 'white',
    borderRadius: '4px',
    padding: '0.1rem',
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
    padding: '0.25rem',
    opacity: 0.6,
  },
  addDayContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 1rem',
  },
  addDayButton: {
    width: '100px',
    height: '100px',
    padding: '0.75rem',
    backgroundColor: '#f8f9fa',
    border: '2px dashed #ddd',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: '#666',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default TimelineBuilder;

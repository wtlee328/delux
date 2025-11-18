import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';

interface Product {
  id: string;
  title: string;
  destination: string;
  durationDays: number;
  coverImageUrl: string;
  netPrice: number;
  supplierName: string;
  productType: 'activity' | 'accommodation';
  notes?: string;
  timelineId?: string;
}

interface TimelineDay {
  dayNumber: number;
  items: Product[];
}

interface TimelineBuilderProps {
  timeline: TimelineDay[];
  onEditCard?: (dayNumber: number, itemId: string) => void;
  onDeleteCard?: (dayNumber: number, itemId: string) => void;
  onAddDay?: () => void;
}

const TimelineBuilder: React.FC<TimelineBuilderProps> = ({
  timeline,
  onEditCard,
  onDeleteCard,
  onAddDay,
}) => {
  const formatPrice = (price: number) => {
    return `NT$${price.toLocaleString('zh-TW')}`;
  };

  return (
    <div style={styles.container}>
      {timeline.length === 0 && (
        <div style={styles.emptyState}>
          <p>從左側拖曳產品到這裡開始規劃行程</p>
        </div>
      )}
      {timeline.map((day) => (
        <div key={day.dayNumber} style={styles.daySection}>
          <div style={styles.dayHeader}>
            <h3 style={styles.dayTitle}>Day {day.dayNumber}</h3>
          </div>
          <Droppable droppableId={`day-${day.dayNumber}`}>
            {(provided: any, snapshot: any) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  ...styles.dropZone,
                  ...(snapshot.isDraggingOver ? styles.dropZoneActive : {}),
                }}
              >
                {day.items.length === 0 && (
                  <p style={styles.dropZonePlaceholder}>拖曳產品到這裡</p>
                )}
                {day.items.map((item, index) => {
                  const uniqueKey = item.timelineId || `${item.id}-${index}`;
                  const draggableId = `timeline-${uniqueKey}`;
                  
                  return (
                    <Draggable key={uniqueKey} draggableId={draggableId} index={index}>
                      {(provided: any, snapshot: any) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...styles.card,
                            ...(item.productType === 'accommodation' ? styles.accommodationCard : styles.activityCard),
                            ...provided.draggableProps.style,
                            ...(snapshot.isDragging ? styles.cardDragging : {}),
                          }}
                        >
                          <div style={styles.cardHeader}>
                            <span style={styles.cardIcon}>
                              {item.productType === 'accommodation' ? '🏨' : '🎯'}
                            </span>
                            <span style={styles.cardType}>
                              {item.productType === 'accommodation' ? '住宿' : '活動'}
                            </span>
                            <div style={styles.cardActions}>
                              <button
                                style={styles.actionButton}
                                onClick={() => onEditCard?.(day.dayNumber, uniqueKey)}
                                title="編輯"
                              >
                                ✏️
                              </button>
                              <button
                                style={styles.actionButton}
                                onClick={() => onDeleteCard?.(day.dayNumber, uniqueKey)}
                                title="刪除"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          <h4 style={styles.cardTitle}>{item.title}</h4>
                          <p style={styles.cardDetail}>供應商：{item.supplierName}</p>
                          <p style={styles.cardPrice}>{formatPrice(item.netPrice)}</p>
                          {item.notes && (
                            <div style={styles.notesSection}>
                              <p style={styles.notesLabel}>備註：</p>
                              <p style={styles.notesText}>{item.notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      ))}
      <button style={styles.addDayButton} onClick={onAddDay}>
        + 新增一天
      </button>
    </div>
  );
};

const styles = {
  container: {
    height: '100%',
    overflow: 'auto',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '3rem 1rem',
    color: '#999',
  },
  daySection: {
    marginBottom: '1.5rem',
  },
  dayHeader: {
    backgroundColor: '#f0f0f0',
    padding: '0.75rem 1rem',
    borderRadius: '6px 6px 0 0',
    borderLeft: '4px solid #007bff',
  },
  dayTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#333',
  },
  dropZone: {
    minHeight: '100px',
    padding: '0.75rem',
    backgroundColor: '#fafafa',
    border: '2px dashed #ddd',
    borderRadius: '0 0 6px 6px',
    transition: 'all 0.2s',
  },
  dropZoneActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007bff',
  },
  dropZonePlaceholder: {
    textAlign: 'center' as const,
    color: '#999',
    fontSize: '0.9rem',
    padding: '2rem 0',
  },
  card: {
    padding: '0.75rem',
    marginBottom: '0.75rem',
    borderRadius: '6px',
    border: '1px solid',
    cursor: 'grab',
    transition: 'all 0.2s',
  },
  activityCard: {
    backgroundColor: '#fff',
    borderColor: '#007bff',
  },
  accommodationCard: {
    backgroundColor: '#fff8e1',
    borderColor: '#ff9800',
  },
  cardDragging: {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  cardIcon: {
    fontSize: '1.2rem',
    marginRight: '0.5rem',
  },
  cardType: {
    fontSize: '0.8rem',
    color: '#666',
    flex: 1,
  },
  cardActions: {
    display: 'flex',
    gap: '0.25rem',
  },
  actionButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '0.25rem',
    opacity: 0.7,
    transition: 'opacity 0.2s',
  },
  cardTitle: {
    fontSize: '0.95rem',
    fontWeight: 'bold',
    margin: '0 0 0.5rem 0',
    color: '#333',
  },
  cardDetail: {
    fontSize: '0.8rem',
    color: '#666',
    margin: '0.25rem 0',
  },
  cardPrice: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#28a745',
    marginTop: '0.5rem',
  },
  notesSection: {
    marginTop: '0.75rem',
    padding: '0.5rem',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: '4px',
  },
  notesLabel: {
    fontSize: '0.75rem',
    fontWeight: 'bold',
    margin: '0 0 0.25rem 0',
    color: '#666',
  },
  notesText: {
    fontSize: '0.8rem',
    margin: 0,
    color: '#333',
  },
  addDayButton: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#f0f0f0',
    border: '2px dashed #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: '#666',
    transition: 'all 0.2s',
  },
};

export default React.memo(TimelineBuilder);

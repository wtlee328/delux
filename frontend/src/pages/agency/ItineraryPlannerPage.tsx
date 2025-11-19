import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { useToast } from '../../components/Toast';
import ResourceLibrary from '../../components/itinerary/ResourceLibrary';
import { TimelineContainer } from '../../components/itinerary/TimelineContainer';
import SaveItineraryModal from '../../components/itinerary/SaveItineraryModal';
import MapView from '../../components/itinerary/MapView';
import axios from '../../config/axios';
import './ItineraryPlanner.css';

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
  location?: {
    lat: number;
    lng: number;
  };
  timelineId?: string; // Unique ID for timeline items
  startTime?: string; // Format: "HH:mm"
  duration?: number; // Duration in minutes
}

interface TimelineDay {
  dayNumber: number;
  items: Product[];
  date?: string; // Format: "MM/DD"
  dayOfWeek?: string; // e.g., "Mon", "Tue"
}

const ItineraryPlannerPage: React.FC = () => {
  const { showSuccess } = useToast();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState({
    library: true,
    timeline: true,
    map: true,
  });
  const [timeline, setTimeline] = useState<TimelineDay[]>([
    { dayNumber: 1, items: [] },
  ]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [hoveredProduct, setHoveredProduct] = useState<Product | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>('');

  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const togglePanel = (panel: 'library' | 'timeline' | 'map') => {
    setIsMobileMenuOpen(prev => ({
      ...prev,
      [panel]: !prev[panel],
    }));
  };

  // Helper to add minutes to a time string "HH:mm"
  const addMinutes = (time: string, minutes: number): string => {
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    date.setMinutes(date.getMinutes() + minutes);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // Helper to recalculate times for a list of products
  const recalculateTimes = (items: Product[]): Product[] => {
    let currentTime = '09:00';
    return items.map(item => {
      const startTime = currentTime;
      const duration = item.duration || 60;
      currentTime = addMinutes(startTime, duration);
      return { ...item, startTime, duration };
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    // Check if it's a resource or a timeline item
    if (active.data.current?.type === 'resource') {
      setActiveProduct(active.data.current.product);
    } else {
      // Find the item in the timeline
      for (const day of timeline) {
        const item = day.items.find(i => i.timelineId === active.id);
        if (item) {
          setActiveProduct(item);
          break;
        }
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    // If dragging a resource over a day column
    if (active.data.current?.type === 'resource' && over.data.current?.type === 'day') {
      // We don't need to do anything here for visual feedback as the drop zone handles it
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProduct(null);

    if (!over) return;

    // 1. Dragging from Resource Library to Timeline
    if (active.data.current?.type === 'resource' && over.data.current?.type === 'day') {
      const product = active.data.current.product;
      const dayNumber = over.data.current.dayNumber;

      const uniqueId = `${product.id}-${Date.now()}-${Math.random()}`;
      const productCopy = { ...product, timelineId: uniqueId, duration: product.duration || 60 };

      setTimeline(prev => prev.map(day => {
        if (day.dayNumber === dayNumber) {
          const newItems = [...day.items, productCopy];
          return { ...day, items: recalculateTimes(newItems) };
        }
        return day;
      }));
      showSuccess(`Added ${product.title} to Day ${dayNumber}`);
      return;
    }

    // 2. Reordering within Timeline or Moving between days
    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId !== overId) {
      // Find source day and item index
      let sourceDayIndex = -1;
      let sourceItemIndex = -1;
      let destDayIndex = -1;
      let destItemIndex = -1;

      timeline.forEach((day, dIndex) => {
        const itemIndex = day.items.findIndex(i => i.timelineId === activeId);
        if (itemIndex !== -1) {
          sourceDayIndex = dIndex;
          sourceItemIndex = itemIndex;
        }

        // Check if over is a day (dropping on empty space) or an item (reordering)
        if (over.data.current?.type === 'day' && over.data.current.dayNumber === day.dayNumber) {
          destDayIndex = dIndex;
          destItemIndex = day.items.length; // Append to end
        } else {
          const overItemIndex = day.items.findIndex(i => i.timelineId === overId);
          if (overItemIndex !== -1) {
            destDayIndex = dIndex;
            destItemIndex = overItemIndex;
          }
        }
      });

      if (sourceDayIndex !== -1 && destDayIndex !== -1) {
        setTimeline(prev => {
          const newTimeline = [...prev];
          const sourceDay = newTimeline[sourceDayIndex];
          const destDay = newTimeline[destDayIndex];

          // Move within same day
          if (sourceDayIndex === destDayIndex) {
            const newItems = arrayMove(sourceDay.items, sourceItemIndex, destItemIndex);
            newTimeline[sourceDayIndex] = { ...sourceDay, items: recalculateTimes(newItems) };
          } else {
            // Move to different day
            const [movedItem] = sourceDay.items.splice(sourceItemIndex, 1);
            destDay.items.splice(destItemIndex, 0, movedItem);

            newTimeline[sourceDayIndex] = { ...sourceDay, items: recalculateTimes(sourceDay.items) };
            newTimeline[destDayIndex] = { ...destDay, items: recalculateTimes(destDay.items) };
          }
          return newTimeline;
        });
      }
    }
  };

  const handleDeleteCard = useCallback((dayNumber: number, uniqueId: string) => {
    setTimeline(prevTimeline => {
      return prevTimeline.map(day => {
        if (day.dayNumber === dayNumber) {
          const newItems = day.items.filter(item => (item.timelineId || item.id) !== uniqueId);
          return {
            ...day,
            items: recalculateTimes(newItems),
          };
        }
        return day;
      });
    });
  }, []);

  const handleAddDay = useCallback(() => {
    setTimeline(prevTimeline => {
      const newDayNumber = prevTimeline.length + 1;
      return [...prevTimeline, { dayNumber: newDayNumber, items: [] }];
    });
  }, []);

  const handleUpdateTime = useCallback((dayNumber: number, uniqueId: string, startTime: string, duration: number) => {
    setTimeline(prevTimeline => {
      return prevTimeline.map(day => {
        if (day.dayNumber === dayNumber) {
          const updatedItems = day.items.map(item =>
            (item.timelineId || item.id) === uniqueId
              ? { ...item, startTime, duration }
              : item
          );

          // Recalculate times starting from the updated item
          const index = updatedItems.findIndex(item => (item.timelineId || item.id) === uniqueId);
          if (index === -1) return { ...day, items: updatedItems };

          let currentTime = addMinutes(startTime, duration);

          const finalItems = updatedItems.map((item, i) => {
            if (i <= index) return item;
            const start = currentTime;
            currentTime = addMinutes(start, item.duration || 60);
            return { ...item, startTime: start };
          });

          return { ...day, items: finalItems };
        }
        return day;
      });
    });
  }, []);

  const handleSaveItinerary = async (name: string) => {
    try {
      setSaveStatus('儲存中...');
      await axios.post('/api/itinerary', {
        name,
        timeline: timeline.map(day => ({
          dayNumber: day.dayNumber,
          items: day.items.map(item => ({
            id: item.id,
            title: item.title,
            notes: item.notes,
          })),
        })),
      });
      setSaveStatus('儲存成功！');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Failed to save itinerary:', error);
      setSaveStatus('儲存失敗');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button onClick={() => navigate('/')} style={styles.backButton}>←</button>
            <h1 style={styles.title}>Itinerary Planner</h1>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.status}>{saveStatus}</span>
            <button
              onClick={() => setIsSaveModalOpen(true)}
              style={styles.saveButton}
            >
              Save Itinerary
            </button>
          </div>
        </header>

        <div style={styles.content}>
          {/* Resource Library Panel */}
          <div style={{
            ...styles.panel,
            width: isMobileMenuOpen.library ? '300px' : '0',
            opacity: isMobileMenuOpen.library ? 1 : 0,
          }}>
            <div style={styles.panelHeader}>
              <h3>Resources</h3>
              <button onClick={() => togglePanel('library')}>×</button>
            </div>
            <ResourceLibrary
              onProductHover={setHoveredProduct}
              setAvailableProducts={setAvailableProducts}
            />
          </div>

          {/* Timeline Panel */}
          <div style={{
            ...styles.mainPanel,
            flex: 1,
          }}>
            <TimelineContainer
              timeline={timeline}
              onAddDay={handleAddDay}
              onDelete={handleDeleteCard}
              onTimeUpdate={handleUpdateTime}
            />
          </div>

          {/* Map Panel */}
          <div style={{
            ...styles.panel,
            width: isMobileMenuOpen.map ? '350px' : '0',
            opacity: isMobileMenuOpen.map ? 1 : 0,
          }}>
            <div style={styles.panelHeader}>
              <h3>Map View</h3>
              <button onClick={() => togglePanel('map')}>×</button>
            </div>
            <MapView
              products={availableProducts}
              highlightedProductId={hoveredProduct?.id}
            />
          </div>
        </div>

        <SaveItineraryModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSave={handleSaveItinerary}
        />

        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
          {activeProduct ? (
            <div style={{
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
              width: '280px',
              border: '1px solid #f1f2f6',
            }}>
              <h4 style={{ margin: 0 }}>{activeProduct.title}</h4>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#f8f9fa',
  },
  header: {
    height: '64px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 2rem',
    zIndex: 10,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  backButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#2d3436',
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#2d3436',
  },
  saveButton: {
    backgroundColor: '#0984e3',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1.5rem',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  status: {
    color: '#00b894',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  panel: {
    backgroundColor: 'white',
    borderRight: '1px solid #e0e0e0',
    borderLeft: '1px solid #e0e0e0',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  mainPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  panelHeader: {
    padding: '1rem',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: '600',
    color: '#2d3436',
  },
};

export default ItineraryPlannerPage;

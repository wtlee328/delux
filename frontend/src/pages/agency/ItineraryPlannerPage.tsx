import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, DropResult, Droppable } from 'react-beautiful-dnd';
import { useAuth } from '../../contexts/AuthContext';
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
  const { user, logout } = useAuth();
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

  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }

    // Handle drag from library to timeline
    if (source.droppableId === 'resource-library' && destination.droppableId.startsWith('day-')) {
      const destDayNum = parseInt(destination.droppableId.replace('day-', ''));

      // Find the product being dragged
      const product = availableProducts.find(p => p.id === draggableId);
      if (!product) return;

      // Create a copy with a unique ID for the timeline
      const uniqueId = `${product.id}-${Date.now()}-${Math.random()}`;
      const productCopy = { ...product, timelineId: uniqueId, duration: product.duration || 60 };

      // Use functional update to avoid stale closure
      setTimeline(prevTimeline => {
        return prevTimeline.map(day => {
          if (day.dayNumber === destDayNum) {
            const newItems = [...day.items];
            newItems.splice(destination.index, 0, productCopy);
            return { ...day, items: recalculateTimes(newItems) };
          }
          return day;
        });
      });
      showSuccess(`已將 ${product.title} 加入 Day ${destDayNum}`);
      return;
    }

    // Handle reordering within timeline or moving between days
    if (source.droppableId.startsWith('day-') && destination.droppableId.startsWith('day-')) {
      const sourceDayNum = parseInt(source.droppableId.replace('day-', ''));
      const destDayNum = parseInt(destination.droppableId.replace('day-', ''));

      setTimeline(prevTimeline => {
        const sourceDay = prevTimeline.find(d => d.dayNumber === sourceDayNum);
        if (!sourceDay) return prevTimeline;

        // Item is moved within the same day
        if (sourceDayNum === destDayNum) {
          if (source.index === destination.index) return prevTimeline;
          const newItems = [...sourceDay.items];
          const [movedItem] = newItems.splice(source.index, 1);
          newItems.splice(destination.index, 0, movedItem);

          return prevTimeline.map(d =>
            d.dayNumber === sourceDayNum ? { ...d, items: recalculateTimes(newItems) } : d
          );
        }

        // Item is moved to a different day
        const destDay = prevTimeline.find(d => d.dayNumber === destDayNum);
        if (!destDay) return prevTimeline;

        const sourceItems = [...sourceDay.items];
        const [movedItem] = sourceItems.splice(source.index, 1);

        const destItems = [...destDay.items];
        destItems.splice(destination.index, 0, movedItem);

        return prevTimeline.map(d => {
          if (d.dayNumber === sourceDayNum) {
            return { ...d, items: recalculateTimes(sourceItems) };
          }
          if (d.dayNumber === destDayNum) {
            return { ...d, items: recalculateTimes(destItems) };
          }
          return d;
        });
      });
    }
  }, [availableProducts, timeline]);


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
          // First update the specific item
          const updatedItems = day.items.map(item =>
            (item.timelineId || item.id) === uniqueId
              ? { ...item, startTime, duration }
              : item
          );
          // Then recalculate all times to ensure consistency
          // Note: If we want to allow manual override that breaks sequence, we should skip recalculateTimes here.
          // But requirement says "recalculates ordering and time sequence".
          // Let's assume changing duration shifts subsequent items, but changing start time might be a manual override?
          // For simplicity and consistency with "timeline" concept, let's enforce sequence.
          // Actually, if user manually sets start time, maybe they want to shift everything from there?
          // Let's stick to the simple logic: sequence is determined by order.
          // So if I change duration, everything shifts. If I change start time... it might be overwritten by recalculateTimes if we enforce 09:00 start.
          // Let's make recalculateTimes smarter: if it's the first item, use its time.

          // Improved logic inside recalculateTimes for this case?
          // For now, let's just update the item and NOT force recalculate everything to 09:00, 
          // BUT we should probably shift subsequent items.

          // Let's try a hybrid: Find the index of the updated item. Recalculate subsequent items.
          const index = updatedItems.findIndex(item => (item.timelineId || item.id) === uniqueId);
          if (index === -1) return { ...day, items: updatedItems };

          let currentTime = addMinutes(startTime, duration);

          const finalItems = updatedItems.map((item, i) => {
            if (i <= index) return item; // Keep previous items and the updated item as is
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
    <DragDropContext onDragEnd={handleDragEnd}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button
              onClick={() => navigate('/agency/dashboard')}
              style={styles.backButton}
              title="返回產品列表"
            >
              ← 返回
            </button>
            <h1 style={styles.headerTitle}>行程規劃</h1>
          </div>
          <div style={styles.headerActions}>
            {saveStatus && <span style={styles.saveStatus}>{saveStatus}</span>}
            <button
              onClick={() => setIsSaveModalOpen(true)}
              style={styles.saveButton}
              disabled={timeline.every(day => day.items.length === 0)}
            >
              💾 儲存行程
            </button>
            <div style={styles.userInfo}>
              <span>{user?.name}</span>
              <button onClick={logout} style={styles.logoutButton}>
                登出
              </button>
            </div>
          </div>
        </header>

        <div style={styles.mainLayout} className="mainLayout">
          {/* Left Column: Resource Library (30%) */}
          <div style={styles.leftColumn} className="leftColumn">
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>景點與住宿選擇</h2>
              <button
                style={styles.toggleButton}
                onClick={() => togglePanel('library')}
                className="mobile-only"
              >
                {isMobileMenuOpen.library ? '▼' : '▶'}
              </button>
            </div>
            {isMobileMenuOpen.library && (
              <div style={styles.panelContent}>
                <Droppable droppableId="resource-library" isDropDisabled={true}>
                  {(provided: any) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      <ResourceLibrary
                        onProductHover={setHoveredProduct}
                        onProductsLoaded={setAvailableProducts}
                      />
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )}
          </div>

          {/* Middle Column: Timeline Builder (50%) */}
          <div style={styles.middleColumn} className="middleColumn">
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>時間軸視覺化介面</h2>
              <button
                style={styles.toggleButton}
                onClick={() => togglePanel('timeline')}
                className="mobile-only"
              >
                {isMobileMenuOpen.timeline ? '▼' : '▶'}
              </button>
            </div>
            {isMobileMenuOpen.timeline && (
              <div style={{ ...styles.panelContent, padding: 0 }}>
                <div style={{ ...styles.panelContent, padding: 0 }}>
                  <TimelineContainer
                    timeline={timeline}
                    onTimeUpdate={handleUpdateTime}
                    onDelete={handleDeleteCard}
                    onAddDay={handleAddDay}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Map (25%) */}
          <div style={styles.rightColumn} className="rightColumn">
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>地圖</h2>
              <button
                style={styles.toggleButton}
                onClick={() => togglePanel('map')}
                className="mobile-only"
              >
                {isMobileMenuOpen.map ? '▼' : '▶'}
              </button>
            </div>
            {isMobileMenuOpen.map && (
              <div style={styles.panelContent}>
                <MapView
                  products={[]}
                  highlightedProductId={hoveredProduct?.id}
                  timelineProducts={timeline.map(day => ({
                    dayNumber: day.dayNumber,
                    products: day.items,
                  }))}
                />
              </div>
            )}
          </div>
        </div>



        <SaveItineraryModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSave={handleSaveItinerary}
        />
      </div>
    </DragDropContext>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    backgroundColor: 'white',
    padding: '1rem 2rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  backButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'background-color 0.2s',
  },
  headerTitle: {
    margin: 0,
    fontSize: '1.5rem',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  saveStatus: {
    fontSize: '0.9rem',
    color: '#28a745',
    fontWeight: 'bold',
  },
  saveButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  mainLayout: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    gap: '1rem',
    padding: '1rem',
  },
  leftColumn: {
    width: '25%',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  middleColumn: {
    width: '50%',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  rightColumn: {
    width: '25%',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  panelHeader: {
    padding: '1rem',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  panelTitle: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    margin: 0,
  },
  toggleButton: {
    display: 'none',
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0.25rem',
  },
  panelContent: {
    flex: 1,
    overflow: 'auto',
    padding: '1rem',
  },
  placeholder: {
    color: '#999',
    textAlign: 'center' as const,
    padding: '2rem',
  },
};

export default ItineraryPlannerPage;

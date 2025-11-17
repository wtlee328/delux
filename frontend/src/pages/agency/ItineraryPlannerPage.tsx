import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { useAuth } from '../../contexts/AuthContext';
import ResourceLibrary from '../../components/itinerary/ResourceLibrary';
import TimelineBuilder from '../../components/itinerary/TimelineBuilder';
import EditCardModal from '../../components/itinerary/EditCardModal';
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
  productType: 'activity' | 'accommodation';
  notes?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

interface TimelineDay {
  dayNumber: number;
  items: Product[];
}

const ItineraryPlannerPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState({
    library: true,
    timeline: true,
    map: true,
  });
  const [timeline, setTimeline] = useState<TimelineDay[]>([
    { dayNumber: 1, items: [] },
  ]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [hoveredProduct, setHoveredProduct] = useState<Product | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>('');

  const togglePanel = (panel: 'library' | 'timeline' | 'map') => {
    setIsMobileMenuOpen(prev => ({
      ...prev,
      [panel]: !prev[panel],
    }));
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    // Handle drag from library to timeline
    if (source.droppableId === 'resource-library' && destination.droppableId.startsWith('day-')) {
      // This would require access to the product being dragged
      // For now, we'll handle this in a simplified way
      return;
    }

    // Handle reordering within timeline or moving between days
    if (source.droppableId.startsWith('day-') && destination.droppableId.startsWith('day-')) {
      const sourceDayNum = parseInt(source.droppableId.replace('day-', ''));
      const destDayNum = parseInt(destination.droppableId.replace('day-', ''));

      const newTimeline = [...timeline];
      const sourceDay = newTimeline.find(d => d.dayNumber === sourceDayNum);
      const destDay = newTimeline.find(d => d.dayNumber === destDayNum);

      if (!sourceDay || !destDay) return;

      const [movedItem] = sourceDay.items.splice(source.index, 1);
      destDay.items.splice(destination.index, 0, movedItem);

      setTimeline(newTimeline);
    }
  };

  const handleEditCard = (dayNumber: number, itemId: string) => {
    const day = timeline.find(d => d.dayNumber === dayNumber);
    const product = day?.items.find(item => item.id === itemId);
    if (product) {
      setEditingProduct(product);
      setIsEditModalOpen(true);
    }
  };

  const handleDeleteCard = (dayNumber: number, itemId: string) => {
    const newTimeline = timeline.map(day => {
      if (day.dayNumber === dayNumber) {
        return {
          ...day,
          items: day.items.filter(item => item.id !== itemId),
        };
      }
      return day;
    });
    setTimeline(newTimeline);
  };

  const handleSaveNotes = (productId: string, notes: string) => {
    const newTimeline = timeline.map(day => ({
      ...day,
      items: day.items.map(item =>
        item.id === productId ? { ...item, notes } : item
      ),
    }));
    setTimeline(newTimeline);
  };

  const handleAddDay = () => {
    const newDayNumber = timeline.length + 1;
    setTimeline([...timeline, { dayNumber: newDayNumber, items: [] }]);
  };

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
                      <ResourceLibrary onProductHover={setHoveredProduct} />
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )}
          </div>

          {/* Middle Column: Timeline Builder (45%) */}
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
              <div style={styles.panelContent}>
                <TimelineBuilder
                  timeline={timeline}
                  onEditCard={handleEditCard}
                  onDeleteCard={handleDeleteCard}
                  onAddDay={handleAddDay}
                />
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

        <EditCardModal
          isOpen={isEditModalOpen}
          product={editingProduct}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveNotes}
        />

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
    width: '30%',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  middleColumn: {
    width: '45%',
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

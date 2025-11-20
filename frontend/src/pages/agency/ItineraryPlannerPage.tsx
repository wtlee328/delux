import React, { useState, useCallback } from 'react';
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
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { useToast } from '../../components/Toast';
import ResourceLibrary from '../../components/itinerary/ResourceLibrary';
import { TimelineContainer } from '../../components/itinerary/TimelineContainer';
import { TimelineActivityItemPreview } from '../../components/itinerary/TimelineActivityItem';
import SaveItineraryModal from '../../components/itinerary/SaveItineraryModal';
import ResourceDetailModal from '../../components/itinerary/ResourceDetailModal';
import MapView from '../../components/itinerary/MapView';
import axios from '../../config/axios';
import './ItineraryPlanner.css';
import TopBar from '../../components/TopBar';

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
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [dragSourceType, setDragSourceType] = useState<'resource' | 'timeline' | null>(null);

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
  const recalculateTimes = (items: Product[], dayStartTime: string = '09:00'): Product[] => {
    if (items.length === 0) return [];

    let currentTime = items[0].startTime || dayStartTime;

    return items.map((item) => {
      // First item keeps its time (or gets the day start time if undefined)
      // Subsequent items get calculated based on previous item's end time
      // All items keep their own duration (default 60 if not set)

      const duration = item.duration || 60;
      const startTime = currentTime;

      currentTime = addMinutes(startTime, duration);

      return { ...item, startTime, duration };
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    // Check if it's a resource or a timeline item
    if (active.data.current?.type === 'resource') {
      setActiveProduct(active.data.current.product);
      setDragSourceType('resource');
    } else {
      // Find the item in the timeline
      for (const day of timeline) {
        const item = day.items.find(i => i.timelineId === active.id);
        if (item) {
          setActiveProduct(item);
          setDragSourceType('timeline');
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
    setDragSourceType(null);

    if (!over) return;

    // 1. Dragging from Resource Library to Timeline
    if (active.data.current?.type === 'resource' && over.data.current?.type === 'day') {
      const product = active.data.current.product;
      const dayNumber = over.data.current.dayNumber;

      const uniqueId = `${product.id}-${Date.now()}-${Math.random()}`;
      const productCopy = { ...product, timelineId: uniqueId, duration: 60 }; // Default 60

      setTimeline(prev => prev.map(day => {
        if (day.dayNumber === dayNumber) {
          const newItems = [...day.items, productCopy];
          // If it's the first item, it might default to 09:00 via recalculateTimes
          return { ...day, items: recalculateTimes(newItems) };
        }
        return day;
      }));
      showSuccess(`已將 ${product.title} 加入第 ${dayNumber} 天`);
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
            // If moved to index 0, it keeps its time or inherits? 
            // "If an activity card is moved into the first position... It inherits the original first activity’s start time."
            // recalculateTimes handles this because it uses the first item's time as anchor. 
            // BUT if we just moved it, the first item is now the moved item. 
            // We need to ensure the NEW first item has the OLD first item's start time (or a default).

            const oldFirstTime = sourceDay.items[0]?.startTime || '09:00';
            if (destItemIndex === 0) {
              newItems[0].startTime = oldFirstTime;
            }

            newTimeline[sourceDayIndex] = { ...sourceDay, items: recalculateTimes(newItems) };
          } else {
            // Move to different day
            const [movedItem] = sourceDay.items.splice(sourceItemIndex, 1);

            // If dropping into first position of new day
            if (destItemIndex === 0) {
              const destFirstTime = destDay.items[0]?.startTime || '09:00';
              movedItem.startTime = destFirstTime;
            }

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
          // Only update the specific item
          const updatedItems = day.items.map(item =>
            (item.timelineId || item.id) === uniqueId
              ? { ...item, startTime, duration }
              : item
          );

          // Then recalculate everything. 
          // Since only the first item is editable, recalculateTimes will propagate the change.
          return { ...day, items: recalculateTimes(updatedItems) };
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
      <div className="h-screen flex flex-col bg-slate-50">
        <TopBar
          title="行程規劃"
          actions={
            <div className="flex items-center gap-4">
              <span className="text-green-600 text-sm font-medium">{saveStatus}</span>
              <button
                onClick={() => setIsSaveModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
              >
                儲存行程
              </button>
            </div>
          }
        />

        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Expand Button */}
          {!isMobileMenuOpen.library && (
            <button
              onClick={() => togglePanel('library')}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-slate-200 rounded-r-lg flex items-center justify-center cursor-pointer text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors z-20 shadow-sm"
              title="展開資源庫"
            >
              ›
            </button>
          )}

          {/* Resource Library Panel */}
          <div
            className={`bg-white border-r border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ${isMobileMenuOpen.library ? 'w-[450px] opacity-100' : 'w-0 opacity-0 border-none'
              }`}
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center font-bold text-slate-700 bg-slate-50/50">
              <h3>資源庫</h3>
              <button onClick={() => togglePanel('library')} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <ResourceLibrary
              onProductHover={setHoveredProduct}
              setAvailableProducts={setAvailableProducts}
            />
          </div>

          {/* Timeline Panel */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
            <TimelineContainer
              timeline={timeline}
              onAddDay={handleAddDay}
              onDelete={handleDeleteCard}
              onTimeUpdate={handleUpdateTime}
              onPreview={setPreviewProduct}
            />
          </div>

          {/* Map Panel */}
          <div
            className={`bg-white border-l border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ${isMobileMenuOpen.map ? 'w-[350px] opacity-100' : 'w-0 opacity-0 border-none'
              }`}
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center font-bold text-slate-700 bg-slate-50/50">
              <h3>地圖預覽</h3>
              <button onClick={() => togglePanel('map')} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <MapView
              products={availableProducts}
              highlightedProductId={hoveredProduct?.id}
            />
          </div>

          {/* Right Expand Button */}
          {!isMobileMenuOpen.map && (
            <button
              onClick={() => togglePanel('map')}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-slate-200 rounded-l-lg flex items-center justify-center cursor-pointer text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors z-20 shadow-sm"
              title="展開地圖"
            >
              ‹
            </button>
          )}
        </div>

        <SaveItineraryModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSave={handleSaveItinerary}
        />

        {previewProduct && (
          <ResourceDetailModal
            product={previewProduct}
            onClose={() => setPreviewProduct(null)}
          />
        )}

        <DragOverlay dropAnimation={null}>
          {activeProduct ? (
            <TimelineActivityItemPreview
              item={activeProduct}
              isTimelineItem={dragSourceType === 'timeline'}
            />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default ItineraryPlannerPage;

import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { TimelineContainer, TimelineContainerRef } from '../../components/itinerary/TimelineContainer';
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
  const [searchParams] = useSearchParams();
  const initialDestination = searchParams.get('destination');
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
  const timelineRef = React.useRef<TimelineContainerRef>(null);

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
      const duration = item.duration || 60;
      const startTime = currentTime;
      currentTime = addMinutes(startTime, duration);
      return { ...item, startTime, duration };
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    // Prevent dragging if dates are not selected
    if (!startDate || !endDate) {
      return;
    }

    const { active } = event;
    if (active.data.current?.type === 'resource') {
      setActiveProduct(active.data.current.product);
      setDragSourceType('resource');
    } else {
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
    if (active.data.current?.type === 'resource' && over.data.current?.type === 'day') {
      // No op
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProduct(null);
    setDragSourceType(null);

    if (!over) return;

    if (active.data.current?.type === 'resource' && over.data.current?.type === 'day') {
      const product = active.data.current.product;
      const dayNumber = over.data.current.dayNumber;
      const uniqueId = `${product.id}-${Date.now()}-${Math.random()}`;
      const productCopy = { ...product, timelineId: uniqueId, duration: 60 };

      setTimeline(prev => prev.map(day => {
        if (day.dayNumber === dayNumber) {
          const newItems = [...day.items, productCopy];
          return { ...day, items: recalculateTimes(newItems) };
        }
        return day;
      }));
      showSuccess(`已將 ${product.title} 加入第 ${dayNumber} 天`);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId !== overId) {
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

        if (over.data.current?.type === 'day' && over.data.current.dayNumber === day.dayNumber) {
          destDayIndex = dIndex;
          destItemIndex = day.items.length;
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

          if (sourceDayIndex === destDayIndex) {
            const newItems = arrayMove(sourceDay.items, sourceItemIndex, destItemIndex);
            const oldFirstTime = sourceDay.items[0]?.startTime || '09:00';
            if (destItemIndex === 0) {
              newItems[0].startTime = oldFirstTime;
            }
            newTimeline[sourceDayIndex] = { ...sourceDay, items: recalculateTimes(newItems) };
          } else {
            const [movedItem] = sourceDay.items.splice(sourceItemIndex, 1);
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

  const handleUpdateTime = useCallback((dayNumber: number, uniqueId: string, startTime: string, duration: number) => {
    setTimeline(prevTimeline => {
      return prevTimeline.map(day => {
        if (day.dayNumber === dayNumber) {
          const updatedItems = day.items.map(item =>
            (item.timelineId || item.id) === uniqueId
              ? { ...item, startTime, duration }
              : item
          );
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

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);

    if (start && end) {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      setTimeline(prev => {
        const newTimeline: TimelineDay[] = [];
        for (let i = 0; i < diffDays; i++) {
          const currentDate = new Date(start);
          currentDate.setDate(currentDate.getDate() + i);
          const dateStr = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
          const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDate.getDay()];

          // Preserve existing items if they exist for this day index
          const existingDay = prev.find(d => d.dayNumber === i + 1);
          newTimeline.push({
            dayNumber: i + 1,
            items: existingDay ? existingDay.items : [],
            date: dateStr,
            dayOfWeek: dayOfWeek
          });
        }
        return newTimeline;
      });

      // Scroll to Day 1 after timeline is generated
      setTimeout(() => {
        timelineRef.current?.scrollToDay(1);
      }, 200);
    }
  };

  const handleClearItinerary = () => {
    if (window.confirm('確定要清除所有行程嗎？此動作無法復原。')) {
      setTimeline(prev => prev.map(day => ({ ...day, items: [] })));
      showSuccess('已清除行程');
    }
  };



  return (
    <DndContext
      sensors={startDate && endDate ? sensors : []}
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
                onClick={handleClearItinerary}
                disabled={!startDate || !endDate}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${!startDate || !endDate
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-500 hover:text-red-600'
                  }`}
              >
                清除行程
              </button>
              <button
                onClick={() => setIsSaveModalOpen(true)}
                disabled={!startDate || !endDate}
                className={`px-6 py-2 rounded-lg font-medium transition-colors shadow-sm ${!startDate || !endDate
                  ? 'bg-slate-300 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
                  }`}
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
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </button>
          )}

          {/* Resource Library Panel */}
          <div
            className={`bg-white border-r border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ${isMobileMenuOpen.library ? 'w-[450px] opacity-100' : 'w-0 opacity-0 border-none'
              }`}
          >
            <ResourceLibrary
              onProductHover={setHoveredProduct}
              setAvailableProducts={setAvailableProducts}
              initialDestination={initialDestination || undefined}
              startDate={startDate}
              endDate={endDate}
              onDateRangeChange={handleDateRangeChange}
            />
          </div>

          {/* Timeline Panel */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 relative">
            {!startDate || !endDate ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/95 backdrop-blur-sm">
                <div className="text-center px-8 py-12 bg-white rounded-2xl shadow-lg border border-slate-200 max-w-md">
                  <div className="mb-4 flex items-center justify-center gap-4 text-blue-500">
                    <span className="material-symbols-outlined text-5xl text-slate-300">calendar_today</span>
                    <span className="material-symbols-outlined text-3xl text-slate-300">arrow_forward</span>
                    <span className="material-symbols-outlined text-5xl">event_available</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">請選擇起訖日以開始規劃行程</h3>
                  <p className="text-slate-500 text-sm">在左側選擇旅遊日期範圍後，即可開始拖曳活動至時間軸</p>
                </div>
              </div>
            ) : null}
            <TimelineContainer
              ref={timelineRef}
              timeline={timeline}
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
              <button onClick={() => togglePanel('map')} className="text-slate-400 hover:text-slate-600 leading-none flex items-center">
                <span className="material-symbols-outlined">close</span>
              </button>
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
              <span className="material-symbols-outlined text-slate-400">chevron_left</span>
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

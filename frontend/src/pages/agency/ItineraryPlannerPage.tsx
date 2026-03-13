import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
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
import { Product, TimelineDay } from '../../types/itinerary';

const ItineraryPlannerPage: React.FC = () => {
  const { showSuccess } = useToast();
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialDestination = searchParams.get('destination');
  const tripId = searchParams.get('tripId');
  const itineraryId = routeId || searchParams.get('itineraryId');
  const [itineraryName, setItineraryName] = useState<string>('');
  const [loadingItinerary, setLoadingItinerary] = useState(false);
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
  const [loadingTrip, setLoadingTrip] = useState(false);
  const [tripTemplateName, setTripTemplateName] = useState<string | null>(null);
  const [restrictedSupplierName, setRestrictedSupplierName] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<{ id: string, name: string }[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
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

  // Handler for structured day field changes (meals, hotel, notes)
  const handleDayFieldChange = useCallback((dayNumber: number, field: string, value: any) => {
    setTimeline(prev => prev.map(day =>
      day.dayNumber === dayNumber ? { ...day, [field]: value } : day
    ));
  }, []);

  // Trip preloading logic
  useEffect(() => {
    if (!tripId) return;

    const loadTrip = async () => {
      try {
        setLoadingTrip(true);
        const res = await axios.get(`/api/agency/trips/${tripId}`);
        const trip = res.data;

        setTripTemplateName(trip.name);
        setRestrictedSupplierName(trip.supplierName || null);

        // Auto-set dates based on trip's daysCount
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const endDateCalc = new Date(tomorrow);
        endDateCalc.setDate(endDateCalc.getDate() + trip.daysCount - 1);

        setStartDate(tomorrow);
        setEndDate(endDateCalc);

        // Build timeline from trip data
        const newTimeline: TimelineDay[] = [];
        for (let i = 0; i < trip.daysCount; i++) {
          const currentDate = new Date(tomorrow);
          currentDate.setDate(currentDate.getDate() + i);
          const dateStr = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
          const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDate.getDay()];

          const tripDay = trip.days?.find((d: any) => d.dayIndex === i + 1);

          const items: Product[] = tripDay?.items?.map((item: any) => ({
            id: item.productId,
            title: item.productTitle || '未知產品',
            destination: trip.destination || '',
            category: 'landmark',
            coverImageUrl: '',
            netPrice: 0,
            supplierName: trip.supplierName || '',
            productType: 'landmark' as const,
            timelineId: `${item.productId}-${Date.now()}-${Math.random()}`,
            duration: 60,
          })) || [];

          newTimeline.push({
            dayNumber: i + 1,
            items: recalculateTimes(items),
            date: dateStr,
            dayOfWeek,
            // Structured fields from supplier trip
            breakfastId: tripDay?.breakfastId || null,
            breakfastCustom: tripDay?.breakfastCustom || null,
            breakfastTitle: tripDay?.breakfastTitle || null,
            lunchId: tripDay?.lunchId || null,
            lunchCustom: tripDay?.lunchCustom || null,
            lunchTitle: tripDay?.lunchTitle || null,
            dinnerId: tripDay?.dinnerId || null,
            dinnerCustom: tripDay?.dinnerCustom || null,
            dinnerTitle: tripDay?.dinnerTitle || null,
            hotelId: tripDay?.hotelId || null,
            hotelCustom: tripDay?.hotelCustom || null,
            hotelTitle: tripDay?.hotelTitle || null,
            notes: tripDay?.notes || null,
          });
        }

        setTimeline(newTimeline);

        setTimeout(() => {
          timelineRef.current?.scrollToDay(1);
        }, 200);
      } catch (err) {
        console.error('Failed to load trip template:', err);
      } finally {
        setLoadingTrip(false);
      }
    };

    loadTrip();
  }, [tripId]);

  // Itinerary (Own Draft) preloading logic
  useEffect(() => {
    if (!itineraryId) return;

    const loadItinerary = async () => {
      try {
        setLoadingItinerary(true);
        const res = await axios.get(`/api/itinerary/${itineraryId}`);
        const it = res.data;

        setItineraryName(it.name);
        setRestrictedSupplierName(it.restrictedSupplierName || null);
        
        if (it.startDate) setStartDate(new Date(it.startDate));
        if (it.endDate) setEndDate(new Date(it.endDate));

        const timelineData: TimelineDay[] = it.timelineData.map((day: any) => ({
          ...day,
          items: day.items.map((item: any) => ({
            ...item,
            // Ensure necessary fields exist
            productType: item.productType || 'landmark'
          }))
        }));

        setTimeline(timelineData);

        setTimeout(() => {
          timelineRef.current?.scrollToDay(1);
        }, 300);
      } catch (err) {
        console.error('Failed to load itinerary:', err);
      } finally {
        setLoadingItinerary(false);
      }
    };

    loadItinerary();
  }, [itineraryId]);

  // Fetch suppliers list
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true);
        const res = await axios.get('/api/agency/suppliers');
        setSuppliers(res.data);
      } catch (err) {
        console.error('Failed to fetch suppliers:', err);
      } finally {
        setLoadingSuppliers(false);
      }
    };
    fetchSuppliers();
  }, []);

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

    // Handle dropping a resource (new item)
    if (active.data.current?.type === 'resource') {
      const product = active.data.current.product;
      let targetDayNumber = -1;
      let insertIndex = -1;

      // Case 1: Dropped directly on the day container
      if (over.data.current?.type === 'day') {
        targetDayNumber = over.data.current.dayNumber;
        const day = timeline.find(d => d.dayNumber === targetDayNumber);
        if (day) insertIndex = day.items.length;
      }
      // Case 2: Dropped over an existing item
      else {
        const overId = over.id as string;
        const day = timeline.find(d => d.items.some(i => i.timelineId === overId));
        if (day) {
          targetDayNumber = day.dayNumber;
          const overIndex = day.items.findIndex(i => i.timelineId === overId);
          // Insert after the hovered item
          insertIndex = overIndex + 1;
        }
      }

      if (targetDayNumber !== -1) {
        const uniqueId = `${product.id}-${Date.now()}-${Math.random()}`;
        const productCopy = { ...product, timelineId: uniqueId, duration: 60 };

        setTimeline(prev => prev.map(day => {
          if (day.dayNumber === targetDayNumber) {
            const newItems = [...day.items];
            if (insertIndex >= 0 && insertIndex <= newItems.length) {
              newItems.splice(insertIndex, 0, productCopy);
            } else {
              newItems.push(productCopy);
            }
            return { ...day, items: recalculateTimes(newItems) };
          }
          return day;
        }));
        showSuccess(`已將 ${product.title} 加入第 ${targetDayNumber} 天`);
        return;
      }
    }

    // Handle reordering (Timeline Item -> Timeline Item/Day)
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
      const payload = {
        name,
        destination: initialDestination || timeline[0]?.items[0]?.destination || '',
        daysCount: timeline.length,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        restrictedSupplierName,
        timeline: timeline,
      };

      let response;
      if (itineraryId) {
        response = await axios.put(`/api/itinerary/${itineraryId}`, payload);
      } else {
        response = await axios.post('/api/itinerary', payload);
      }
      
      const savedItinerary = response.data;
      setItineraryName(savedItinerary.name);
      
      // If it was a new save, navigate to the edit URL to prevent double creation on next save
      if (!itineraryId && savedItinerary.id) {
        navigate(`/agency/itinerary-planner/${savedItinerary.id}`, { replace: true });
      }

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

      if (diffDays > 30) {
        alert('行程天數上限為 30 天，請重新選擇日期。');
        setEndDate(null);
        return;
      }

      setTimeline(prev => {
        const newTimeline: TimelineDay[] = [];
        for (let i = 0; i < diffDays; i++) {
          const currentDate = new Date(start);
          currentDate.setDate(currentDate.getDate() + i);
          const dateStr = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
          const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDate.getDay()];

          // Preserve existing items and structured fields if they exist for this day index
          const existingDay = prev.find(d => d.dayNumber === i + 1);
          newTimeline.push({
            dayNumber: i + 1,
            items: existingDay ? existingDay.items : [],
            date: dateStr,
            dayOfWeek: dayOfWeek,
            breakfastId: existingDay?.breakfastId,
            breakfastCustom: existingDay?.breakfastCustom,
            breakfastTitle: existingDay?.breakfastTitle,
            lunchId: existingDay?.lunchId,
            lunchCustom: existingDay?.lunchCustom,
            lunchTitle: existingDay?.lunchTitle,
            dinnerId: existingDay?.dinnerId,
            dinnerCustom: existingDay?.dinnerCustom,
            dinnerTitle: existingDay?.dinnerTitle,
            hotelId: existingDay?.hotelId,
            hotelCustom: existingDay?.hotelCustom,
            hotelTitle: existingDay?.hotelTitle,
            notes: existingDay?.notes,
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
      setTimeline(prev => prev.map(day => ({ 
        ...day, 
        items: [],
        breakfastId: null,
        breakfastCustom: null,
        breakfastTitle: null,
        lunchId: null,
        lunchCustom: null,
        lunchTitle: null,
        dinnerId: null,
        dinnerCustom: null,
        dinnerTitle: null,
        hotelId: null,
        hotelCustom: null,
        hotelTitle: null,
        notes: null
      })));
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
                  : 'bg-slate-800 hover:bg-slate-700 text-white hover:shadow-md'
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
            className={`bg-white flex flex-col overflow-hidden transition-all duration-300 ${isMobileMenuOpen.library ? 'w-[380px] opacity-100' : 'w-0 opacity-0 border-none'
              }`}
          >
            <ResourceLibrary
              onProductHover={setHoveredProduct}
              setAvailableProducts={setAvailableProducts}
              initialDestination={initialDestination || undefined}
              startDate={startDate}
              endDate={endDate}
              onDateRangeChange={handleDateRangeChange}
              restrictToSupplierName={restrictedSupplierName}
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
            {loadingTrip && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <p className="text-slate-500">載入行程範本中...</p>
              </div>
            )}
            {tripTemplateName && (
              <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-center gap-2 text-sm text-blue-700">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>info</span>
                基於供應商行程範本：<strong>{tripTemplateName}</strong>
              </div>
            )}
            <TimelineContainer
              ref={timelineRef}
              timeline={timeline}
              onDelete={handleDeleteCard}
              onTimeUpdate={handleUpdateTime}
              onPreview={setPreviewProduct}
              products={availableProducts}
              onDayFieldChange={handleDayFieldChange}
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
          defaultName={itineraryName || tripTemplateName || ''}
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

        {loadingItinerary && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[100] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-600 font-bold">載入行程中...</p>
            </div>
          </div>
        )}

        {/* Supplier Selection Overlay */}
        {!restrictedSupplierName && !loadingTrip && !loadingItinerary && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[110] flex items-center justify-center p-6">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <span className="material-symbols-outlined text-4xl">travel_explore</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-4">選擇合作供應商</h2>
                <p className="text-slate-500 font-medium mb-10">
                  在開始規劃之前，請先選擇您要使用的行程資源供應商。<br/>
                  這將會過濾出該供應商所提供的專屬地標、餐廳與住宿。
                </p>

                {loadingSuppliers ? (
                  <div className="py-10 flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-400 font-bold">獲取供應商名單...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto px-2 custom-scrollbar">
                    {suppliers.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setRestrictedSupplierName(s.name)}
                        className="group flex items-center justify-between p-5 bg-slate-50 hover:bg-blue-600 rounded-2xl border-2 border-slate-100 hover:border-blue-500 transition-all duration-300 text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                            <span className="material-symbols-outlined text-xl">business</span>
                          </div>
                          <span className="font-bold text-slate-700 group-hover:text-white transition-colors">{s.name}</span>
                        </div>
                        <span className="material-symbols-outlined text-slate-300 group-hover:text-white/50 transition-colors">chevron_right</span>
                      </button>
                    ))}
                    {suppliers.length === 0 && !loadingSuppliers && (
                      <div className="col-span-full py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-medium">
                        目前沒有可用的供應商
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="bg-slate-50 p-6 flex justify-center border-t border-slate-100">
                 <button 
                  onClick={() => navigate('/agency/dashboard')}
                  className="text-slate-400 font-bold hover:text-slate-600 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  回到控制台
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
};

export default ItineraryPlannerPage;

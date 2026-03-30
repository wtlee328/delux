import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../config/axios';
import TopBar from '../../components/TopBar';
import DraftStatusFooter from '../../components/supplier/DraftStatusFooter';
import { ChevronUp, ChevronDown, Trash2, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CustomSelect from '../../components/ui/CustomSelect';

interface Product {
  id: string;
  title: string;
  category: string;
  destination: string;
  status: string;
}

interface TripDayItem {
  productId: string;
  sortOrder: number;
  product?: Product;
  localId: string;
  unmatchedTitle?: string;
}

interface TripDay {
  id?: string;
  dayIndex: number;
  breakfastId: string | null;
  breakfastCustom: string | null;
  lunchId: string | null;
  lunchCustom: string | null;
  dinnerId: string | null;
  dinnerCustom: string | null;
  hotelId: string | null;
  hotelCustom: string | null;
  notes: string | null;
  items: TripDayItem[];
}

function SortableItem({ 
  id, 
  dayIndex, 
  itemIndex, 
  product, 
  handleRemoveItem, 
  reorderItems, 
  totalItems,
  unmatchedTitle,
  onResolve
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: unmatchedTitle ? 10 : 0
  };

  const [showOptions, setShowOptions] = useState(false);

  return (
    <div ref={setNodeRef} style={style} className="mb-2 relative">
      <div className={`flex justify-between items-center p-3 rounded-lg shadow-sm border transition-all ${
        unmatchedTitle 
          ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-100' 
          : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-600 touch-none flex-shrink-0">
            <GripVertical size={18} />
          </div>
          <div className="flex items-center gap-2 overflow-hidden">
            {unmatchedTitle && (
              <span className="material-symbols-outlined text-amber-500 flex-shrink-0" style={{ fontSize: '18px' }}>warning</span>
            )}
            <span className={`font-medium truncate ${unmatchedTitle ? 'text-amber-900' : 'text-slate-700'}`}>
              {unmatchedTitle || product?.title || '未知景點'}
            </span>
            {product && product.status !== '已發佈' && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold border border-amber-200 flex-shrink-0">
                未審核
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 z-10" onPointerDown={e => e.stopPropagation()}>
          {unmatchedTitle && (
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-800 text-[10px] font-bold rounded flex items-center gap-1 transition-colors"
            >
              解決 <span className={`material-symbols-outlined transition-transform text-[12px] ${showOptions ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
          )}
          <button onClick={() => reorderItems(dayIndex, itemIndex, 'up')} disabled={itemIndex === 0} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronUp size={16}/></button>
          <button onClick={() => reorderItems(dayIndex, itemIndex, 'down')} disabled={itemIndex === totalItems - 1} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronDown size={16}/></button>
          <button onClick={() => handleRemoveItem(dayIndex, itemIndex)} className="p-1 text-red-400 hover:text-red-700 flex-shrink-0 ml-1"><Trash2 size={16}/></button>
        </div>
      </div>

      {showOptions && unmatchedTitle && (
        <div className="mt-1 p-3 bg-white border-2 border-amber-300 rounded-lg shadow-xl animate-in fade-in slide-in-from-top-1 duration-200 relative z-[20]">
          <p className="text-[11px] text-slate-500 mb-3 font-medium">系統找不到匹配景點，請選擇：</p>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => { onResolve('rename', id, unmatchedTitle); setShowOptions(false); }}
              className="w-full text-left p-2 hover:bg-slate-50 rounded border border-slate-100 transition-colors flex items-center justify-between group"
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700">1. 選取現有產品並修正名稱</span>
                <span className="text-[10px] text-slate-400">將現有景點名稱同步更新為「{unmatchedTitle}」</span>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-blue-500 transition-colors">edit</span>
            </button>
            <button 
              onClick={() => { onResolve('create', id, unmatchedTitle); setShowOptions(false); }}
              className="w-full text-left p-2 hover:bg-slate-50 rounded border border-slate-100 transition-colors flex items-center justify-between group"
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700">2. 以此名稱建立新產品</span>
                <span className="text-[10px] text-slate-400">系統將建立一筆草稿景點，請稍後完善資訊</span>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-green-500 transition-colors">add_circle</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TripBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [category, setCategory] = useState('團體旅遊');
  const [daysCountInput, setDaysCountInput] = useState('1');
  const [daysCount, setDaysCount] = useState(1);
  const [days, setDays] = useState<TripDay[]>([{
    dayIndex: 1,
    breakfastId: null, breakfastCustom: null,
    lunchId: null, lunchCustom: null,
    dinnerId: null, dinnerCustom: null,
    hotelId: null, hotelCustom: null,
    notes: '', items: []
  }]);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For inline product creation
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProductParams, setNewProductParams] = useState({ category: 'landmark', dayIndex: 1 });
  const [newProductTitle, setNewProductTitle] = useState('');
  
  // Quick Entry State
  const [quickEntryInput, setQuickEntryInput] = useState<{ [dayIndex: number]: string }>({});
  const [showQuickResolveModal, setShowQuickResolveModal] = useState<{ type: 'rename' | 'create', localId: string, title: string } | null>(null);
  const [selectedProductToRename, setSelectedProductToRename] = useState<string>('');
  
  const [tripStatus, setTripStatus] = useState<string>('草稿');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchProducts();
    if (isEditing) {
      fetchTrip();
    }
  }, [id]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/supplier/tours');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTrip = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/supplier/trips/${id}`);
      const trip = res.data;
      setName(trip.name);
      setDestination(trip.destination || '');
      setCategory(trip.category || '團體旅遊');
      setDaysCount(trip.daysCount);
      setDaysCountInput(String(trip.daysCount));
      setTripStatus(trip.status);
      setRejectionReason(trip.rejectionReason || null);
      setDays(trip.days.length ? trip.days.map((d: any) => ({
        ...d,
        items: d.items ? d.items.map((i: any) => ({ ...i, localId: Math.random().toString(36).substr(2, 9) })) : []
      })) : [{
        dayIndex: 1,
        breakfastId: null, breakfastCustom: null,
        lunchId: null, lunchCustom: null,
        dinnerId: null, dinnerCustom: null,
        hotelId: null, hotelCustom: null,
        notes: '', items: []
      }]);
    } catch (err: any) {
      setError('載入行程失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDaysCountInputBlur = () => {
    let newCount = parseInt(daysCountInput.trim(), 10);
    if (isNaN(newCount) || newCount < 1) newCount = 1;
    if (newCount > 20) newCount = 20;
    
    setDaysCountInput(String(newCount));
    
    if (newCount === daysCount) return;

    setDaysCount(newCount);
    setDays(prev => {
      let newDays = [...prev];
      if (newCount > prev.length) {
        for (let i = prev.length + 1; i <= newCount; i++) {
          newDays.push({
            dayIndex: i,
            breakfastId: null, breakfastCustom: null,
            lunchId: null, lunchCustom: null,
            dinnerId: null, dinnerCustom: null,
            hotelId: null, hotelCustom: null,
            notes: '', items: []
          });
        }
      } else {
        newDays = newDays.slice(0, newCount);
      }
      return newDays;
    });
  };

  const reorderDays = (currentIndex: number, direction: 'up' | 'down') => {
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === days.length - 1) return;

    setDays(prev => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const temp = copy[currentIndex];
      copy[currentIndex] = copy[targetIndex];
      copy[targetIndex] = temp;
      
      return copy.map((day, idx) => ({ ...day, dayIndex: idx + 1 }));
    });
  };

  const handleDayChange = (dayIndex: number, field: string, value: any) => {
    setDays(prev => prev.map(d => d.dayIndex === dayIndex ? { ...d, [field]: value } : d));
  };

  const handleAddItem = (dayIndex: number, productId: string) => {
    if (!productId) return;
    
    setDays(prev => prev.map(d => {
      if (d.dayIndex === dayIndex) {
        const newSortOrder = d.items.length > 0 ? Math.max(...d.items.map(i => i.sortOrder)) + 1 : 1;
        return {
          ...d,
          items: [...d.items, { productId, sortOrder: newSortOrder, localId: Math.random().toString(36).substr(2, 9) }]
        };
      }
      return d;
    }));
  };

  const handleRemoveItem = (dayIndex: number, itemIndex: number) => {
    setDays(prev => prev.map(d => {
      if (d.dayIndex === dayIndex) {
        const newItems = [...d.items];
        newItems.splice(itemIndex, 1);
        return { ...d, items: newItems };
      }
      return d;
    }));
  };

  const reorderItems = (dayIndex: number, itemIndex: number, direction: 'up' | 'down') => {
    setDays(prev => prev.map(d => {
      if (d.dayIndex === dayIndex) {
        if (direction === 'up' && itemIndex === 0) return d;
        if (direction === 'down' && itemIndex === d.items.length - 1) return d;
        
        const newItems = [...d.items];
        const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
        const temp = newItems[itemIndex];
        newItems[itemIndex] = newItems[targetIndex];
        newItems[targetIndex] = temp;
        
        return {
          ...d,
          items: newItems.map((item, idx) => ({ ...item, sortOrder: idx + 1 }))
        };
      }
      return d;
    }));
  };

  const handleDragEnd = (event: DragEndEvent, dayIndex: number) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setDays(prev => prev.map(d => {
        if (d.dayIndex === dayIndex) {
          const oldIndex = d.items.findIndex(i => i.localId === active.id);
          const newIndex = d.items.findIndex(i => i.localId === over.id);
          if (oldIndex !== -1 && newIndex !== -1) {
            const newItems = [...d.items];
            const [removed] = newItems.splice(oldIndex, 1);
            newItems.splice(newIndex, 0, removed);
            return {
              ...d,
              items: newItems.map((item, idx) => ({ ...item, sortOrder: idx + 1 }))
            };
          }
        }
        return d;
      }));
    }
  };

  const handleCreateInlineProduct = async () => {
    if (!newProductTitle.trim()) return;
    
    try {
      const formData = new FormData();
      formData.append('title', newProductTitle);
      formData.append('destination', destination || '待定');
      formData.append('category', newProductParams.category);
      formData.append('description', '自動建立的產品');
      formData.append('netPrice', '0');
      
      const blob = new Blob(['dummy image'], { type: 'image/png' });
      formData.append('coverImage', blob, 'dummy.png');

      const res = await axios.post('/api/supplier/tours', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newProduct = res.data;
      setProducts(prev => [newProduct, ...prev]);
      
      if (newProductParams.category === 'landmark') {
        handleAddItem(newProductParams.dayIndex, newProduct.id);
      } else {
        alert('產品建立成功！已加入下拉選單，請手動選擇。');
      }
      
      setShowNewProductModal(false);
      setNewProductTitle('');
    } catch (err) {
      alert('建立產品失敗，請確保填寫所有必欄位。');
    }
  };

  const processQuickEntry = (dayIndex: number) => {
    const input = quickEntryInput[dayIndex];
    if (!input || !destination) return;

    const segments = input.split(/[-、,，]/).map(s => s.trim()).filter(Boolean);
    if (segments.length === 0) return;

    setDays(prev => prev.map(d => {
      if (d.dayIndex === dayIndex) {
        let currentSort = d.items.length > 0 ? Math.max(...d.items.map(i => i.sortOrder)) : 0;
        
        const newItems = segments.map(segment => {
          currentSort++;
          const match = products.find(p => 
            p.title.trim() === segment && 
            (p.destination || '').trim().toLowerCase().includes(destination.trim().toLowerCase())
          );

          if (match) {
            return {
              productId: match.id,
              sortOrder: currentSort,
              localId: Math.random().toString(36).substr(2, 9)
            };
          } else {
            return {
              productId: '',
              unmatchedTitle: segment,
              sortOrder: currentSort,
              localId: Math.random().toString(36).substr(2, 9)
            };
          }
        });

        return {
          ...d,
          items: [...d.items, ...newItems]
        };
      }
      return d;
    }));
    
    setQuickEntryInput(prev => ({ ...prev, [dayIndex]: '' }));
  };

  const handleResolveAction = (type: 'rename' | 'create', localId: string, title: string) => {
    setShowQuickResolveModal({ type, localId, title });
  };

  const finishResolveRename = async () => {
    if (!showQuickResolveModal || !selectedProductToRename) return;
    const { localId, title } = showQuickResolveModal;
    
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('title', title);
      await axios.put(`/api/supplier/tours/${selectedProductToRename}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setProducts(prev => prev.map(p => p.id === selectedProductToRename ? { ...p, title: title } : p));
      
      setDays(prev => prev.map(d => ({
        ...d,
        items: d.items.map(item => item.localId === localId 
          ? { ...item, productId: selectedProductToRename, unmatchedTitle: undefined } 
          : item)
      })));
      
      setSelectedProductToRename('');
      setShowQuickResolveModal(null);
    } catch (err) {
      alert('重命名產品失敗');
    } finally {
      setSaving(false);
    }
  };

  const finishResolveCreate = async () => {
    if (!showQuickResolveModal) return;
    const { localId, title } = showQuickResolveModal;

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('destination', destination || '待定');
      formData.append('category', 'landmark');
      formData.append('description', '快速匯入自動建立');
      formData.append('netPrice', '0');
      
      const blob = new Blob(['dummy'], { type: 'image/png' });
      formData.append('coverImage', blob, 'dummy.png');

      const res = await axios.post('/api/supplier/tours', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newProduct = res.data;
      setProducts(prev => [newProduct, ...prev]);
      
      setDays(prev => prev.map(d => ({
        ...d,
        items: d.items.map(item => item.localId === localId 
          ? { ...item, productId: newProduct.id, unmatchedTitle: undefined } 
          : item)
      })));
      
      setShowQuickResolveModal(null);
    } catch (err) {
      alert('建立產品失敗');
    } finally {
      setSaving(false);
    }
  };

  const isSubmitForReviewRef = useRef(false);

  const saveTrip = async () => {
    try {
      if (!name) {
        alert('請填寫行程名稱');
        return;
      }
      if (!destination) {
        alert('請選取或建立目的地');
        return;
      }
      // Check if any items are still unmatched
      const hasUnmatched = days.some(d => d.items.some(i => i.unmatchedTitle));
      if (hasUnmatched) {
         alert('行程中尚有未解決的景點（黃色標記），請先解決或移除後再儲存。');
         return;
      }

      setSaving(true);
      const payload = {
        name,
        destination,
        category,
        daysCount,
        days: days.map(d => ({
          ...d,
          breakfastCustom: d.breakfastCustom === 'DEFAULT' ? null : d.breakfastCustom,
          lunchCustom: d.lunchCustom === 'DEFAULT' ? null : d.lunchCustom,
          dinnerCustom: d.dinnerCustom === 'DEFAULT' ? null : d.dinnerCustom,
          hotelCustom: d.hotelCustom === 'DEFAULT' ? null : d.hotelCustom,
        }))
      };

      if (isEditing) {
        await axios.put(`/api/supplier/trips/${id}`, payload);
      } else {
        await axios.post('/api/supplier/trips', payload);
      }

      if (isSubmitForReviewRef.current) {
        await axios.put(`/api/supplier/trips/${id}/status`, { status: '審核中' });
        alert('行程已儲存並成功提交審核！');
      }

      navigate('/supplier/dashboard?tab=trips');
    } catch (err: any) {
      setError(err.response?.data?.error || '儲存行程失敗');
    } finally {
      setSaving(false);
      isSubmitForReviewRef.current = false;
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!isEditing) return;
    try {
      setSaving(true);
      await axios.put(`/api/supplier/trips/${id}/status`, { status: newStatus });
      setTripStatus(newStatus);
      if (newStatus === '草稿') setRejectionReason(null);
      alert(newStatus === '審核中' ? '已提交審核' : (newStatus === '草稿' ? '行程已撤回至草稿' : '已更新狀態'));
    } catch (err: any) {
      alert(err.response?.data?.message || '更新狀態失敗');
    } finally {
      setSaving(false);
    }
  };

  const submitForReview = async () => {
    try {
      const allProductIdsInTrip: string[] = [];
      days.forEach(d => {
        if (d.breakfastId) allProductIdsInTrip.push(d.breakfastId);
        if (d.lunchId) allProductIdsInTrip.push(d.lunchId);
        if (d.dinnerId) allProductIdsInTrip.push(d.dinnerId);
        if (d.hotelId) allProductIdsInTrip.push(d.hotelId);
        d.items.forEach(item => {
           if (item.productId) allProductIdsInTrip.push(item.productId);
        });
      });

      const unapproved = products.filter(p => allProductIdsInTrip.includes(p.id) && p.status !== '已發佈');
      if (unapproved.length > 0) {
        alert('此行程包含尚未審核通過的產品，請先完成產品審核後再提交行程審核。');
        return;
      }

      await handleStatusUpdate('審核中');
      navigate('/supplier/dashboard');
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSaveAndSubmitForReview = () => {
    const allProductIdsInTrip: string[] = [];
    days.forEach(d => {
      if (d.breakfastId) allProductIdsInTrip.push(d.breakfastId);
      if (d.lunchId) allProductIdsInTrip.push(d.lunchId);
      if (d.dinnerId) allProductIdsInTrip.push(d.dinnerId);
      if (d.hotelId) allProductIdsInTrip.push(d.hotelId);
      d.items.forEach(item => {
         if (item.productId) allProductIdsInTrip.push(item.productId);
      });
    });

    const unapproved = products.filter(p => allProductIdsInTrip.includes(p.id) && p.status !== '已發佈');
    if (unapproved.length > 0) {
      alert('此行程包含尚未審核通過的產品，請先完成產品審核後再提交行程審核。');
      return;
    }

    isSubmitForReviewRef.current = true;
    saveTrip();
  };

  const uniqueDestinations = Array.from(new Set(products.map(p => p.destination).filter(d => Boolean(d) && d !== '待定')));
  const getProductsByCategory = (cat: string) => {
    const tripDest = (destination || '').trim().toLowerCase();
    return products.filter(p => {
      const matchesCategory = p.category === cat;
      const matchesDestination = !tripDest || tripDest === '待定' || (p.destination && p.destination.trim().toLowerCase().includes(tripDest));
      return matchesCategory && matchesDestination;
    });
  };

  if (loading) return <div className="p-8 text-center text-slate-500">載入中...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <TopBar title="編輯行程" />
      
      <main className="max-w-4xl mx-auto p-6 mt-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">{isEditing ? '編輯行程' : '新增行程'}</h1>
          <button 
            type="button"
            onClick={() => navigate('/supplier/dashboard?tab=trips')}
            className="px-6 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg shadow-sm font-medium hover:bg-slate-50 transition-colors"
          >
            返回上頁
          </button>
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">行程名稱 *</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none" 
                placeholder="例如：東京五日遊"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">行程天數 *</label>
              <input 
                type="text" 
                value={daysCountInput} 
                onChange={e => setDaysCountInput(e.target.value)}
                onBlur={handleDaysCountInputBlur}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none"
              />
            </div>
            <div className="md:col-span-3">
              <CustomSelect
                label="目的地 (Destination) *" 
                value={destination} 
                onChange={e => {
                  if (e.target.value === '__add_new__') {
                    const newDest = window.prompt('請輸入新目的地名稱:');
                    if (newDest && newDest.trim()) {
                      setDestination(newDest.trim());
                    }
                  } else {
                    setDestination(e.target.value);
                  }
                }}
              >
                <option value="" disabled>請選擇目的地</option>
                {uniqueDestinations.map(dest => (
                  <option key={dest} value={dest}>{dest}</option>
                ))}
                {destination && !uniqueDestinations.includes(destination) && (
                  <option value={destination}>{destination}</option>
                )}
                <option value="__add_new__">+ 新增目的地...</option>
              </CustomSelect>
            </div>
            <div className="md:col-span-3">
              <CustomSelect
                label="類別 (Category) *" 
                value={category} 
                onChange={e => setCategory(e.target.value)}
              >
                <option value="團體旅遊">團體旅遊</option>
                <option value="半自助">半自助</option>
                <option value="自駕遊">自駕遊</option>
                <option value="自由行">自由行</option>
              </CustomSelect>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {days.map((day, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800">第 {day.dayIndex} 天</h3>
                <div className="flex gap-2">
                  <button onClick={() => reorderDays(idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-slate-200 rounded disabled:opacity-30">
                    <ChevronUp size={20} />
                  </button>
                  <button onClick={() => reorderDays(idx, 'down')} disabled={idx === days.length - 1} className="p-1 hover:bg-slate-200 rounded disabled:opacity-30">
                    <ChevronDown size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['breakfast', 'lunch', 'dinner'] as const).map(mealStr => {
                    const label = mealStr === 'breakfast' ? '早餐' : mealStr === 'lunch' ? '午餐' : '晚餐';
                    const customKey = `${mealStr}Custom` as keyof TripDay;
                    const idKey = `${mealStr}Id` as keyof TripDay;
                    
                    return (
                      <div key={mealStr} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
                        <CustomSelect
                          value={(day[idKey] as string | null) ? String(day[idKey]) : ((day[customKey] as string | null) || '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__add_new__') {
                              setShowNewProductModal(true);
                              setNewProductParams({ category: 'food', dayIndex: day.dayIndex });
                              return;
                            }
                            if (['酒店享用', '自理', '機上'].includes(val)) {
                              handleDayChange(day.dayIndex, idKey, null);
                              handleDayChange(day.dayIndex, customKey, val);
                            } else {
                              handleDayChange(day.dayIndex, idKey, val || null);
                              handleDayChange(day.dayIndex, customKey, null);
                            }
                          }}
                        >
                          <option value="">-- 選擇或輸入餐食 --</option>
                          <optgroup label="特殊選項 (不建立產品)">
                            <option value="酒店享用">酒店享用</option>
                            <option value="自理">自理</option>
                            <option value="機上">機上</option>
                          </optgroup>
                          <optgroup label="現有餐食產品">
                            {getProductsByCategory('food').map(p => (
                              <option key={p.id} value={p.id}>
                                {p.title} {p.status !== '已發佈' ? '(未審核)' : ''}
                              </option>
                            ))}
                          </optgroup>
                          <option value="__add_new__">+ 建立新產品並加入</option>
                        </CustomSelect>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <h4 className="font-bold text-slate-700 mb-3 flex justify-between items-center">
                    景點列表
                  </h4>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, day.dayIndex)}>
                    <SortableContext items={day.items.map(i => i.localId)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2 mb-3">
                        {day.items.map((item, iDx) => {
                          const product = products.find(p => p.id === item.productId);
                          return (
                            <SortableItem 
                              key={item.localId}
                              id={item.localId}
                              dayIndex={day.dayIndex}
                              itemIndex={iDx}
                              product={product}
                              unmatchedTitle={item.unmatchedTitle}
                              handleRemoveItem={handleRemoveItem}
                              reorderItems={reorderItems}
                              totalItems={day.items.length}
                              onResolve={handleResolveAction}
                            />
                          )
                        })}
                        {day.items.length === 0 && <p className="text-sm text-slate-400 italic">尚未加入景點</p>}
                      </div>
                    </SortableContext>
                  </DndContext>
                  
                  <CustomSelect
                    icon="add"
                    className="bg-slate-50"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__add_new__') {
                        setShowNewProductModal(true);
                        setNewProductParams({ category: 'landmark', dayIndex: day.dayIndex });
                        e.target.value = '';
                        return;
                      }
                      handleAddItem(day.dayIndex, val);
                      e.target.value = '';
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>點擊選擇現有景點加入行程...</option>
                    <optgroup label="現有景點產品">
                      {getProductsByCategory('landmark').map(p => (
                        <option key={p.id} value={p.id}>
                          {p.title} {p.status !== '已發佈' ? '(未審核)' : ''}
                        </option>
                      ))}
                    </optgroup>
                    <option value="__add_new__">+ 點擊建立新產品並加入</option>
                  </CustomSelect>

                  {destination && (
                    <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                      <label className="block text-sm font-bold text-blue-800 mb-2">
                         <span className="material-symbols-outlined align-middle mr-1 text-base">bolt</span>
                         快速匯入行程
                      </label>
                      <p className="text-xs text-blue-600 mb-2">可直接輸入多個景點（以 "-" 或 "," 分隔），系統將自動比對並依序加入。例如：「烏布 - 金巴蘭海灘 - 烏魯瓦圖」</p>
                      <div className="flex gap-2">
                        <input 
                          className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                          placeholder="請輸入行程字串..."
                          value={quickEntryInput[day.dayIndex] || ''}
                          onChange={e => setQuickEntryInput(prev => ({ ...prev, [day.dayIndex]: e.target.value }))}
                          onKeyDown={e => {
                             if (e.key === 'Enter') {
                               e.preventDefault();
                               processQuickEntry(day.dayIndex);
                             }
                          }}
                        />
                        <button 
                          onClick={() => processQuickEntry(day.dayIndex)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition"
                        >
                          快速加入
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-slate-700 mb-2">住宿</h4>
                  <div className="flex gap-4 items-center">
                  <CustomSelect
                    value={day.hotelId ? String(day.hotelId) : (day.hotelCustom || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__add_new__') {
                        setShowNewProductModal(true);
                        setNewProductParams({ category: 'accommodation', dayIndex: day.dayIndex });
                        return;
                      }
                      if (['五星或同級', '四星或同級', '三星或同級'].includes(val)) {
                        handleDayChange(day.dayIndex, 'hotelId', null);
                        handleDayChange(day.dayIndex, 'hotelCustom', val);
                      } else {
                        handleDayChange(day.dayIndex, 'hotelId', val || null);
                        handleDayChange(day.dayIndex, 'hotelCustom', null);
                      }
                    }}
                  >
                    <option value="">-- 選擇或輸入住宿 --</option>
                    <optgroup label="特殊選項 (不建立產品)">
                      <option value="五星或同級">五星或同級</option>
                      <option value="四星或同級">四星或同級</option>
                      <option value="三星或同級">三星或同級</option>
                    </optgroup>
                    <optgroup label="現有住宿產品">
                      {getProductsByCategory('accommodation').map(p => (
                        <option key={p.id} value={p.id}>
                          {p.title} {p.status !== '已發佈' ? '(未審核)' : ''}
                        </option>
                      ))}
                    </optgroup>
                    <option value="__add_new__">+ 點擊建立新產品並加入</option>
                  </CustomSelect>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-700 mb-2">當日備註</h4>
                  <textarea 
                    className="w-full text-sm p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-800" 
                    rows={2}
                    value={day.notes || ''}
                    onChange={(e) => handleDayChange(day.dayIndex, 'notes', e.target.value)}
                    placeholder="輸入當日行程備註..."
                  />
                </div>

              </div>
            </div>
          ))}
        </div>
      </main>

      <div className="h-24"></div>

      <DraftStatusFooter
        status={tripStatus}
        rejectionReason={rejectionReason}
        onSaveDraft={saveTrip}
        onSubmitForReview={submitForReview}
        onSaveAndSubmitForReview={handleSaveAndSubmitForReview}
        onWithdraw={() => handleStatusUpdate('草稿')}
        isSubmitting={saving}
        itemType="行程"
      />

      {showNewProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              新增 {newProductParams.category === 'food' ? '餐食' : newProductParams.category === 'accommodation' ? '住宿' : '景點'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">輸入產品名稱以快速建立。完整的產品資訊可稍後於「我的產品」中補充。</p>
            <input 
              type="text" 
              className="w-full p-2 border border-slate-300 rounded mb-4 focus:ring-2 focus:ring-slate-800 outline-none"
              placeholder="產品名稱 *"
              value={newProductTitle}
              onChange={e => setNewProductTitle(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowNewProductModal(false)} className="px-4 py-2 hover:bg-slate-100 rounded text-slate-700 font-medium">取消</button>
              <button 
                onClick={handleCreateInlineProduct}
                disabled={!newProductTitle.trim()}
                className="px-4 py-2 bg-slate-800 text-white rounded font-medium disabled:opacity-50"
              >
                建立並加入
              </button>
            </div>
          </div>
        </div>
      )}

      {showQuickResolveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {showQuickResolveModal.type === 'rename' ? '重新命名並對應' : '建立新景點產品'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {showQuickResolveModal.type === 'rename' 
                ? `請選擇要對應到「${showQuickResolveModal.title}」的現有產品：`
                : `系統將自動建立一個名為「${showQuickResolveModal.title}」的景點。繼續嗎？`}
            </p>

            {showQuickResolveModal.type === 'rename' && (
              <div className="mb-6">
                <CustomSelect
                  value={selectedProductToRename}
                  onChange={e => setSelectedProductToRename(e.target.value)}
                  className="w-full text-sm"
                >
                  <option value="">-- 請選擇現有景點 --</option>
                  {getProductsByCategory('landmark').map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </CustomSelect>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                onClick={() => { setShowQuickResolveModal(null); setSelectedProductToRename(''); }}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 font-medium"
              >
                取消
              </button>
              <button 
                onClick={showQuickResolveModal.type === 'rename' ? finishResolveRename : finishResolveCreate}
                disabled={showQuickResolveModal.type === 'rename' && !selectedProductToRename}
                className={`px-6 py-2 rounded-lg font-bold text-white shadow-lg transition-transform active:scale-95 ${
                  showQuickResolveModal.type === 'rename' ? 'bg-blue-600' : 'bg-slate-800'
                }`}
              >
                確 定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Product } from '../../types/itinerary';

interface TimelineActivityItemProps {
    item: Product;
    onDelete: (id: string) => void;
    onReorder?: (id: string, direction: 'up' | 'down') => void;
    isFirst?: boolean;
    isLast?: boolean;
}

export const TimelineActivityItemPreview: React.FC<{ item: Product; isTimelineItem?: boolean }> = ({
    item,
}) => {
    return (
        <div className="flex justify-between items-center p-3 bg-white border border-slate-300 rounded-lg shadow-lg relative opacity-90 scale-[1.02] cursor-grabbing">
            <div className="flex items-center gap-3">
                <div className="text-slate-400 flex items-center">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>drag_indicator</span>
                </div>
                <span className="font-bold text-slate-700">{item.title}</span>
            </div>
            <div className="flex items-center gap-0.5 opacity-30">
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>expand_less</span>
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>expand_more</span>
                <span className="material-symbols-outlined ml-1" style={{ fontSize: '20px' }}>delete</span>
            </div>
        </div>
    );
};



export const TimelineActivityItem: React.FC<TimelineActivityItemProps> = ({
    item,
    onDelete,
    onReorder,
    isFirst,
    isLast,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.timelineId! });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 9999 : 1,
        opacity: 1,
        touchAction: 'none',
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm mb-2 relative group"
        >
            <div className="flex items-center gap-3">
                <div {...attributes} {...listeners} className="cursor-grab text-slate-300 hover:text-slate-500 transition-colors flex items-center">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>drag_indicator</span>
                </div>
                <span className="font-bold text-slate-700">{item.title}</span>
            </div>

            <div className="flex items-center gap-0.5" onPointerDown={(e) => e.stopPropagation()}>
                {onReorder && (
                    <>
                        <button
                            onClick={() => onReorder(item.timelineId!, 'up')}
                            disabled={isFirst}
                            className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-30 disabled:hover:text-slate-300 transition-colors flex items-center"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>expand_less</span>
                        </button>
                        <button
                            onClick={() => onReorder(item.timelineId!, 'down')}
                            disabled={isLast}
                            className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-30 disabled:hover:text-slate-300 transition-colors flex items-center"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>expand_more</span>
                        </button>
                    </>
                )}
                
                <button
                    onClick={() => onDelete(item.timelineId!)}
                    className="p-1 text-red-100 hover:text-red-500 transition-colors flex items-center ml-1"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                </button>
            </div>
        </div>
    );
};





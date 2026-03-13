import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TimelineActivityItem } from './TimelineActivityItem';
import { Product, TimelineDay } from '../../types/itinerary';

interface TimelineDayRowProps {
    day: TimelineDay;
    colorTheme: { primary: string; light: string; dot: string };
    onTimeUpdate: (id: string, startTime: string, duration: number) => void;
    onDelete: (id: string) => void;
    onEdit?: (id: string) => void;
    onPreview: (product: Product) => void;
    isExpanded: boolean;
    onToggle: () => void;
    // Structured day fields
    products?: Product[];
    onDayFieldChange?: (dayNumber: number, field: string, value: any) => void;
}

// Meal predefined options
const MEAL_PREDEFINED_OPTIONS = ['酒店享用', '自理', '機上'];
// Hotel predefined options
const HOTEL_PREDEFINED_OPTIONS = ['五星或同級', '四星或同級', '三星或同級'];

const MealSelect: React.FC<{
    label: string;
    idValue: string | null | undefined;
    customValue: string | null | undefined;
    titleValue?: string | null | undefined;
    products: Product[];
    onChange: (idVal: string | null, customVal: string | null) => void;
}> = ({ label, idValue, customValue, products, onChange }) => {
    const currentValue = idValue ? String(idValue) : (customValue || '');

    return (
        <div style={fieldStyles.mealItem}>
            <label style={fieldStyles.fieldLabel}>{label}</label>
            <select
                style={fieldStyles.select}
                value={currentValue}
                onChange={(e) => {
                    const val = e.target.value;
                    if (MEAL_PREDEFINED_OPTIONS.includes(val)) {
                        onChange(null, val);
                    } else {
                        onChange(val || null, null);
                    }
                }}
                onPointerDown={(e) => e.stopPropagation()}
            >
                <option value="">-- 選擇 --</option>
                <optgroup label="特殊選項">
                    {MEAL_PREDEFINED_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </optgroup>
                <optgroup label="餐食產品">
                    {products.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                </optgroup>
            </select>
        </div>
    );
};

const HotelSelect: React.FC<{
    idValue: string | null | undefined;
    customValue: string | null | undefined;
    titleValue?: string | null | undefined;
    products: Product[];
    onChange: (idVal: string | null, customVal: string | null) => void;
}> = ({ idValue, customValue, products, onChange }) => {
    const currentValue = idValue ? String(idValue) : (customValue || '');

    return (
        <div style={fieldStyles.hotelSection}>
            <label style={fieldStyles.sectionLabel}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '4px' }}>hotel</span>
                住宿
            </label>
            <select
                style={fieldStyles.select}
                value={currentValue}
                onChange={(e) => {
                    const val = e.target.value;
                    if (HOTEL_PREDEFINED_OPTIONS.includes(val)) {
                        onChange(null, val);
                    } else {
                        onChange(val || null, null);
                    }
                }}
                onPointerDown={(e) => e.stopPropagation()}
            >
                <option value="">-- 選擇住宿 --</option>
                <optgroup label="等級選項">
                    {HOTEL_PREDEFINED_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </optgroup>
                <optgroup label="住宿產品">
                    {products.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                </optgroup>
            </select>
        </div>
    );
};

// Helper to get display text for a meal/hotel field
const getDisplayText = (idValue: string | null | undefined, customValue: string | null | undefined, titleValue: string | null | undefined): string | null => {
    if (customValue) return customValue;
    if (titleValue) return titleValue;
    if (idValue) return '(已選擇)';
    return null;
};

export const TimelineDayRow: React.FC<TimelineDayRowProps> = ({
    day,
    colorTheme,
    onTimeUpdate,
    onDelete,
    onEdit,
    onPreview,
    isExpanded,
    onToggle,
    products = [],
    onDayFieldChange,
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `day-${day.dayNumber}`,
        data: { type: 'day', dayNumber: day.dayNumber },
    });

    const landmarks = day.items.filter(i => (i.productType === 'landmark' || i.productType === 'transportation') && i.timelineId);
    const foodProducts = products.filter(p => p.category === 'food');
    const accommodationProducts = products.filter(p => p.category === 'accommodation');

    // Summary display values
    const breakfastDisplay = getDisplayText(day.breakfastId, day.breakfastCustom, day.breakfastTitle);
    const lunchDisplay = getDisplayText(day.lunchId, day.lunchCustom, day.lunchTitle);
    const dinnerDisplay = getDisplayText(day.dinnerId, day.dinnerCustom, day.dinnerTitle);
    const hotelDisplay = getDisplayText(day.hotelId, day.hotelCustom, day.hotelTitle);

    const handleMealChange = (mealType: 'breakfast' | 'lunch' | 'dinner', idVal: string | null, customVal: string | null) => {
        if (!onDayFieldChange) return;
        onDayFieldChange(day.dayNumber, `${mealType}Id`, idVal);
        onDayFieldChange(day.dayNumber, `${mealType}Custom`, customVal);
    };

    return (
        <div style={styles.container}>
            {/* Summary Card */}
            <div style={styles.summaryCard} onClick={onToggle}>
                <div style={styles.dayColumn}>
                    <div style={styles.dayNumber}>
                        第<span style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{day.dayNumber}</span>天
                    </div>
                </div>

                <div style={styles.summaryContent}>
                    {/* Route */}
                    <div style={{ ...styles.summaryRow, marginBottom: '8px' }}>
                        <div style={styles.routeText}>
                            {landmarks.length > 0 ? (
                                landmarks.map((l, i) => (
                                    <React.Fragment key={l.timelineId || i}>
                                        {i > 0 && <span style={styles.arrow}> – </span>}
                                        <span>{l.title}</span>
                                    </React.Fragment>
                                ))
                            ) : (
                                <span style={{ color: '#b2bec3' }}>點擊展開規劃行程</span>
                            )}
                        </div>
                        {day.date && (
                            <div style={styles.dateText}>
                                {day.date} {day.dayOfWeek}
                            </div>
                        )}
                    </div>

                    {/* Meals Summary */}
                    <div style={styles.summaryRow}>
                        <span style={styles.label}>餐食：</span>
                        <span style={styles.summaryText}>
                            {[
                                breakfastDisplay ? `早:${breakfastDisplay}` : null,
                                lunchDisplay ? `午:${lunchDisplay}` : null,
                                dinnerDisplay ? `晚:${dinnerDisplay}` : null,
                            ].filter(Boolean).join('、') || '尚未安排'}
                        </span>
                    </div>

                    {/* Hotel */}
                    <div style={styles.summaryRow}>
                        <span style={styles.label}>住宿：</span>
                        <span style={{ ...styles.summaryText, color: hotelDisplay ? '#e17055' : '#b2bec3', fontWeight: hotelDisplay ? '600' : 'normal' }}>
                            {hotelDisplay || '尚未安排'}
                        </span>
                    </div>
                </div>

                {/* Expand/Collapse Arrow */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 1rem',
                    color: '#b2bec3',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>
                    <span className="material-symbols-outlined">expand_more</span>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div style={styles.expandedArea}>
                    {/* Structured Fields: Meals */}
                    {onDayFieldChange && (
                        <div style={fieldStyles.structuredSection}>
                            <div style={fieldStyles.sectionLabel}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '4px' }}>restaurant</span>
                                餐食安排
                            </div>
                            <div style={fieldStyles.mealsGrid}>
                                <MealSelect
                                    label="早餐"
                                    idValue={day.breakfastId}
                                    customValue={day.breakfastCustom}
                                    titleValue={day.breakfastTitle}
                                    products={foodProducts}
                                    onChange={(id, custom) => handleMealChange('breakfast', id, custom)}
                                />
                                <MealSelect
                                    label="午餐"
                                    idValue={day.lunchId}
                                    customValue={day.lunchCustom}
                                    titleValue={day.lunchTitle}
                                    products={foodProducts}
                                    onChange={(id, custom) => handleMealChange('lunch', id, custom)}
                                />
                                <MealSelect
                                    label="晚餐"
                                    idValue={day.dinnerId}
                                    customValue={day.dinnerCustom}
                                    titleValue={day.dinnerTitle}
                                    products={foodProducts}
                                    onChange={(id, custom) => handleMealChange('dinner', id, custom)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Hotel */}
                    {onDayFieldChange && (
                        <div style={fieldStyles.structuredSection}>
                            <HotelSelect
                                idValue={day.hotelId}
                                customValue={day.hotelCustom}
                                titleValue={day.hotelTitle}
                                products={accommodationProducts}
                                onChange={(id, custom) => {
                                    onDayFieldChange(day.dayNumber, 'hotelId', id);
                                    onDayFieldChange(day.dayNumber, 'hotelCustom', custom);
                                }}
                            />
                        </div>
                    )}

                    {/* Attractions Drop Zone */}
                    <div style={{ position: 'relative' }}>
                        <div style={{ ...styles.timelineLine, backgroundColor: colorTheme.primary }} />
                        <div
                            ref={setNodeRef}
                            style={{
                                ...styles.dropZone,
                                backgroundColor: isOver ? colorTheme.light + '20' : 'transparent'
                            }}
                        >
                            <SortableContext
                                items={day.items.map(item => item.timelineId!)}
                                strategy={verticalListSortingStrategy}
                            >
                                {day.items.length === 0 ? (
                                    <div style={styles.emptyState}>
                                        <p style={styles.emptyText}>將活動拖曳至此</p>
                                    </div>
                                ) : (
                                    day.items.map((item) => (
                                        <TimelineActivityItem
                                            key={item.timelineId}
                                            item={item}
                                            colorTheme={colorTheme}
                                            onTimeUpdate={onTimeUpdate}
                                            onDelete={onDelete}
                                            onEdit={onEdit}
                                            isStartTimeEditable={true}
                                            onPreview={onPreview}
                                        />
                                    ))
                                )}
                            </SortableContext>
                        </div>
                    </div>

                    {/* Notes */}
                    {onDayFieldChange && (
                        <div style={fieldStyles.structuredSection}>
                            <div style={fieldStyles.sectionLabel}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '4px' }}>edit_note</span>
                                當日備註
                            </div>
                            <textarea
                                style={fieldStyles.notesInput}
                                rows={2}
                                value={day.notes || ''}
                                placeholder="輸入當日行程備註..."
                                onChange={(e) => onDayFieldChange(day.dayNumber, 'notes', e.target.value)}
                                onPointerDown={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const fieldStyles = {
    structuredSection: {
        padding: '0.75rem 1rem',
        borderBottom: '1px solid #f1f2f6',
    },
    sectionLabel: {
        fontSize: '0.8rem',
        fontWeight: '600' as const,
        color: '#636e72',
        marginBottom: '0.5rem',
        display: 'flex',
        alignItems: 'center',
    },
    mealsGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '0.5rem',
    },
    mealItem: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '0.25rem',
    },
    fieldLabel: {
        fontSize: '0.7rem',
        fontWeight: '600' as const,
        color: '#b2bec3',
        textTransform: 'uppercase' as const,
    },
    select: {
        width: '100%',
        padding: '0.4rem',
        borderRadius: '6px',
        border: '1px solid #dfe6e9',
        fontSize: '0.8rem',
        outline: 'none',
        backgroundColor: 'white',
        color: '#2d3436',
        cursor: 'pointer',
    },
    hotelSection: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '0.5rem',
    },
    notesInput: {
        width: '100%',
        padding: '0.5rem',
        borderRadius: '6px',
        border: '1px solid #dfe6e9',
        fontSize: '0.85rem',
        outline: 'none',
        resize: 'vertical' as const,
        fontFamily: 'inherit',
        color: '#2d3436',
        boxSizing: 'border-box' as const,
    },
};

const styles = {
    container: {
        marginBottom: '1rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    },
    summaryCard: {
        display: 'flex',
        cursor: 'pointer',
        minHeight: '80px',
        transition: 'background-color 0.2s',
        borderRadius: '12px',
        overflow: 'hidden',
    },
    dayColumn: {
        width: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRight: '1px solid #f1f2f6',
        backgroundColor: '#fafafa',
        flexShrink: 0,
    },
    dayNumber: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        color: '#2d3436',
        fontSize: '0.9rem',
    },
    summaryContent: {
        flex: 1,
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        gap: '6px',
        minWidth: 0,
    },
    summaryRow: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '8px',
        fontSize: '0.9rem',
        lineHeight: 1.4,
    },
    routeText: {
        fontWeight: '600',
        color: '#2d3436',
        flex: 1,
        display: 'flex',
        flexWrap: 'wrap' as const,
        gap: '4px',
        alignItems: 'center',
    },
    arrow: {
        color: '#b2bec3',
        fontSize: '0.9rem',
        margin: '0 4px',
    },
    dateText: {
        fontSize: '0.85rem',
        color: '#b2bec3',
        marginLeft: 'auto',
        whiteSpace: 'nowrap' as const,
    },
    label: {
        color: '#636e72',
        minWidth: '45px',
        fontSize: '0.85rem',
    },
    summaryText: {
        color: '#2d3436',
        fontSize: '0.9rem',
    },
    expandedArea: {
        borderTop: '1px solid #f1f2f6',
        backgroundColor: '#fafafa',
        borderBottomLeftRadius: '12px',
        borderBottomRightRadius: '12px',
    },
    timelineLine: {
        position: 'absolute' as const,
        left: '27px',
        top: 0,
        bottom: 0,
        width: '2px',
        opacity: 0.2,
        zIndex: 0,
    },
    dropZone: {
        minHeight: '100px',
        padding: '1rem 1rem',
        position: 'relative' as const,
        zIndex: 1,
    },
    emptyState: {
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px dashed #dfe6e9',
        borderRadius: '8px',
        margin: '0 1rem 0 3rem',
        backgroundColor: 'white',
    },
    emptyText: {
        color: '#b2bec3',
        fontSize: '0.9rem',
    },
};

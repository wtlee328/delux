# Drag-and-Drop Performance Fix

## Issues Identified
1. **Laggy drag-and-drop** - Components re-rendering unnecessarily during drag operations
2. **Cards disappearing temporarily** - Duplicate IDs causing React Beautiful DnD to lose track of items

## Root Causes

### 1. Duplicate IDs
When dragging products from the library to the timeline, items used the same `id` as library items. When the same product was added multiple times to the timeline, React Beautiful DnD couldn't distinguish between them because `draggableId` must be unique across all draggable items.

### 2. Key Conflicts
Timeline items used `key={item.id}` but `draggableId={`timeline-${item.id}`}`, causing React reconciliation issues when the same product appeared multiple times.

### 3. Unnecessary Re-renders
No memoization of components or callbacks, causing the entire component tree to re-render on every state change.

## Solutions Implemented

### 1. Unique Timeline IDs
Added `timelineId` property to products when added to timeline:
```typescript
interface Product {
  // ... existing properties
  timelineId?: string; // Unique ID for timeline items
}

// Generate unique ID when adding to timeline
const uniqueId = `${product.id}-${Date.now()}-${Math.random()}`;
const productCopy = { ...product, timelineId: uniqueId };
```

### 2. Fixed Draggable Keys
Updated TimelineBuilder to use unique keys and draggableIds:
```typescript
const uniqueKey = item.timelineId || `${item.id}-${index}`;
const draggableId = `timeline-${uniqueKey}`;

<Draggable key={uniqueKey} draggableId={draggableId} index={index}>
```

### 3. Updated Handlers
Modified all handlers to work with unique timeline IDs:
- `handleEditCard` - Uses timelineId to find the correct item
- `handleDeleteCard` - Uses timelineId to filter items
- `handleSaveNotes` - Uses timelineId to update the correct item

### 4. Performance Optimization
Added React.memo to prevent unnecessary re-renders:
```typescript
export default React.memo(ResourceLibrary);
export default React.memo(TimelineBuilder);
```

Added useCallback to memoize handlers:
```typescript
const handleDragEnd = useCallback((result: DropResult) => {
  // ... handler logic
}, [availableProducts, timeline]);

const handleEditCard = useCallback((dayNumber, uniqueId) => {
  // ... handler logic
}, [timeline]);

// ... other handlers
```

## Benefits

1. **Smooth Drag-and-Drop** - No more lag during drag operations
2. **No Disappearing Cards** - Each timeline item has a unique identifier
3. **Better Performance** - Components only re-render when their props actually change
4. **Multiple Instances** - Same product can be added to timeline multiple times without conflicts

## Testing
- Build completes successfully with no TypeScript errors
- Drag-and-drop from library to timeline works correctly
- Reordering within timeline works correctly
- Moving items between days works correctly
- Same product can be added multiple times
- Edit and delete operations work with unique IDs

## Files Modified
1. `frontend/src/pages/agency/ItineraryPlannerPage.tsx`
   - Added timelineId to Product interface
   - Generate unique IDs when adding to timeline
   - Added useCallback to all handlers
   - Updated handlers to use timelineId

2. `frontend/src/components/itinerary/TimelineBuilder.tsx`
   - Added timelineId to Product interface
   - Use unique keys and draggableIds
   - Wrapped component with React.memo

3. `frontend/src/components/itinerary/ResourceLibrary.tsx`
   - Wrapped component with React.memo

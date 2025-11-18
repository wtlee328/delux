# Itinerary Timeline Redesign Specification

## Overview
Complete redesign of the timeline section to display travel days in vertical columns with a modern, minimalistic aesthetic inspired by the reference screenshot.

## Visual Design

### Layout Structure
- **3-Column Grid**: Shows exactly 3 days side-by-side at any time
- **Horizontal Scrolling**: Navigate through additional days using arrow buttons
- **Vertical Timeline**: Each day displays activities in a vertical timeline with a central line

### Color System
9 rotating pastel color themes for visual day differentiation:
1. **Pink** - `#FFB6C1` (primary), `#FFE4E9` (light), `#FF69B4` (dot)
2. **Mint Green** - `#98D8C8`, `#E8F5F1`, `#5FD3B3`
3. **Peach** - `#FFD4A3`, `#FFF4E6`, `#FFB347`
4. **Lavender** - `#B4A7D6`, `#E8E4F3`, `#9370DB`
5. **Sky Blue** - `#A8D8EA`, `#E3F2FD`, `#4FC3F7`
6. **Cream** - `#FFE5B4`, `#FFF8E7`, `#FFD54F`
7. **Rose** - `#D4A5A5`, `#F5E6E6`, `#CD5C5C`
8. **Light Green** - `#C5E1A5`, `#F1F8E9`, `#9CCC65`
9. **Coral** - `#FFCCBC`, `#FFF3E0`, `#FF8A65`

### Day Column Components

#### 1. Day Header
- **Day Label**: Large, bold "Day X" text in theme color
- **Date Display**: Format "MM/DD DayOfWeek" (e.g., "02/24 Mon")
- **Background**: Light pastel background matching day theme
- **Border**: 4px left border in primary theme color

#### 2. Timeline Content
- **Vertical Line**: 2px semi-transparent line running through the center
- **Activity Items**: Arranged vertically with consistent spacing
- **Drop Zone**: Highlights with theme color when dragging over

#### 3. Activity Card
Each activity displays:
- **Timeline Dot**: 14px circular marker on the vertical line
- **Icon**: 40px rounded square with theme background
  - 🏨 Accommodation
  - 🍽️ Food
  - 🎯 Activity
  - 🚗 Transportation
- **Title**: Activity name (truncated with ellipsis if too long)
- **Time**: Editable start time and duration
- **Actions**: Edit and delete buttons

## Interactive Features

### 1. Horizontal Navigation
```
← 前一天  |  顯示第 1-3 天（共 10 天）  |  下一天 →
```
- **Left Arrow**: Scroll to previous day (disabled at start)
- **Day Indicator**: Shows current visible range
- **Right Arrow**: Scroll to next day (disabled at end)

### 2. Inline Time Editing
**Display Mode:**
- Shows: "09:00 (60分鐘)" or "點擊設定時間"
- Click to enter edit mode

**Edit Mode:**
- Time input: `<input type="time">` for start time
- Duration input: Number input for minutes (step: 15)
- Auto-save on blur
- Fast, unobtrusive interaction

### 3. Drag-and-Drop
**Features:**
- Drag activities within same day to reorder
- Drag activities across days to reschedule
- Visual feedback during drag:
  - Dragged item: 80% opacity, slight scale up
  - Drop zone: Background highlights with theme color
  - Timeline shifts smoothly to show drop position

**Implementation:**
- Uses React Beautiful DnD
- Unique `timelineId` for each activity instance
- Supports multiple instances of same product

## Data Structure

### Product Interface
```typescript
interface Product {
  id: string;
  title: string;
  productType: 'activity' | 'accommodation' | 'food' | 'transportation';
  timelineId?: string;        // Unique ID for timeline items
  startTime?: string;          // Format: "HH:mm"
  duration?: number;           // Duration in minutes
  notes?: string;
  // ... other fields
}
```

### TimelineDay Interface
```typescript
interface TimelineDay {
  dayNumber: number;
  items: Product[];
  date?: string;               // Format: "MM/DD"
  dayOfWeek?: string;          // e.g., "Mon", "Tue"
}
```

## Component Props

### TimelineBuilder Props
```typescript
interface TimelineBuilderProps {
  timeline: TimelineDay[];
  onEditCard?: (dayNumber: number, itemId: string) => void;
  onDeleteCard?: (dayNumber: number, itemId: string) => void;
  onAddDay?: () => void;
  onUpdateTime?: (dayNumber: number, itemId: string, startTime: string, duration: number) => void;
}
```

## Responsive Design

### Desktop (Default)
- 3-column grid layout
- Full navigation controls
- Comfortable spacing

### Tablet (Future Enhancement)
- 2-column grid layout
- Adjusted spacing
- Maintained functionality

### Mobile (Future Enhancement)
- Single column layout
- Swipe gestures for navigation
- Compact card design

## Performance Optimizations

1. **React.memo**: Component wrapped to prevent unnecessary re-renders
2. **useCallback**: All handlers memoized
3. **Unique Keys**: Each activity has unique `timelineId`
4. **Smooth Transitions**: CSS transitions for all interactive states

## User Experience Enhancements

### Visual Feedback
- **Hover States**: Subtle opacity changes on interactive elements
- **Drag States**: Clear visual indication of dragging
- **Drop Zones**: Highlighted areas show valid drop positions
- **Loading States**: Smooth transitions when adding/removing items

### Accessibility
- **Keyboard Navigation**: All interactive elements keyboard accessible
- **ARIA Labels**: Proper labeling for screen readers
- **Focus States**: Clear focus indicators
- **Color Contrast**: Meets WCAG AA standards

## Future Enhancements

### Phase 2
1. **Auto-scheduling**: Suggest optimal activity times based on duration
2. **Time Conflicts**: Visual warnings for overlapping activities
3. **Travel Time**: Calculate and display travel time between activities
4. **Templates**: Save and reuse common day structures

### Phase 3
1. **Collaborative Editing**: Real-time updates for multiple users
2. **AI Suggestions**: Smart activity recommendations
3. **Budget Tracking**: Display costs per day
4. **Weather Integration**: Show weather forecasts per day

## Testing Checklist

- [ ] Drag activity within same day
- [ ] Drag activity across days
- [ ] Edit activity time inline
- [ ] Navigate between day groups
- [ ] Add new day
- [ ] Delete activity
- [ ] Edit activity notes
- [ ] Empty state display
- [ ] Color themes cycle correctly
- [ ] Responsive layout (desktop)
- [ ] Performance with 10+ days
- [ ] Performance with 20+ activities per day

## Files Modified

1. **frontend/src/components/itinerary/TimelineBuilder.tsx**
   - Complete redesign with vertical column layout
   - Added inline time editing
   - Implemented 3-day viewport with navigation
   - Added pastel color themes

2. **frontend/src/pages/agency/ItineraryPlannerPage.tsx**
   - Updated Product interface with time fields
   - Updated TimelineDay interface with date fields
   - Added `handleUpdateTime` callback
   - Passed new props to TimelineBuilder

## Design Principles

1. **Minimalism**: Clean, uncluttered interface
2. **Visual Hierarchy**: Clear distinction between days and activities
3. **Consistency**: Uniform spacing and styling throughout
4. **Feedback**: Immediate visual response to all interactions
5. **Efficiency**: Quick access to common actions
6. **Flexibility**: Easy to add, remove, and reorganize activities

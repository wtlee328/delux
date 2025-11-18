# Timeline Visual Design Guide

## Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  ← 前一天    顯示第 1-3 天（共 10 天）    下一天 →              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│  │  Day 7   │    │  Day 8   │    │  Day 9   │                  │
│  │ 02/24 Mon│    │ 02/25 Tue│    │ 02/26 Wed│                  │
│  ├──────────┤    ├──────────┤    ├──────────┤                  │
│  │    │     │    │    │     │    │    │     │                  │
│  │    ●─────│    │    ●─────│    │    ●─────│                  │
│  │    │ 🏨  │    │    │ 🏨  │    │    │ 🏨  │                  │
│  │    │Hotel│    │    │Hotel│    │    │Casa │                  │
│  │    │09:00│    │    │09:00│    │    │09:00│                  │
│  │    │     │    │    │     │    │    │     │                  │
│  │    ●─────│    │    ●─────│    │    ●─────│                  │
│  │    │ 🍽️  │    │    │ 🚗  │    │    │ 🎯  │                  │
│  │    │Food │    │    │Trans│    │    │Tour │                  │
│  │    │12:00│    │    │10:00│    │    │10:30│                  │
│  │    │     │    │    │     │    │    │     │                  │
│  │    ●─────│    │    ●─────│    │    ●─────│                  │
│  │    │ 🎯  │    │    │ 🎯  │    │    │ 🍽️  │                  │
│  │    │Tour │    │    │Visit│    │    │Lunch│                  │
│  │    │14:00│    │    │13:00│    │    │12:30│                  │
│  │    │     │    │    │     │    │    │     │                  │
│  └──────────┘    └──────────┘    └──────────┘                  │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                      + 新增一天                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Color Theme Examples

### Day 7 (Pink Theme)
```
Header Background: #FFE4E9 (light pink)
Header Text: #FFB6C1 (pink)
Border: #FFB6C1 (pink)
Timeline Dot: #FF69B4 (hot pink)
Icon Background: #FFE4E9 (light pink)
```

### Day 8 (Mint Green Theme)
```
Header Background: #E8F5F1 (light mint)
Header Text: #98D8C8 (mint)
Border: #98D8C8 (mint)
Timeline Dot: #5FD3B3 (teal)
Icon Background: #E8F5F1 (light mint)
```

### Day 9 (Peach Theme)
```
Header Background: #FFF4E6 (light peach)
Header Text: #FFD4A3 (peach)
Border: #FFD4A3 (peach)
Timeline Dot: #FFB347 (orange)
Icon Background: #FFF4E6 (light peach)
```

## Activity Card Anatomy

```
┌─────────────────────────────────────┐
│  ●  ┌────┐  Activity Title          │
│  │  │ 🏨 │  09:00 (60分鐘)          │
│  │  └────┘  ✏️ 🗑️                   │
└─────────────────────────────────────┘
 │
 └─ Timeline dot (14px, theme color)
    └─ Icon (40px rounded square)
       └─ Title (truncated if long)
          └─ Time (clickable to edit)
             └─ Action buttons
```

## Interactive States

### Normal State
```
Activity Card:
- Background: white
- Border: 1px solid #f0f0f0
- Cursor: grab
```

### Hover State
```
Activity Card:
- Background: white
- Border: 1px solid #e0e0e0
- Cursor: grab
- Action buttons: opacity 1.0
```

### Dragging State
```
Activity Card:
- Opacity: 0.8
- Transform: scale(1.02)
- Box-shadow: enhanced
- Cursor: grabbing
```

### Drop Zone Active
```
Timeline Content:
- Background: theme light color
- Border: theme primary color
- Smooth transition
```

## Time Editing Interface

### Display Mode
```
┌─────────────────────┐
│ 09:00 (60分鐘)      │ ← Click to edit
└─────────────────────┘
```

### Edit Mode
```
┌──────┬────────┐
│ 09:00│ 60 min │ ← Time picker + Duration input
└──────┴────────┘
```

## Spacing & Typography

### Spacing
- Column gap: 1.5rem (24px)
- Activity margin: 1.5rem (24px)
- Card padding: 0.75rem (12px)
- Icon size: 40px × 40px
- Timeline dot: 14px diameter

### Typography
- Day title: 1.5rem, weight 600
- Day date: 0.9rem, weight 500
- Activity title: 0.95rem, weight 600
- Activity time: 0.8rem, weight 400
- Navigation: 0.9rem, weight 500

## Icon Mapping

```
🏨 - Accommodation (Hotels, Hostels, Airbnb)
🍽️ - Food (Restaurants, Cafes, Meals)
🎯 - Activity (Tours, Attractions, Museums)
🚗 - Transportation (Cars, Buses, Trains)
📍 - Default (Other/Unspecified)
```

## Responsive Breakpoints (Future)

### Desktop (> 1024px)
- 3 columns
- Full navigation
- Comfortable spacing

### Tablet (768px - 1024px)
- 2 columns
- Compact navigation
- Reduced spacing

### Mobile (< 768px)
- 1 column
- Swipe navigation
- Minimal spacing
- Stacked layout
```

## Animation Timings

```css
Transitions:
- Background color: 0.2s ease
- Transform: 0.2s ease
- Opacity: 0.2s ease
- Box-shadow: 0.2s ease

Drag animations:
- Smooth reflow
- No jarring movements
- Maintain visual continuity
```

## Accessibility Features

### Keyboard Navigation
- Tab through activities
- Enter to edit time
- Escape to cancel edit
- Arrow keys for navigation

### Screen Reader Support
- Day headers announced
- Activity count per day
- Time information read
- Action buttons labeled

### Focus Indicators
- 2px solid outline
- Theme color
- Visible on all interactive elements

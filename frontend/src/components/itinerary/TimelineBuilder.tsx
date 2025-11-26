import React from 'react';
import { TimelineContainer } from './TimelineContainer';
import { Product, TimelineDay } from '../../types/itinerary';

interface TimelineBuilderProps {
  timeline: TimelineDay[];
  onEditCard?: (dayNumber: number, itemId: string) => void;
  onDeleteCard?: (dayNumber: number, itemId: string) => void;
  onAddDay?: () => void;
  onUpdateTime?: (dayNumber: number, itemId: string, startTime: string, duration: number) => void;
  onPreview?: (product: Product) => void;
}

const TimelineBuilder: React.FC<TimelineBuilderProps> = ({
  timeline,
  onEditCard,
  onDeleteCard,
  onAddDay,
  onUpdateTime,
  onPreview,
}) => {
  return (
    <TimelineContainer
      timeline={timeline}
      onTimeUpdate={(day, item, time, dur) => onUpdateTime?.(day, item, time, dur)}
      onDelete={(day, item) => onDeleteCard?.(day, item)}
      onEdit={(day, item) => onEditCard?.(day, item)}
      onPreview={onPreview || (() => { })}
      onAddDay={onAddDay}
    />
  );
};

export default TimelineBuilder;

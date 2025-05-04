import React, { useState } from 'react';
import { format, isSameDay, getHours, getMinutes, set } from 'date-fns';
import { useEvents } from '../../context/EventContext';
import NewEventPopover from '../NewEventPopover';

interface DayViewProps {
  currentDate: Date;
}

const DayView: React.FC<DayViewProps> = ({ currentDate }) => {
  const { events, setSelectedEvent } = useEvents();
  const [newEventDate, setNewEventDate] = useState<Date | null>(null);
  const [newEventPosition, setNewEventPosition] = useState({ x: 0, y: 0 });
  
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const handleTimeSlotClick = (hour: number, e: React.MouseEvent) => {
    const selectedDate = set(currentDate, { hours: hour, minutes: 0, seconds: 0 });
    setNewEventDate(selectedDate);
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setNewEventPosition({ 
      x: rect.left + rect.width / 2, 
      y: rect.top + rect.height / 2
    });
  };

  const handleEventClick = (event: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
  };

  const getEventPosition = (event: any) => {
    const startHour = getHours(event.start);
    const startMinute = getMinutes(event.start);
    const endHour = getHours(event.end);
    const endMinute = getMinutes(event.end);
    
    const top = (startHour + startMinute / 60) * 60; // 60px per hour
    const height = ((endHour + endMinute / 60) - (startHour + startMinute / 60)) * 60;
    
    return { top, height };
  };

  const closeNewEventPopover = () => {
    setNewEventDate(null);
  };

  const dayEvents = events.filter(event => 
    isSameDay(event.start, currentDate) && !event.allDay
  );

  const allDayEvents = events.filter(event => 
    isSameDay(event.start, currentDate) && event.allDay
  );

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 p-4 text-center bg-white">
        <h2 className="text-xl font-semibold">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h2>
      </div>
      
      {allDayEvents.length > 0 && (
        <div className="border-b border-gray-200 p-2 bg-gray-50">
          <div className="text-xs font-medium text-gray-500 mb-1">ALL DAY</div>
          <div className="space-y-1">
            {allDayEvents.map(event => (
              <div
                key={event.id}
                className="text-sm p-1 rounded cursor-pointer"
                style={{ backgroundColor: event.color || '#4f46e5', color: 'white' }}
                onClick={(e) => handleEventClick(event, e)}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex-grow overflow-y-auto relative">
        <div className="grid grid-cols-24 relative" style={{ height: `${24 * 60}px` }}>
          {hours.map(hour => (
            <div 
              key={hour} 
              className="col-span-24 border-b border-gray-200 relative" 
              style={{ height: '60px' }}
              onClick={(e) => handleTimeSlotClick(hour, e)}
            >
              <div className="absolute -top-2.5 left-2 text-xs text-gray-500">
                {hour}:00
              </div>
            </div>
          ))}
          
          {/* Events */}
          {dayEvents.map(event => {
            const { top, height } = getEventPosition(event);
            return (
              <div 
                key={event.id}
                className="absolute rounded overflow-hidden cursor-pointer z-10"
                style={{ 
                  backgroundColor: event.color || '#4f46e5',
                  color: 'white',
                  top: `${top}px`,
                  height: `${Math.max(height, 20)}px`,
                  left: '100px',
                  right: '16px',
                }}
                onClick={(e) => handleEventClick(event, e)}
              >
                <div className="p-2 h-full">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-xs opacity-90">
                    {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                  </div>
                  {event.description && (
                    <div className="text-xs mt-1 opacity-90 overflow-hidden text-ellipsis">
                      {event.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {newEventDate && (
        <NewEventPopover 
          date={newEventDate} 
          position={newEventPosition}
          onClose={closeNewEventPopover}
        />
      )}
    </div>
  );
};

export default DayView;
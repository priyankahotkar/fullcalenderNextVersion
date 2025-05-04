import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, addDays, isSameDay, isToday, getHours, getMinutes, set } from 'date-fns';
import { useEvents } from '../../context/EventContext';
import NewEventPopover from '../NewEventPopover';

interface WeekViewProps {
  currentDate: Date;
}

const WeekView: React.FC<WeekViewProps> = ({ currentDate }) => {
  const { events, setSelectedEvent } = useEvents();
  const [newEventDate, setNewEventDate] = useState<Date | null>(null);
  const [newEventPosition, setNewEventPosition] = useState({ x: 0, y: 0 });
  
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handleTimeSlotClick = (day: Date, hour: number, e: React.MouseEvent) => {
    const selectedDate = set(day, { hours: hour, minutes: 0, seconds: 0 });
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

  const getDayClass = (day: Date) => {
    return `border-l border-r border-gray-200 ${isToday(day) ? 'bg-blue-50' : 'bg-white'}`;
  };

  const closeNewEventPopover = () => {
    setNewEventDate(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-8 border-b border-gray-200">
        <div className="p-2 text-center text-gray-500 text-sm">GMT</div>
        {days.map((day, index) => (
          <div 
            key={index} 
            className={`p-2 text-center ${isToday(day) ? 'bg-blue-50 font-semibold' : ''}`}
          >
            <div className="text-gray-500 text-sm">{format(day, 'EEE')}</div>
            <div className={`text-base ${isToday(day) ? 'text-blue-600' : 'text-gray-800'}`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex-grow overflow-y-auto relative">
        <div className="grid grid-cols-8 relative" style={{ height: `${24 * 60}px` }}>
          {hours.map(hour => (
            <React.Fragment key={hour}>
              <div className="border-b border-gray-200 text-xs text-right text-gray-500 pr-2" style={{ height: '60px' }}>
                {hour}:00
              </div>
              {days.map((day, dayIndex) => (
                <div 
                  key={`${hour}-${dayIndex}`} 
                  className={`border-b border-gray-200 ${getDayClass(day)}`}
                  style={{ height: '60px' }}
                  onClick={(e) => handleTimeSlotClick(day, hour, e)}
                />
              ))}
            </React.Fragment>
          ))}
          
          {/* Events */}
          {events.filter(event => !event.allDay).map(event => {
            for (let i = 0; i < 7; i++) {
              const day = addDays(weekStart, i);
              if (isSameDay(event.start, day)) {
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
                      left: `${(i + 1) * (100 / 8) + 0.5}%`,
                      width: `${100 / 8 - 1}%`,
                    }}
                    onClick={(e) => handleEventClick(event, e)}
                  >
                    <div className="p-1 text-xs truncate">
                      {event.title}
                    </div>
                  </div>
                );
              }
            }
            return null;
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

export default WeekView;
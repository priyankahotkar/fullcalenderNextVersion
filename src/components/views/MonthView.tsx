import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isToday, isSameMonth, isSameDay } from 'date-fns';
import { useEvents } from '../../context/EventContext';
import NewEventPopover from '../NewEventPopover';

interface MonthViewProps {
  currentDate: Date;
  onUserSearch?: (date: Date, position: { x: number; y: number }) => void;
}

const MonthView: React.FC<MonthViewProps> = (props) => {
  const { currentDate, onUserSearch } = props;
  const { events, setSelectedEvent } = useEvents();
  const [newEventDate, setNewEventDate] = useState<Date | null>(null);
  const [newEventPosition, setNewEventPosition] = useState({ x: 0, y: 0 });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const isValidDate = (date: any): date is Date => {
    return date instanceof Date && !Number.isNaN(date.getTime());
  };

  const handleDayClick = (date: Date, e: React.MouseEvent) => {
    // Set position for new event popover
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setNewEventPosition({ 
      x: rect.left + rect.width / 2, 
      y: rect.top + rect.height / 2
    });
    setNewEventDate(date);
  };

  const handleUserSearch = (date: Date, e: React.MouseEvent) => {
    if (onUserSearch) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      onUserSearch(date, { 
        x: rect.left + rect.width / 2, 
        y: rect.top + rect.height / 2
      });
    }
  };

  const handleEventClick = (event: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
  };

  const getDayClass = (day: Date) => {
    let classes = "relative h-32 border border-gray-200 p-1 ";
    
    if (!isSameMonth(day, monthStart)) {
      classes += "bg-gray-50 text-gray-400 ";
    } else {
      classes += "bg-white ";
    }
    
    if (isToday(day)) {
      classes += "bg-blue-50 ";
    }
    
    return classes;
  };

  const renderDays = () => {
    const days = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < daysOfWeek.length; i++) {
      days.push(
        <div key={`header-${i}`} className="font-medium text-center py-2 border-b border-gray-200">
          {daysOfWeek[i]}
        </div>
      );
    }
    
    return days;
  };

  const renderCells = () => {
    const rows = [];
    let days = [];
    let day = calendarStart;
    let rowCounter = 0;
    
    while (day <= calendarEnd) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const dayEvents = events.filter(event => {
          if (!isValidDate(event.start)) {
            return false;
          }

          if (event.allDay) {
            // For all-day events, check if the event spans the current day
            if (!event.end || !isValidDate(event.end)) {
              // If no end date or invalid end date, just check start date
              return isSameDay(event.start, currentDay);
            }
            // Check if the current day is between start and end dates
            return (
              (event.start <= currentDay && event.end >= currentDay) ||
              isSameDay(event.start, currentDay) ||
              isSameDay(event.end, currentDay)
            );
          }

          // For non-all-day events, just check the start date
          return isSameDay(event.start, currentDay);
        });
        
        days.push(
          <div
            key={`day-${currentDay.toISOString()}`}
            className={getDayClass(currentDay)}
            onClick={(e) => handleDayClick(currentDay, e)}
          >
            <div className="absolute top-1 right-1 flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUserSearch(currentDay, e);
                }}
                className="text-xs bg-blue-100 hover:bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center"
                title="Search Users"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
            <div className="text-right mb-1">
              <span className={`text-sm ${isToday(currentDay) ? 'font-bold' : ''}`}>
                {format(currentDay, 'd')}
              </span>
            </div>
            <div className="overflow-y-auto max-h-[80%] space-y-1">
              {dayEvents.slice(0, 3).map((event, index) => (
                <div
                  key={`${currentDay.toISOString()}-${event.id}-${index}`}
                  className="text-xs p-1 rounded truncate cursor-pointer"
                  style={{ backgroundColor: event.color || '#4f46e5', color: 'white' }}
                  onClick={(e) => handleEventClick(event, e)}
                >
                  {event.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500 pl-1">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        );
        
        day = addDays(day, 1);
      }
      
      rows.push(
        <div key={`row-${rowCounter++}`} className="grid grid-cols-7">
          {days}
        </div>
      );
      
      days = [];
    }
    
    return rows;
  };

  const closeNewEventPopover = () => {
    setNewEventDate(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-7 bg-gray-50">
        {renderDays()}
      </div>
      <div className="flex-grow overflow-y-auto">
        {renderCells()}
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

export default MonthView;
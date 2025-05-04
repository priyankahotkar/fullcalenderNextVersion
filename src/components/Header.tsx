import { FC, ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { ViewType } from '../types';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';

interface HeaderProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  children?: React.ReactNode;
}

const Header: FC<HeaderProps> = ({ 
  currentView, 
  setCurrentView, 
  currentDate, 
  setCurrentDate,
  children 
}) => {
  const handlePrev = () => {
    switch (currentView) {
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (currentView) {
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getFormattedDate = () => {
    switch (currentView) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week':
        return `Week of ${format(currentDate, 'MMM d, yyyy')}`;
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      default:
        return '';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <CalendarIcon className="h-8 w-8 text-blue-600 mr-2" />
            <h1 className="text-xl font-bold text-gray-800">FullCalendar</h1>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex mr-4">
              <button 
                onClick={handleToday}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Today
              </button>
              <div className="flex items-center ml-2">
                <button 
                  onClick={handlePrev}
                  className="p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-500" />
                </button>
                <button 
                  onClick={handleNext}
                  className="p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ml-1"
                >
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <h2 className="text-lg font-semibold text-gray-800 mr-4">
              {getFormattedDate()}
            </h2>
            
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setCurrentView('month')}
                className={`px-3 py-1 text-sm font-medium ${
                  currentView === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
              >
                Month
              </button>
              <button
                onClick={() => setCurrentView('week')}
                className={`px-3 py-1 text-sm font-medium ${
                  currentView === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
              >
                Week
              </button>
              <button
                onClick={() => setCurrentView('day')}
                className={`px-3 py-1 text-sm font-medium ${
                  currentView === 'day'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
              >
                Day
              </button>
            </div>
          </div>
        </div>
      </div>
      {children && (
        <div className="flex justify-end items-center mt-2 px-4">
          {children}
        </div>
      )}
    </header>
  );
};

export default Header;
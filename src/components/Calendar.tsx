import React, { useState, useEffect } from 'react';
import { ViewType, User } from '../types';
import MonthView from './views/MonthView';
import WeekView from './views/WeekView';
import DayView from './views/DayView';
import EventModal from './EventModal';
import ChatBox from './ChatBox';
import MessagesSection from './MessagesSection';
import { useEvents } from '../context/EventContext';
import { useChat } from '../context/ChatContext';
import { MessageCircle, X } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface CalendarProps {
  view: ViewType;
  currentDate: Date;
}

const Calendar: React.FC<CalendarProps> = React.memo(({ view, currentDate }) => {
  const { events, selectedEvent, setSelectedEvent, selectedParticipant, setSelectedParticipant } = useEvents();
  const { unreadMessages, newMessageUser, clearNewMessageUser } = useChat();
  const [newEventDate, setNewEventDate] = useState<Date | null>(null);
  const [newEventPosition, setNewEventPosition] = useState({ x: 0, y: 0 });
  const [showMessagesSection, setShowMessagesSection] = useState(false);

  useEffect(() => {
    if (newMessageUser && newMessageUser.userData) {
      console.log('Calendar: New message user detected, opening ChatBox for:', newMessageUser.userId);
      setSelectedParticipant(newMessageUser.userData);
      clearNewMessageUser();
    }
  }, [newMessageUser, setSelectedParticipant, clearNewMessageUser]);

  const wrappedSetSelectedEvent = (event: any) => {
    console.log('setSelectedEvent called with:', event, new Error().stack);
    setSelectedEvent(event);
  };

  const renderView = () => {
    switch (view) {
      case 'month':
        return <MonthView currentDate={currentDate} />;
      case 'week':
        return <WeekView currentDate={currentDate} />;
      case 'day':
        return <DayView currentDate={currentDate} />;
      default:
        return <MonthView currentDate={currentDate} />;
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow overflow-hidden h-[calc(100vh-130px)] relative"
      onClick={(e) => {
        console.log('Calendar container clicked:', e.target);
        if (selectedParticipant && !e.target.closest('.fixed.bottom-4.right-4') && !e.target.closest('.fixed.top-4.right-4')) {
          console.log('Calendar: Preserving ChatBox');
          return;
        }
      }}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          console.log('View container clicked, propagation stopped');
        }}
      >
        {renderView()}
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowMessagesSection(!showMessagesSection);
        }}
        className="fixed top-4 right-4 z-[1000] p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
        title="Toggle Messages"
      >
        <MessageCircle className="h-5 w-5" />
        {Object.values(unreadMessages).reduce((sum, count) => sum + count, 0) > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {Object.values(unreadMessages).reduce((sum, count) => sum + count, 0)}
          </span>
        )}
      </button>
      {showMessagesSection && (
        <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-lg z-[1000] overflow-y-auto">
          <MessagesSection />
        </div>
      )}
      {selectedEvent && <EventModal />}
      {selectedParticipant && (
        <div className="fixed bottom-4 right-4 z-[1000]">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Closing ChatBox from Calendar');
              setSelectedParticipant(null);
            }}
            className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 z-10"
            title="Close Chat"
          >
            <X className="h-5 w-5" />
          </button>
          <ChatBox
            otherUser={selectedParticipant}
            unreadCount={unreadMessages[selectedParticipant.id] || 0}
            onClose={() => {
              console.log('ChatBox onClose triggered from Calendar');
              setSelectedParticipant(null);
            }}
          />
        </div>
      )}
      <ToastContainer />
    </div>
  );
});

export default Calendar;
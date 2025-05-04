import React, { useState, useEffect, useRef, useMemo } from 'react';
import { doc, getDoc, getFirestore, updateDoc, setDoc } from 'firebase/firestore';
import { MessageCircle, X } from 'lucide-react';
import { User, CalendarEvent } from '../types';
import { getAuth } from 'firebase/auth';
import { useEvents } from '../context/EventContext';
import { format } from 'date-fns';

const EventModal: React.FC = () => {
  const { selectedEvent, updateEvent, deleteEvent, setSelectedEvent, setSelectedParticipant } = useEvents();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState('#4f46e5');
  const [participantDetails, setParticipantDetails] = useState<{ [key: string]: User }>({});
  const popoverRef = useRef<HTMLDivElement>(null);

  console.log('EventModal rendered, selectedEvent:', selectedEvent);

  useEffect(() => {
    console.log('EventModal mounted, selectedEvent:', selectedEvent);
    const fetchParticipantDetails = async () => {
      if (selectedEvent && selectedEvent.participants && selectedEvent.participants.length > 0) {
        const db = getFirestore();
        const participantMap: { [key: string]: User } = {};

        for (const participantId of selectedEvent.participants) {
          try {
            const userRef = doc(db, 'users', participantId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              participantMap[participantId] = {
                id: participantId,
                ...userSnap.data()
              } as User;
            } else {
              console.warn(`Participant ${participantId} not found in Firestore`);
              participantMap[participantId] = {
                id: participantId,
                email: 'Unknown',
                displayName: 'Unknown User'
              } as User;
            }
          } catch (error) {
            console.error(`Error fetching participant ${participantId}:`, error);
            participantMap[participantId] = {
              id: participantId,
              email: 'Error',
              displayName: 'Error Fetching User'
            } as User;
          }
        }

        setParticipantDetails(participantMap);
        console.log('Participant details fetched:', participantMap);
      } else {
        setParticipantDetails({});
      }
    };

    if (selectedEvent) {
      setTitle(selectedEvent.title);
      setDescription(selectedEvent.description || '');
      setStartDate(format(selectedEvent.start, 'yyyy-MM-dd'));
      setStartTime(format(selectedEvent.start, 'HH:mm'));
      setEndDate(format(selectedEvent.end, 'yyyy-MM-dd'));
      setEndTime(format(selectedEvent.end, 'HH:mm'));
      setAllDay(selectedEvent.allDay || false);
      setColor(selectedEvent.color || '#4f46e5');
      fetchParticipantDetails();
    }

    return () => {
      console.log('EventModal unmounting, selectedEvent:', selectedEvent);
    };
  }, [selectedEvent]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      console.log('Click target:', target);
      if (popoverRef.current && !popoverRef.current.contains(target)) {
        console.log('Click outside detected, closing modal');
        setSelectedEvent(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      console.log('Removing click outside listener');
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setSelectedEvent]);

  const memoizedParticipantDetails = useMemo(() => participantDetails, [participantDetails]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedEvent) return;

    const startDateTime = new Date(`${startDate}T${allDay ? '00:00' : startTime}`);
    const endDateTime = new Date(`${endDate}T${allDay ? '23:59' : endTime}`);

    if (startDateTime >= endDateTime) {
      alert('End date/time must be after start date/time');
      return;
    }

    const handleUpdate = async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser) {
        const updatedEvent: CalendarEvent = {
          id: selectedEvent.id,
          title,
          description,
          start: startDateTime,
          end: endDateTime,
          allDay,
          color,
          userId: selectedEvent.userId,
          participants: selectedEvent.participants || []
        };

        try {
          await updateEvent(updatedEvent, currentUser);
          setSelectedEvent(null);
        } catch (error) {
          console.error('Error updating event:', error);
          alert('Failed to update event');
        }
      } else {
        console.error('User must be logged in to update an event');
        alert('Please log in to update the event');
      }
    };

    handleUpdate();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (selectedEvent && currentUser) {
      try {
        deleteEvent(selectedEvent.id, currentUser);
        setSelectedEvent(null);
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event');
      }
    } else {
      console.error('User must be logged in to delete an event');
      alert('Please log in to delete the event');
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Closing modal via close button');
    setSelectedEvent(null);
  };

  const handleChatClick = (participant: User) => {
    console.log('Chat icon clicked for participant:', participant);
    setSelectedParticipant(participant);
  };

  const handleScheduleMeeting = async () => {
    if (!selectedEvent) return;

    try {
      // Generate a unique Jitsi Meet link
      const meetingLink = `https://meet.jit.si/${selectedEvent.id}`;

      // Ensure the event document exists and update it with the meeting link
      const db = getFirestore();
      const eventRef = doc(db, 'events', selectedEvent.id);
      const eventSnapshot = await getDoc(eventRef);

      if (eventSnapshot.exists()) {
        await updateDoc(eventRef, { meetingLink });
      } else {
        await setDoc(eventRef, { ...selectedEvent, meetingLink });
      }

      // Notify participants
      if (selectedEvent.participants) {
        for (const participantId of selectedEvent.participants) {
          const notificationRef = doc(db, 'users', participantId, 'notifications', selectedEvent.id);
          await setDoc(notificationRef, {
            type: 'meeting',
            message: `A meeting has been scheduled for the event: ${selectedEvent.title}.`,
            meetingLink,
            timestamp: new Date(),
          });
        }
      }

      // Open the meeting room directly
      window.open(meetingLink, '_blank');

      // Update the local state
      setSelectedEvent({ ...selectedEvent, meetingLink });

      console.log('Meeting scheduled successfully:', meetingLink);
      alert('Meeting link generated and saved successfully!');
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      alert('Failed to schedule meeting. Please try again.');
    }
  };

  if (!selectedEvent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
      <div ref={popoverRef} className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-lg font-medium text-gray-900">Event Details</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {Object.keys(memoizedParticipantDetails).length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Participants
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.values(memoizedParticipantDetails).map(participantInfo => (
                  <div
                    key={participantInfo.id}
                    className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                  >
                    {participantInfo.photoURL && (
                      <img
                        src={participantInfo.photoURL}
                        alt={participantInfo.displayName || 'User'}
                        className="w-6 h-6 rounded-full mr-2"
                      />
                    )}
                    <span className="mr-2">
                      {participantInfo.displayName || participantInfo.email}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleChatClick(participantInfo);
                      }}
                      className="text-green-500 hover:text-green-700"
                      title="Chat with participant"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedEvent?.meetingLink && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Link
              </label>
              <a
                href={selectedEvent.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {selectedEvent.meetingLink}
              </a>
            </div>
          )}

          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            {!allDay && (
              <div className="flex-1">
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            )}
          </div>

          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            {!allDay && (
              <div className="flex-1">
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            )}
          </div>

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="allDay"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="allDay" className="ml-2 block text-sm text-gray-700">
              All day event
            </label>
          </div>

          <div className="mb-6">
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex space-x-2">
              {['#4f46e5', '#0ea5e9', '#8b5cf6', '#ef4444', '#f97316', '#10b981'].map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`h-8 w-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    color === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Delete
            </button>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleScheduleMeeting}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Schedule Meeting
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default React.memo(EventModal);
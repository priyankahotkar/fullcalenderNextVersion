import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, getAuth, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { CalendarEvent, User as UserType } from '../types';
import { db, app } from '../firebaseConfig';

interface EventContextType {
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id' | 'userId'>, user: User) => Promise<void>;
  updateEvent: (event: CalendarEvent, user: User) => Promise<void>;
  deleteEvent: (id: string, user: User) => Promise<void>;
  selectedEvent: CalendarEvent | null;
  setSelectedEvent: (event: CalendarEvent | null) => void;
  selectedParticipant: UserType | null;
  setSelectedParticipant: (participant: UserType | null) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<UserType | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(getAuth(app), (user) => {
      console.log('Auth state changed, user:', user?.uid);
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    console.log('EventContext: selectedEvent changed:', selectedEvent);
  }, [selectedEvent]);

  useEffect(() => {
    console.log('EventContext: selectedParticipant changed:', selectedParticipant);
  }, [selectedParticipant]);

  useEffect(() => {
    if (!currentUser) {
      setEvents([]);
      return;
    }

    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('userId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log('Snapshot received. Total docs:', querySnapshot.docs.length);
      const eventMap = new Map<string, CalendarEvent>();

      querySnapshot.docs.forEach(doc => {
        const docData = doc.data() as CalendarEvent;
        const processedEvent = {
          ...docData,
          id: doc.id,
          start: docData.start instanceof Timestamp ? docData.start.toDate() : docData.start,
          end: docData.end instanceof Timestamp ? docData.end.toDate() : docData.end
        };

        const eventKey = `${processedEvent.title}-${processedEvent.start.getTime()}-${processedEvent.end.getTime()}`;
        if (!eventMap.has(eventKey)) {
          eventMap.set(eventKey, processedEvent);
          console.log('Added unique event:', eventKey);
        } else {
          console.log('Duplicate event skipped:', eventKey);
        }
      });

      const processedEvents = Array.from(eventMap.values());
      console.log('Processed events count:', processedEvents.length);

      setEvents(prevEvents => {
        if (
          processedEvents.length !== prevEvents.length ||
          processedEvents.some(newEvent => 
            !prevEvents.some(oldEvent => oldEvent.id === newEvent.id)
          )
        ) {
          console.log('Events updated');
          return processedEvents;
        }
        console.log('No events update needed');
        return prevEvents;
      });
    }, (error) => {
      console.error('Snapshot error:', error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  type EventInput = {
    title: string;
    start: Date;
    end: Date;
    description?: string;
    color?: string;
    allDay?: boolean;
    isRecurring?: boolean;
    visibility?: 'private' | 'public';
    tags?: string[];
    userId?: string;
  };

  const addEvent = async (event: EventInput & { participants?: string[] }, user: User) => {
    if (!user) throw new Error('User must be logged in to add an event');

    try {
      const completeEvent: Partial<CalendarEvent> = {
        id: '',
        title: event.title,
        start: event.start,
        end: event.end,
        userId: user.uid,
        participants: event.participants || [],
      };

      if (event.description) completeEvent.description = event.description;
      if (event.color) completeEvent.color = event.color;
      if (event.allDay !== undefined) completeEvent.allDay = event.allDay;
      if (event.isRecurring !== undefined) completeEvent.isRecurring = event.isRecurring;
      if (event.visibility) completeEvent.visibility = event.visibility;
      if (event.tags) completeEvent.tags = event.tags;

      const existingEvents = await getDocs(query(
        collection(db, 'events'),
        where('userId', '==', user.uid),
        where('title', '==', event.title),
        where('start', '==', event.start),
        where('end', '==', event.end)
      ));

      if (!existingEvents.empty) {
        console.warn('Event already exists');
        return;
      }

      const newEventRef = await addDoc(collection(db, 'events'), completeEvent);

      const newEvent: CalendarEvent = {
        ...(completeEvent as CalendarEvent),
        id: newEventRef.id,
      };

      setEvents((prevEvents) => [...prevEvents, newEvent]);
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  };

  const updateEvent = async (event: CalendarEvent, user: User) => {
    if (!user) throw new Error('User must be logged in to update an event');
    if (event.userId !== user.uid) throw new Error('User can only update their own events');

    try {
      const eventRef = doc(db, 'events', event.id);
      const { id, ...eventData } = event;
      await updateDoc(eventRef, {
        ...eventData,
        participants: eventData.participants || []
      });
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  const deleteEvent = async (id: string, user: User) => {
    if (!user) throw new Error('User must be logged in to delete an event');

    try {
      const eventRef = doc(db, 'events', id);
      await deleteDoc(eventRef);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };

  return (
    <EventContext.Provider value={{ 
      events, 
      addEvent, 
      updateEvent, 
      deleteEvent,
      selectedEvent,
      setSelectedEvent,
      selectedParticipant,
      setSelectedParticipant
    }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
}
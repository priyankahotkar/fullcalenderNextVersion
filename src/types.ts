export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  color?: string;
  allDay?: boolean;
  isRecurring?: boolean;
  visibility?: 'private' | 'public';
  tags?: string[];
  userId: string;
  participants?: string[];
}
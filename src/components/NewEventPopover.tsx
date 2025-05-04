import React, { useState, useEffect, useRef } from 'react';
import { format, addHours } from 'date-fns';
import { useEvents } from '../context/EventContext';
import { useUserSearch, SearchUser } from '../context/UserSearchContext';
import { getAuth } from 'firebase/auth';
import { X, Search, MessageCircle } from 'lucide-react';
import { getFirestore, collection, query, where, getDocs, doc } from 'firebase/firestore';
import ChatBox from './ChatBox';

interface NewEventPopoverProps {
  date: Date;
  position: { x: number; y: number };
  onClose: () => void;
}

const NewEventPopover: React.FC<NewEventPopoverProps> = ({ date, position, onClose }) => {
  const { addEvent } = useEvents();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#10b981');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [chatUser, setChatUser] = useState<SearchUser | null>(null);
  const { searchUsers } = useUserSearch();
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      const results = await searchUsers(searchTerm);
      setSearchResults(results);
    }
  };

  const handleUserSelect = (user: SearchUser) => {
    setSelectedUsers((prevUsers) => [...prevUsers, user]);
    setSearchTerm(user.displayName || user.email);
    setSearchResults([]);
  };

  const removeSelectedUser = (user: SearchUser) => {
    setSelectedUsers((prevUsers) => prevUsers.filter((u) => u.id !== user.id));
  };

  const handleSearchKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const results = await searchUsers(searchTerm);
      setSearchResults(results);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.error('User must be logged in to add an event');
      return;
    }

    try {
      const eventData = {
        title: selectedUsers.length > 0 
          ? `Meeting with ${selectedUsers.map((user) => user.displayName || user.email).join(', ')}`
          : title,
        description: selectedUsers.length > 0 
          ? `Scheduled meeting with ${selectedUsers.map((user) => user.email).join(', ')}`
          : description,
        start: date,
        end: addHours(date, 1),
        color,
        visibility: 'private',
        participants: selectedUsers.length > 0 ? selectedUsers.map((user) => user.id) : []
      };

      await addEvent(eventData, currentUser);

      onClose();
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const getPopoverStyle = () => {
    const popoverWidth = 300;
    const popoverHeight = 320;
    
    let x = position.x - popoverWidth / 2;
    let y = position.y;
    
    // Adjust for viewport boundaries
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (x < 10) x = 10;
    if (x + popoverWidth > viewportWidth - 10) x = viewportWidth - popoverWidth - 10;
    
    // Position above or below depending on space
    if (y + popoverHeight > viewportHeight - 10) {
      y = y - popoverHeight - 10; // Position above
    } else {
      y = y + 10; // Position below
    }
    
    return {
      top: `${y}px`,
      left: `${x}px`,
      width: `${popoverWidth}px`
    };
  };

  return (
    <div
      ref={popoverRef}
      className="fixed bg-white rounded-lg shadow-xl z-50 animate-fade-in"
      style={getPopoverStyle()}
    >
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-md font-medium text-gray-900">
          New Event on {format(date, 'MMM d, yyyy')} at {format(date, 'h:mm a')}
        </h3>
      </div>
      
      <form onSubmit={handleSubmit} className="p-3">
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedUsers.map((user) => (
            <div
              key={user.id}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center"
            >
              {user.displayName || user.email}
              <div className="flex items-center">
                <button
                  onClick={() => setChatUser(user)}
                  className="ml-2 text-green-500 hover:text-green-700"
                  title="Chat with user"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => removeSelectedUser(user)}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="relative mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setTitle(e.target.value);
            }}
            placeholder="Search for a user or enter event title"
            className="w-full px-3 py-2 border rounded-md"
            required
          />
          <button
            type="button"
            onClick={handleSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500"
          >
            <Search className="h-5 w-5" />
          </button>

          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                >
                  {user.photoURL && (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      className="w-8 h-8 rounded-full mr-3"
                    />
                  )}
                  <div>
                    <p className="font-medium">{user.displayName || user.email}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mb-3">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add description"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Users
          </label>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyPress}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="mb-4">
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
        
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Create
          </button>
        </div>
      </form>
      {chatUser && (
        <ChatBox 
          otherUser={chatUser} 
          onClose={() => setChatUser(null)} 
        />
      )}
    </div>
  );
};

export default NewEventPopover;
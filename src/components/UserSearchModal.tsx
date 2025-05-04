import React, { useState } from 'react';
import { useEvents } from '../context/EventContext';
import { useUserSearch, SearchUser } from '../context/UserSearchContext';
import { getAuth } from 'firebase/auth';
import { format, addHours } from 'date-fns';

interface UserSearchModalProps {
  date: Date;
  onClose: () => void;
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({ date, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);

  const { searchUsers } = useUserSearch();
  const { addEvent } = useEvents();

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      const results = await searchUsers(searchTerm);
      setSearchResults(results);
    }
  };

  const handleCreateMeetingEvent = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser || !selectedUser) return;

    try {
      // Create a meeting event
      await addEvent({
        title: `Meeting with ${selectedUser.displayName || selectedUser.email}`,
        description: `Scheduled meeting with ${selectedUser.email}`,
        start: date,
        end: addHours(date, 1),
        color: '#10b981', // Green color for meetings
        visibility: 'private',
        participants: []
      }, currentUser);

      // You could add additional logic here for creating a chat room or invitation
      onClose();
    } catch (error) {
      console.error('Error creating meeting event:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Search Users</h2>
        
        <div className="flex mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by email or name"
            className="flex-grow px-3 py-2 border rounded-l-md"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
          >
            Search
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Search Results</h3>
            {searchResults.map((user) => (
              <div 
                key={user.id}
                className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-gray-100 ${
                  selectedUser?.id === user.id ? 'bg-blue-100' : ''
                }`}
                onClick={() => setSelectedUser(user)}
              >
                {user.photoURL && (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-10 h-10 rounded-full mr-3"
                  />
                )}
                <div>
                  <p className="font-medium">{user.displayName || user.email}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedUser && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Selected User</h3>
            <div className="flex items-center">
              {selectedUser.photoURL && (
                <img 
                  src={selectedUser.photoURL} 
                  alt={selectedUser.displayName || 'User'} 
                  className="w-12 h-12 rounded-full mr-4"
                />
              )}
              <div>
                <p className="font-medium">{selectedUser.displayName || selectedUser.email}</p>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
            </div>
            <button
              onClick={handleCreateMeetingEvent}
              className="mt-4 w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600"
            >
              Create Meeting Event on {format(date, 'MMM d, yyyy')}
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full bg-gray-200 py-2 rounded-md hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default UserSearchModal;

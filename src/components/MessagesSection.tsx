import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { X } from 'lucide-react';
import { db } from '../firebaseConfig';
import { useEvents } from '../context/EventContext';
import { useChat } from '../context/ChatContext';
import { User } from '../types';

const MessagesSection: React.FC = () => {
  const { chatList, unreadMessages } = useChat();
  const { setSelectedParticipant } = useEvents();
  const [userDetails, setUserDetails] = useState<{ [key: string]: User }>({});

  useEffect(() => {
    const fetchUserDetails = async () => {
      const newDetails: { [key: string]: User } = {};
      for (const chat of chatList) {
        if (!userDetails[chat.otherUserId]) {
          try {
            const userRef = doc(db, 'users', chat.otherUserId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              newDetails[chat.otherUserId] = {
                id: chat.otherUserId,
                email: userSnap.data().email,
                displayName: userSnap.data().displayName,
                photoURL: userSnap.data().photoURL,
              };
            } else {
              newDetails[chat.otherUserId] = {
                id: chat.otherUserId,
                email: 'Unknown',
                displayName: 'Unknown User',
              };
            }
          } catch (error) {
            console.error('MessagesSection: Error fetching user:', chat.otherUserId, error);
            newDetails[chat.otherUserId] = {
              id: chat.otherUserId,
              email: 'Error',
              displayName: 'Error Fetching User',
            };
          }
        }
      }
      setUserDetails((prev) => ({ ...prev, ...newDetails }));
    };

    fetchUserDetails();
  }, [chatList]);

  const handleChatClick = (otherUserId: string) => {
    const user = userDetails[otherUserId];
    if (user) {
      setSelectedParticipant(user);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Messages</h2>
        <button
          onClick={() => setShowMessagesSection(false)}
          className="text-gray-400 hover:text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {chatList.length === 0 ? (
          <p className="p-4 text-gray-500">No chats yet.</p>
        ) : (
          chatList.map((chat) => (
            <div
              key={chat.otherUserId}
              onClick={() => handleChatClick(chat.otherUserId)}
              className="flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
            >
              {userDetails[chat.otherUserId]?.photoURL && (
                <img
                  src={userDetails[chat.otherUserId].photoURL}
                  alt={userDetails[chat.otherUserId].displayName || 'User'}
                  className="w-10 h-10 rounded-full mr-3"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">
                    {userDetails[chat.otherUserId]?.displayName ||
                      userDetails[chat.otherUserId]?.email}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {chat.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {chat.lastMessage.slice(0, 50)}
                  {chat.lastMessage.length > 50 ? '...' : ''}
                </p>
              </div>
              {unreadMessages[chat.otherUserId] > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadMessages[chat.otherUserId]}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MessagesSection;
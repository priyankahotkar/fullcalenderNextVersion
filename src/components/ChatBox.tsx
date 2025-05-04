import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Send } from 'lucide-react';
import { db } from '../firebaseConfig';
import { useChat } from '../context/ChatContext';
import { User } from '../types';
import { toast } from 'react-toastify';

interface ChatBoxProps {
  otherUser: User;
  unreadCount: number;
  onClose: () => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ otherUser, unreadCount, onClose }) => {
  const { messages, sendMessage, markChatAsRead } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  console.log('ChatBox mounted for user:', otherUser.id);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userRef = doc(db, 'users', otherUser.id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          console.log('ChatBox: User details fetched:', userSnap.data());
        } else {
          console.warn('ChatBox: User not found:', otherUser.id);
        }
      } catch (error) {
        console.error('ChatBox: Error fetching user details:', error);
      }
    };

    fetchUserDetails();
    console.log('ChatBox: Fetching messages for user:', otherUser.id);

    return () => {
      console.log('ChatBox unmounting, reason: effect cleanup');
    };
  }, [otherUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    console.log('ChatBox: Messages updated:', messages[otherUser.id]?.length);

    // Mark messages as read when new messages arrive
    if (unreadCount > 0) {
      const markAsRead = async () => {
        try {
          console.log('ChatBox: New messages detected, calling markChatAsRead');
          await markChatAsRead(otherUser.id);
          console.log('ChatBox: markChatAsRead completed for:', otherUser.id);
        } catch (error) {
          console.error('ChatBox: Error marking new messages as read:', error);
          toast.error('Failed to mark new messages as read');
        }
      };

      markAsRead();
    }
  }, [messages, otherUser.id, unreadCount]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    try {
      await sendMessage(otherUser.id, newMessage.trim(), currentUser);
      setNewMessage('');
      console.log('ChatBox: Message sent to:', otherUser.id);
    } catch (error) {
      console.error('ChatBox: Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const chatMessages = messages[otherUser.id] || [];

  return (
    <div className="w-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col h-[400px]">
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center">
          {otherUser.photoURL && (
            <img
              src={otherUser.photoURL}
              alt={otherUser.displayName || 'User'}
              className="w-8 h-8 rounded-full mr-2"
            />
          )}
          <span className="font-medium text-gray-900">
            {otherUser.displayName || otherUser.email}
          </span>
        </div>
        {unreadCount > 0 && (
          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
            {unreadCount} new message{unreadCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-2 flex ${msg.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-2 ${
                msg.senderId === currentUser?.uid
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p>{msg.message}</p>
              <p className="text-xs mt-1 opacity-70">
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200">
        <div className="flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!newMessage.trim()}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default React.memo(ChatBox);
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User as FirebaseUser, getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  getDocs,
} from 'firebase/firestore';
import { toast } from 'react-toastify';
import { db, app } from '../firebaseConfig';
import { User } from '../types';

interface Chat {
  otherUserId: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
}

interface NewMessageUser {
  userId: string;
  userData: User;
  message: string;
}

interface ChatContextType {
  messages: { [key: string]: any[] };
  chatList: Chat[];
  unreadMessages: { [key: string]: number };
  newMessageUser: NewMessageUser | null;
  showMessagesSection: boolean; // Add this
  setShowMessagesSection: (value: boolean) => void; // Add this
  sendMessage: (recipientId: string, message: string, sender: FirebaseUser) => Promise<void>;
  markChatAsRead: (otherUserId: string) => Promise<void>;
  clearNewMessageUser: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<{ [key: string]: any[] }>({});
  const [chatList, setChatList] = useState<Chat[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<{ [key: string]: number }>({});
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [newMessageUser, setNewMessageUser] = useState<NewMessageUser | null>(null);
  const [showMessagesSection, setShowMessagesSection] = useState(true); // Add this
  const [processedMessageIds, setProcessedMessageIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(getAuth(app), (user) => {
      console.log('ChatContext: Auth state changed, user:', user?.uid);
      setCurrentUser(user);
      if (!user) {
        setMessages({});
        setChatList([]);
        setUnreadMessages({});
        setNewMessageUser(null);
        setShowMessagesSection(true); // Reset visibility on logout
        setProcessedMessageIds(new Set());
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    console.log('ChatContext: Setting up snapshot listener for user:', currentUser.uid);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('ChatContext: Snapshot received, docs:', snapshot.docs.length);

      const newMessages: { [key: string]: any[] } = {};
      const chatMap: { [key: string]: Chat } = {};
      const newUnread: { [key: string]: number } = { ...unreadMessages };
      const notifications: { [key: string]: { message: string; userData: User | null } } = {};

      snapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const otherUserId = data.participants.find((id: string) => id !== currentUser.uid);
        if (!otherUserId) return;

        const chatKey = otherUserId;
        const message = {
          id: docSnapshot.id,
          senderId: data.senderId,
          recipientId: data.recipientId,
          message: data.message,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : data.timestamp,
          read: data.read || false,
        };

        if (!newMessages[chatKey]) {
          newMessages[chatKey] = [];
        }

        if (!newMessages[chatKey].some((msg) => msg.id === message.id)) {
          newMessages[chatKey].push(message);
        }

        if (!chatMap[chatKey]) {
          chatMap[chatKey] = {
            otherUserId,
            lastMessage: data.message,
            timestamp: message.timestamp,
            unreadCount: data.read ? 0 : (newUnread[chatKey] || 0) + (data.senderId !== currentUser.uid ? 1 : 0),
          };

          if (
            data.senderId !== currentUser.uid &&
            !data.read &&
            !processedMessageIds.has(docSnapshot.id)
          ) {
            console.log('ChatContext: Queuing notification for message:', docSnapshot.id, 'from:', otherUserId);
            notifications[otherUserId] = {
              message: data.message,
              userData: null,
            };
            if (!newUnread[chatKey]) {
              newUnread[chatKey] = 0;
            }
            newUnread[chatKey]++;
            setProcessedMessageIds((prev) => new Set(prev).add(docSnapshot.id));
          }
        }
      });

      const messagesChanged = Object.keys(newMessages).some(
        (key) =>
          !messages[key] ||
          newMessages[key].length !== messages[key].length ||
          newMessages[key].some(
            (msg, i) =>
              !messages[key][i] ||
              msg.id !== messages[key][i].id ||
              msg.message !== messages[key][i].message
          )
      );

      const chatListChanged =
        Object.keys(chatMap).length !== chatList.length ||
        Object.values(chatMap).some(
          (chat, i) =>
            !chatList[i] ||
            chat.otherUserId !== chatList[i].otherUserId ||
            chat.lastMessage !== chatList[i].lastMessage ||
            chat.timestamp.getTime() !== chatList[i].timestamp.getTime()
        );

      const unreadChanged = Object.keys(newUnread).some(
        (key) => newUnread[key] !== (unreadMessages[key] || 0)
      );

      if (messagesChanged) {
        console.log('ChatContext: Updating messages');
        setMessages(
          Object.keys(newMessages).reduce(
            (acc, key) => ({
              ...acc,
              [key]: newMessages[key].sort(
                (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
              ),
            }),
            {}
          )
        );
      }

      if (chatListChanged) {
        console.log('ChatContext: Updating chatList');
        setChatList(
          Object.values(chatMap).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        );
      }

      if (unreadChanged) {
        console.log('ChatContext: Updating unreadMessages:', newUnread);
        setUnreadMessages(newUnread);
      }

      if (Object.keys(notifications).length > 0) {
        console.log('ChatContext: Queuing notifications:', Object.keys(notifications));
        setNewMessageUser(null); // Clear previous to avoid duplicates
        Object.keys(notifications).forEach((otherUserId) => {
          markChatAsRead(otherUserId);
        });
        setNewMessageUser({
          userId: Object.keys(notifications)[0],
          userData: notifications[Object.keys(notifications)[0]].userData,
          message: notifications[Object.keys(notifications)[0]].message,
        });
      }
    }, (error) => {
      console.error('ChatContext: Snapshot error:', error);
    });

    return () => {
      console.log('ChatContext: Cleaning up snapshot listener');
      unsubscribe();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !newMessageUser) return;

    const processNotifications = async () => {
      try {
        const userRef = doc(db, 'users', newMessageUser.userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists()
          ? userSnap.data()
          : { displayName: 'Unknown', email: 'Unknown', id: newMessageUser.userId };

        console.log('ChatContext: Showing notification for:', newMessageUser.userId);
        toast.info(
          `New message from ${userData.displayName || userData.email}: ${newMessageUser.message.slice(0, 30)}${newMessageUser.message.length > 30 ? '...' : ''}`,
          {
            position: 'bottom-right',
            autoClose: 5000,
          }
        );

        // Update newMessageUser with fetched userData
        setNewMessageUser((prev) =>
          prev ? { ...prev, userData: { id: newMessageUser.userId, ...userData } } : null
        );
      } catch (error) {
        console.error('ChatContext: Error fetching user for notification:', newMessageUser.userId, error);
        toast.error('Failed to load user for notification');
      }
    };

    const timeout = setTimeout(processNotifications, 500);
    return () => clearTimeout(timeout);
  }, [newMessageUser, currentUser]);

  const sendMessage = async (recipientId: string, message: string, sender: FirebaseUser) => {
    if (!sender) throw new Error('User must be logged in to send a message');

    try {
      const chatData = {
        senderId: sender.uid,
        recipientId,
        message,
        timestamp: Timestamp.now(),
        participants: [sender.uid, recipientId],
        read: false,
      };

      await addDoc(collection(db, 'chats'), chatData);
      console.log('ChatContext: Message sent to:', recipientId);
    } catch (error) {
      console.error('ChatContext: Error sending message:', error);
      throw error;
    }
  };

  const markChatAsRead = async (otherUserId: string) => {
    if (!currentUser) {
      console.log('ChatContext: No current user, cannot mark chat as read');
      return;
    }

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', currentUser.uid),
      where('senderId', '==', otherUserId),
      where('read', '==', false)
    );

    try {
      const snapshot = await getDocs(q);
      console.log('ChatContext: Found unread messages for', otherUserId, ':', snapshot.docs.length);
      for (const docSnapshot of snapshot.docs) {
        console.log('ChatContext: Marking message as read:', docSnapshot.id);
        await updateDoc(doc(db, 'chats', docSnapshot.id), { read: true });
      }
      setUnreadMessages((prev) => {
        console.log('ChatContext: Updating unreadMessages for', otherUserId, 'to 0');
        return { ...prev, [otherUserId]: 0 };
      });
      console.log('ChatContext: Marked chat as read for:', otherUserId);
    } catch (error) {
      console.error('ChatContext: Error marking chat as read:', error);
      toast.error('Failed to update message status');
    }
  };

  const clearNewMessageUser = () => {
    console.log('ChatContext: Clearing newMessageUser');
    setNewMessageUser(null);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        chatList,
        unreadMessages,
        newMessageUser,
        showMessagesSection, // Add this
        setShowMessagesSection, // Add this
        sendMessage,
        markChatAsRead,
        clearNewMessageUser,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
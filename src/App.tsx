import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { app } from './firebaseConfig';
import { AuthButton } from './auth';
import Header from './components/Header';
import Calendar from './components/Calendar';
import { EventProvider } from './context/EventContext';
import { UserSearchProvider } from './context/UserSearchContext';
import { ChatProvider } from './context/ChatContext';
import ErrorBoundary from './components/ErrorBoundary';
import ChatBox from './components/ChatBox';
import { User } from './types';

const MainApp: React.FC<{ onChatUserSelect: (user: User | null) => void }> = ({ onChatUserSelect }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [currentView, setCurrentView] = useState<string>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="absolute top-4 right-4 flex items-center space-x-4">
        <AuthButton isSignedIn={!user} />
      </div>
      {user ? (
        <>
          <Header 
            currentView={currentView}
            setCurrentView={setCurrentView}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
          >
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <p className="text-sm font-medium text-gray-700">
                  {user.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-500">
                  {user.email}
                </p>
              </div>
              <img 
                src={user.photoURL || ''} 
                alt='Profile' 
                className='w-10 h-10 rounded-full object-cover'
              />
              <AuthButton isSignedIn={true} />
            </div>
          </Header>
          <main className="flex-1 p-4">
            <Calendar 
              view={currentView} 
              currentDate={currentDate}
            />
          </main>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 text-center transform transition-all duration-300 hover:scale-105">
            <div className="mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Calendar Companion
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Organize your schedule, manage events, and stay on top of your commitments with ease.
            </p>
            <div className="flex justify-center">
              <AuthButton isSignedIn={false} className="
                px-6 py-3 
                bg-blue-500 hover:bg-blue-600 
                text-white font-semibold 
                rounded-lg 
                shadow-md 
                transition duration-300 ease-in-out 
                transform hover:-translate-y-1 hover:scale-105
              "/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [chatUser, setChatUser] = useState<User | null>(null);

  useEffect(() => {
    console.log('chatUser state changed:', chatUser);
    if (chatUser === null) {
      console.trace('chatUser was set to null');
    }
  }, [chatUser]);

  useEffect(() => {
    console.log('chatUser state updated:', chatUser);
    if (chatUser) {
      console.log('Rendering ChatBox for user:', chatUser);
    }
  }, [chatUser]);

  return (
    <ChatProvider>
      <EventProvider>
        <UserSearchProvider>
          <ErrorBoundary>
            <MainApp onChatUserSelect={setChatUser} />
            {chatUser && (
              <ChatBox 
                otherUser={chatUser} 
                onClose={() => setChatUser(null)} 
              />
            )}
          </ErrorBoundary>
        </UserSearchProvider>
      </EventProvider>
    </ChatProvider>
  );
};

export default App;
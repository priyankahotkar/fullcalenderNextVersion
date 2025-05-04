import { createContext, useContext, ReactNode } from 'react';
import { 
  collection, 
  getDocs, 
  getFirestore 
} from 'firebase/firestore';
import { app } from '../firebaseConfig';

// Define the User type for search results
export interface SearchUser {
  id: string;
  displayName?: string;
  email: string;
  photoURL?: string;
}

interface UserSearchContextType {
  searchUsers: (searchTerm: string) => Promise<SearchUser[]>;
}

const UserSearchContext = createContext<UserSearchContextType | undefined>(undefined);

export function UserSearchProvider({ children }: { children: ReactNode }) {
  const db = getFirestore(app);

  const searchUsers = async (searchTerm: string): Promise<SearchUser[]> => {
    if (!searchTerm.trim()) return [];

    try {
      // Search by email or display name
      const usersRef = collection(db, 'users');
      
      // Fetch all users and filter client-side for more flexible matching
      const usersSnapshot = await getDocs(usersRef);

      // Convert search term to lowercase for case-insensitive matching
      const lowercaseSearchTerm = searchTerm.toLowerCase();

      // Filter users based on email or display name
      const matchingUsers = usersSnapshot.docs
        .map(doc => ({ ...doc.data() as SearchUser, id: doc.id }))
        .filter(user => 
          user.email.toLowerCase().includes(lowercaseSearchTerm) || 
          (user.displayName && user.displayName.toLowerCase().includes(lowercaseSearchTerm))
        );

      return matchingUsers;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  return (
    <UserSearchContext.Provider value={{ searchUsers }}>
      {children}
    </UserSearchContext.Provider>
  );
}

export function useUserSearch() {
  const context = useContext(UserSearchContext);
  if (context === undefined) {
    throw new Error('useUserSearch must be used within a UserSearchProvider');
  }
  return context;
}

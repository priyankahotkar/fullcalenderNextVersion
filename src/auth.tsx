import React from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, User } from "firebase/auth";
import { doc, getDoc, setDoc, collection } from "firebase/firestore";
import { app, db } from './firebaseConfig';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  const auth = getAuth(app);
  // Using imported db
  try {
    const result = await signInWithPopup(auth, provider);
    // The signed-in user info.
    const user = result.user;
    
    // Check if user exists in Firestore
    const userRef = doc(collection(db, 'users'), user.uid);
    const userDoc = await getDoc(userRef);
    
    // If user doesn't exist, create a new document
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: new Date().toISOString()
      });
      console.log('New user added to Firestore');
    } else {
      console.log('Existing user logged in');
    }
    
    console.log('User signed in:', user);
    return user;
  } catch (error: any) {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used.
    const email = error.customData?.email;
    // The AuthCredential type that was used.
    const credential = GoogleAuthProvider.credentialFromError(error);
    
    console.error('Sign-in error:', { errorCode, errorMessage, email, credential });
    throw error;
  }
};

export const signOutUser = async () => {
  const auth = getAuth(app);
  try {
    await signOut(auth);
    console.log('User signed out');
  } catch (error) {
    console.error('Sign-out error', error);
  }
};

export const AuthButton: React.FC<{ 
  isSignedIn: boolean, 
  className?: string 
}> = ({ 
  isSignedIn, 
  className = `
    flex items-center justify-center 
    bg-white border border-gray-300 
    text-gray-700 font-medium 
    py-2 px-4 rounded-lg 
    hover:bg-gray-100 
    transition duration-300 ease-in-out 
    shadow-sm
  ` 
}) => {
  const handleAuth = async () => {
    if (isSignedIn) {
      await signOutUser();
    } else {
      await signInWithGoogle();
    }
  };

  return (
    <button 
      onClick={handleAuth} 
      className={className}
    >
      {isSignedIn ? 'Sign Out' : 'Sign In with Google'}
    </button>
  );
};

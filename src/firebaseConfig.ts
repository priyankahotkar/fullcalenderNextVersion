// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCzLgsiwvrpz7eHdBCHr1G3SVzUwGG8w3Q",
  authDomain: "fullcalender-1bddf.firebaseapp.com",
  projectId: "fullcalender-1bddf",
  storageBucket: "fullcalender-1bddf.firebasestorage.app",
  messagingSenderId: "92193300442",
  appId: "1:92193300442:web:23df6f4739f890e9c7eae3",
  measurementId: "G-0C4W42PDBB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };

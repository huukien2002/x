import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAtsAuBa6X20MuzTLzWkEADnKPv6VosEYU",
  authDomain: "coffee-9a1f8.firebaseapp.com",
  projectId: "coffee-9a1f8",
  storageBucket: "coffee-9a1f8.firebasestorage.app",
  messagingSenderId: "2316025268",
  appId: "1:2316025268:web:62100ecee836a6c450c6e1",
  measurementId: "G-L9QQGQM6BC",
  databaseURL: "https://coffee-9a1f8-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app); // Firestore
export const rtdb = getDatabase(app); // Realtime Database
export const auth = getAuth(app);

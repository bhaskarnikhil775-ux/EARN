// Real Firebase Configuration
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC2sVaRwL61ZKSm1dmLttbTrDXm-cQsgcI",
  authDomain: "scratch-earn-fc3ed.firebaseapp.com",
  projectId: "scratch-earn-fc3ed",
  storageBucket: "scratch-earn-fc3ed.firebasestorage.app",
  messagingSenderId: "370359166230",
  appId: "1:370359166230:web:42dbf1c0a79b4417e75c37"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
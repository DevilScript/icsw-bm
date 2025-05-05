import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyB2OzHJUNHiLcJ6zbZaezzwJ1UA_8-3LRw",
    authDomain: "ghoulre-f89ac.firebaseapp.com",
    projectId: "ghoulre-f89ac",
    storageBucket: "ghoulre-f89ac.firebasestorage.app",
    messagingSenderId: "402273806292",
    appId: "1:402273806292:web:a8a1f943613df9d343d841",
    measurementId: "G-XV4J7PHYZZ"
  };

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);

// ลงชื่อเข้าใช้แบบ Anonymous อัตโนมัติ
export const signIn = async () => {
  try {
    await signInAnonymously(auth);
  } catch (error) {
    console.error('Failed to sign in anonymously:', error);
  }
};
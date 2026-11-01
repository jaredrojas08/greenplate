import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC0Nnj-DhzfSryUH_lRJL3pFsB6zlDURfo",
  authDomain: "greenplate-9dd46.firebaseapp.com",
  projectId: "greenplate-9dd46",
  storageBucket: "greenplate-9dd46.firebasestorage.app",
  messagingSenderId: "1043134554424",
  appId: "1:1043134554424:web:4b6efef785dbbdc4e061cd",
  measurementId: "G-31LJJ5WZSB"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();

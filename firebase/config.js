import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Credenciais Firebase — substitua pelos valores do seu projeto
const firebaseConfig = {
  apiKey: "AIzaSyDT-6l6aYQ2H_wAFVAeQtJgJUdkDbPwrNI",
  authDomain: "crud-will.firebaseapp.com",
  projectId: "crud-will",
  storageBucket: "crud-will.firebasestorage.app",
  messagingSenderId: "338452438950",
  appId: "1:338452438950:web:2184c8a4ebc3159dccb967"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

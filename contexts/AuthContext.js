import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const docRef = doc(db, 'usuarios', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        setUser({ ...firebaseUser, perfil: docSnap.exists() ? docSnap.data() : {} });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const registrar = async (email, senha, nome) => {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    await updateProfile(cred.user, { displayName: nome });
    await setDoc(doc(db, 'usuarios', cred.user.uid), {
      nome,
      email,
      telefone: '',
      bio: '',
      dataCriacao: serverTimestamp()
    });
    return cred.user;
  };

  const login = (email, senha) => signInWithEmailAndPassword(auth, email, senha);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, registrar, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

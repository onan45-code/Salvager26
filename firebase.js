import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyBRkUnlZGo32n0EMHDmDTyagJlEB_mZoME",
  authDomain: "salvager26.firebaseapp.com",
  projectId: "salvager26",
  storageBucket: "salvager26.firebasestorage.app",
  messagingSenderId: "189886947555",
  appId: "1:189886947555:web:b43f0424d8d091f0cf25d6"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web'
    ? browserLocalPersistence
    : getReactNativePersistence(AsyncStorage)
});

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
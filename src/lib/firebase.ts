// src/lib/firebase.ts
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyCGDrySQ6zeB-EGS-eq-5zphz73evMQc9A",
  authDomain: "phone-repair-46298.firebaseapp.com",
  projectId: "phone-repair-46298",
  storageBucket: "phone-repair-46298.firebasestorage.app",
  messagingSenderId: "481840259564",
  appId: "1:481840259564:web:0f0e3ad3cda63d441a20c9",
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

export function initFirebase(): { auth: Auth; db: Firestore; storage: FirebaseStorage } {
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
  return { auth: auth!, db: db!, storage: storage! };
}

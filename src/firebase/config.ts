import { initializeApp, getApps, getApp } from "firebase/app";

export const firebaseConfig = {
  apiKey: "AIzaSyDNbLStyrhRZ5bykdh3zRk70emK63mdB8A",
  authDomain: "studio-8785153620-4e332.firebaseapp.com",
  projectId: "studio-8785153620-4e332",
  storageBucket: "studio-8785153620-4e332.appspot.com",
  messagingSenderId: "371700283438",
  appId: "1:371700283438:web:2f2471b1011c93b8a874bf",
  measurementId: "G-XXXXXXXXXX"
};

export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

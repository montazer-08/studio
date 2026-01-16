import { initializeApp, getApps, getApp } from "firebase/app";

export const firebaseConfig = {
  apiKey: "AIzaSyDdNbLstyhRz5bykdh3zRk7OenK63md8BA",
  authDomain: "studio-8785153620-4e332.firebaseapp.com",
  projectId: "studio-8785153620-4e332",
  storageBucket: "studio-8785153620-4e332.firebasestorage.app",
  messagingSenderId: "371700283438",
  appId: "1:371700283438:web:14ed132fe53eecf78747bf"
};

export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

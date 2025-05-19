// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDL-fydFUwZMXXwdK-Y2q1d0mveJhRg3cQ",
    authDomain: "happy-tomato.firebaseapp.com",
    projectId: "happy-tomato",
    storageBucket: "happy-tomato.firebasestorage.app",
    messagingSenderId: "593032243471",
    appId: "1:593032243471:web:3b7ae7d97fca09c4ebb67a",
    measurementId: "G-76Q89B2J95"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDx4AynxLhEwW-HfsZdY6JVmWE3zxQ6iAQ",
  authDomain: "katha-377e1.firebaseapp.com",
  databaseURL: "https://katha-377e1-default-rtdb.firebaseio.com",
  projectId: "katha-377e1",
  storageBucket: "katha-377e1.firebasestorage.app",
  messagingSenderId: "927589161865",
  appId: "1:927589161865:web:fdec3dd1a7d69e57e45f58",
  measurementId: "G-RVH9M6VB05"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const storage = getStorage(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Export services
export { storage, db, auth };
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDiCj45n7GMjXUtRlvUbVoNBKlNhxzjooA",
  authDomain: "social-media-app-bf56f.firebaseapp.com",
  projectId: "social-media-app-bf56f",
  storageBucket: "social-media-app-bf56f.appspot.com",
  messagingSenderId: "974131852495",
  appId: "1:974131852495:web:702bf1a18f013c1bdeb3ba",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

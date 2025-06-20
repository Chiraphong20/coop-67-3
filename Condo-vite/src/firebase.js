import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAfR4USZMGVthMCsITkMEWVP0e7RiWob84",
  authDomain: "condoconnect-ae133.firebaseapp.com",
  projectId: "condoconnect-ae133",
  storageBucket: "condoconnect-ae133.appspot.com",  
  messagingSenderId: "835080966014",
  appId: "1:835080966014:web:32437076b843f1224aed2f",
  measurementId: "G-R4HENWW8GG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export const auth = getAuth(app);

export { db };

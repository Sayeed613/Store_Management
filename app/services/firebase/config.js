import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCDOh6nszi3qq1G9HC8F9ddckZAOrGBYhY",
  authDomain: "store-management-39c06.firebaseapp.com",
  projectId: "store-management-39c06",
  storageBucket: "store-management-39c06.appspot.com",
  messagingSenderId: "470055555033",
  appId: "1:470055555033:web:c7ed1fad0771aacbcf13c8",
  measurementId: "G-7TPTBRCBQX"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

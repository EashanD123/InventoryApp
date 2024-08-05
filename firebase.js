// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from 'firebase/firestore'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBC5yK_uRA5XgED-_eE05PkefuIXAnzLyY",
  authDomain: "hspantryapp-61ccc.firebaseapp.com",
  projectId: "hspantryapp-61ccc",
  storageBucket: "hspantryapp-61ccc.appspot.com",
  messagingSenderId: "379637871591",
  appId: "1:379637871591:web:fb115ad452c5d3e8628342"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app)
export {firestore}
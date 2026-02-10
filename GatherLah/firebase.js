// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBkO3JRk9BQuHDv_D5SK8kLgjITdfUnV8k",
  authDomain: "gatherlah-57aff.firebaseapp.com",
  projectId: "gatherlah-57aff",
  storageBucket: "gatherlah-57aff.firebasestorage.app",
  messagingSenderId: "903357973320",
  appId: "1:903357973320:web:6fe933a919cdea6dd7e97d",
  measurementId: "G-BL4E8L1JEY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
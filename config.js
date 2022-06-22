// Import the functions you need from the SDKs you need
import firebase from "firebase";
import 'firebase/auth';
import 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxUQiI5-6zk0sq3OTo4DLuduB6ySlgZHY",
  authDomain: "biblioteca-93f75.firebaseapp.com",
  projectId: "biblioteca-93f75",
  storageBucket: "biblioteca-93f75.appspot.com",
  messagingSenderId: "927161211050",
  appId: "1:927161211050:web:a7dc54737b25d383aa98d3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export default firebase.firestore();
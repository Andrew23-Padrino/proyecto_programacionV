


import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, deleteDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js"

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional



  // Your web app's Firebase configuration

  const firebaseConfig = {

    apiKey: "AIzaSyCcAje_zW1NZ2n__S6B0zQxdmTMXKxlnMg",

    authDomain: "spaceinvaders-54784.firebaseapp.com",

    projectId: "spaceinvaders-54784",

    storageBucket: "spaceinvaders-54784.appspot.com",

    messagingSenderId: "27304668629",

    appId: "1:27304668629:web:d81fb4767c2edb532e215c"

  };


  // Initialize Firebase

  //const app = initializeApp(firebaseConfig);



export{firebaseConfig, initializeApp}

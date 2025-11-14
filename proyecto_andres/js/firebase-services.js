// Import Firebase
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { firebaseConfig_ap } from './firebase-config.js';

// Initialize Firebase
const app_ap = initializeApp(firebaseConfig_ap);
const analytics_ap = getAnalytics(app_ap);
const db_ap = getFirestore(app_ap);
const auth_ap = getAuth(app_ap);

// Función para generar una contraseña temporal
export const generateTempPassword_ap = () => {
  const chars_ap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password_ap = '';
  for (let i = 0; i < 12; i++) {
    password_ap += chars_ap.charAt(Math.floor(Math.random() * chars_ap.length));
  }
  return password_ap;
};

// Servicios de Firebase
export const firebaseServices_ap = {
  // Registrar usuario
  registerUser_ap: async (userData_ap) => {
    const userCredential_ap = await createUserWithEmailAndPassword(
      auth_ap, 
      userData_ap.email, 
      generateTempPassword_ap()
    );
    
    await addDoc(collection(db_ap, "usuarios"), {
      uid: userCredential_ap.user.uid,
      nombre: userData_ap.nombre,
      apellido: userData_ap.apellido,
      email: userData_ap.email,
      interes: userData_ap.interes,
      fechaRegistro: new Date()
    });
    
    return userCredential_ap;
  },

  // Enviar mensaje de contacto
  sendContactMessage_ap: async (messageData_ap) => {
    await addDoc(collection(db_ap, "mensajes"), {
      nombre: messageData_ap.nombre,
      email: messageData_ap.email,
      asunto: messageData_ap.asunto,
      mensaje: messageData_ap.mensaje,
      fecha: new Date(),
      leido: false
    });
  },

  // Suscribir al newsletter
  subscribeNewsletter_ap: async (email_ap) => {
    await addDoc(collection(db_ap, "suscripciones"), {
      email: email_ap,
      fecha: new Date(),
      activo: true
    });
  }
};
// Import Firebase services
import { firebaseServices_ap } from './firebase-services.js';

document.addEventListener('DOMContentLoaded', () => {
  // Formulario de registro
  const registroForm_ap = document.getElementById('registro-form');
  const registroMensaje_ap = document.getElementById('registro-mensaje');

  if (registroForm_ap) {
    registroForm_ap.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const userData_ap = {
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        email: document.getElementById('email').value,
        interes: document.getElementById('interes').value
      };
      
      try {
        // Registrar usuario usando el servicio modular
        await firebaseServices_ap.registerUser_ap(userData_ap);
        
        // Mostrar mensaje de éxito
        registroMensaje_ap.textContent = "¡Registro exitoso! Te hemos enviado un correo de confirmación.";
        registroMensaje_ap.className = "mt-4 p-4 rounded-lg bg-green-100 text-green-800";
        registroMensaje_ap.classList.remove("hidden");
        
        // Limpiar formulario
        registroForm_ap.reset();
        
      } catch (error) {
        console.error("Error en el registro:", error);
        registroMensaje_ap.textContent = "Error en el registro: " + error.message;
        registroMensaje_ap.className = "mt-4 p-4 rounded-lg bg-red-100 text-red-800";
        registroMensaje_ap.classList.remove("hidden");
      }
    });
  }

  // Formulario de contacto
  const contactoForm_ap = document.getElementById('contacto-form');
  
  if (contactoForm_ap) {
    contactoForm_ap.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const messageData_ap = {
        nombre: document.getElementById('nombre-contacto').value,
        email: document.getElementById('email-contacto').value,
        asunto: document.getElementById('asunto').value,
        mensaje: document.getElementById('mensaje').value
      };
      
      try {
        // Enviar mensaje usando el servicio modular
        await firebaseServices_ap.sendContactMessage_ap(messageData_ap);
        
        // Mostrar mensaje de éxito
        alert("¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.");
        
        // Limpiar formulario
        contactoForm_ap.reset();
        
      } catch (error) {
        console.error("Error al enviar mensaje:", error);
        alert("Error al enviar mensaje: " + error.message);
      }
    });
  }

  // Formulario de newsletter
  const newsletterForm_ap = document.getElementById('newsletter-form');
  
  if (newsletterForm_ap) {
    newsletterForm_ap.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const emailInput_ap = newsletterForm_ap.querySelector('input[type="email"]');
      const email_ap = emailInput_ap.value;
      
      try {
        // Suscribir usando el servicio modular
        await firebaseServices_ap.subscribeNewsletter_ap(email_ap);
        
        // Mostrar mensaje de éxito
        alert("¡Te has suscrito con éxito a nuestro boletín!");
        
        // Limpiar formulario
        emailInput_ap.value = '';
        
      } catch (error) {
        console.error("Error al suscribirse:", error);
        alert("Error al suscribirse: " + error.message);
      }
    });
  }
});
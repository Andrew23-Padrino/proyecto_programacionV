import { firebaseServices_ap } from '../games/originales/firebase-services.js';
import { escapeHTML } from './utils.js';

export function initForms() {
  // Registro
  const registroForm_ap = document.getElementById('registro-form');
  const registroMensaje_ap = document.getElementById('registro-mensaje');
  if (registroForm_ap) {
    registroForm_ap.addEventListener('submit', (e) => e.preventDefault());
    const registroBtn = document.getElementById('registro-btn');
    if (registroBtn) {
      registroBtn.addEventListener('click', async () => {
        const nombreVal = document.getElementById('nombre')?.value?.trim();
        const apellidoVal = document.getElementById('apellido')?.value?.trim();
        const emailVal = document.getElementById('email')?.value?.trim();
        const passwordVal = document.getElementById('password')?.value || '';
        if (!nombreVal || !apellidoVal || !emailVal) {
          if (registroMensaje_ap) {
            registroMensaje_ap.textContent = 'Por favor completa nombre, apellido y correo.';
            registroMensaje_ap.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-800';
            registroMensaje_ap.classList.remove('hidden');
          }
          return;
        }
        if (passwordVal.length < 6) {
          if (registroMensaje_ap) {
            registroMensaje_ap.textContent = 'La contraseña debe tener al menos 6 caracteres.';
            registroMensaje_ap.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-800';
            registroMensaje_ap.classList.remove('hidden');
          }
          return;
        }

        const originalText = registroBtn.innerHTML;
        registroBtn.disabled = true;
        registroBtn.classList.add('btn', 'btn-primary');
        registroBtn.innerHTML = `<span class="spinner"></span> Registrando...`;
        const carnetFile = document.getElementById('carnet')?.files?.[0];
        const userData_ap = {
          nombre: nombreVal,
          apellido: apellidoVal,
          email: emailVal,
          interes: document.getElementById('interes')?.value || '',
          institucion: document.getElementById('institucion')?.value || ''
        };
        const password_ap = passwordVal;

        try {
          const cred = await firebaseServices_ap.registerUser_ap(userData_ap, password_ap);
          const uid_ap = cred.user.uid;
          let carnetURL = null;
          if (carnetFile) {
            try {
              carnetURL = await firebaseServices_ap.uploadCarnet_ap(uid_ap, carnetFile);
            } catch (uploadErr) {
              console.warn('No se pudo subir el carnet:', uploadErr);
              if (registroMensaje_ap) {
                registroMensaje_ap.textContent = 'Cuenta creada, pero no se pudo subir la foto del carnet: ' + (uploadErr.message || uploadErr) + '. Revisa las reglas de Storage.';
                registroMensaje_ap.className = 'mt-4 p-4 rounded-lg bg-yellow-100 text-yellow-800';
                registroMensaje_ap.classList.remove('hidden');
              }
            }
          }
          try {
            const toSave = { institucion: userData_ap.institucion };
            if (carnetURL) toSave.carnetURL = carnetURL;
            await firebaseServices_ap.saveUserProfile_ap(uid_ap, toSave);
          } catch (saveErr) {
            console.error('No se pudo guardar el perfil en Firestore:', saveErr);
            if (registroMensaje_ap) {
              registroMensaje_ap.textContent = 'Cuenta creada, pero no se pudo guardar el perfil: ' + (saveErr.message || saveErr) + '. Revisa las reglas de Firestore.';
              registroMensaje_ap.className = 'mt-4 p-4 rounded-lg bg-yellow-100 text-yellow-800';
              registroMensaje_ap.classList.remove('hidden');
            }
          }
          window.location.href = '/src/pages/perfil/perfil.html';
        } catch (err) {
          console.error('Error en el registro:', err);
          if (registroMensaje_ap) {
            registroMensaje_ap.textContent = 'Error en el registro: ' + (err.message || err);
            registroMensaje_ap.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-800';
            registroMensaje_ap.classList.remove('hidden');
          } else {
            alert('Error en el registro: ' + (err.message || err));
          }
        } finally {
          registroBtn.disabled = false;
          registroBtn.innerHTML = originalText;
        }
      });
    }
  }

  // Contacto
  const contactoForm_ap = document.getElementById('contacto-form');
  if (contactoForm_ap) {
    contactoForm_ap.addEventListener('submit', async (e) => {
      e.preventDefault();
      const api_ap = (document.querySelector('meta[name="nc-contact-api"]')?.getAttribute('content') || '/src/php/public/index.php?route=contact/send');
      const body_ap = new URLSearchParams({
        nombre: document.getElementById('nombre-contacto').value.trim(),
        email: document.getElementById('email-contacto').value.trim(),
        asunto: document.getElementById('asunto').value.trim(),
        mensaje: document.getElementById('mensaje').value.trim()
      });
      try {
        const resp_ap = await fetch(api_ap, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body_ap });
        const ct_ap = (resp_ap.headers.get('content-type') || '').toLowerCase();
        if (!ct_ap.includes('application/json')) {
          const txt_ap = await resp_ap.text();
          throw new Error('Respuesta no JSON: ' + txt_ap.slice(0, 200));
        }
        const json_ap = await resp_ap.json();
        if (!json_ap.ok) {
          const vErrors = json_ap.errors ? Object.values(json_ap.errors).join('; ') : '';
          const msg = json_ap.error || vErrors || 'No se pudo enviar';
          if (json_ap.debug) console.error('SMTP debug:', json_ap.debug);
          throw new Error(msg);
        }
        if (json_ap.transport === 'log') {
          alert('Mensaje registrado (modo pruebas). No se envió email.');
        } else {
          alert('¡Mensaje enviado con éxito!');
        }
        contactoForm_ap.reset();
      } catch (err) {
        console.error('Error al enviar mensaje:', err);
        alert('Error al enviar mensaje: ' + (err.message || err));
      }
    });
  }

  // Newsletter
  // Newsletter: use delegated submit handler so footer can be mounted after initForms()
  async function sendNewsletterEmail(email, statusCb) {
    const setStatus = (s) => { try { if (typeof statusCb === 'function') statusCb(s); else console.info(s); } catch (e) {} };
    if (!email) { setStatus('Correo inválido'); throw new Error('Correo inválido'); }
    // load env/meta
    let env = {};
    try { env = import.meta.env || {}; } catch (e) { env = {}; }
    const svcMeta = document.querySelector('meta[name="nc-emailjs-service"]');
    const tplMeta = document.querySelector('meta[name="nc-emailjs-template"]');
    const keyMeta = document.querySelector('meta[name="nc-emailjs-key"]');

    const serviceId = (env.VITE_EMAILJS_SERVICE || env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || (svcMeta ? (svcMeta.getAttribute('content') || '').trim() : '')).trim();
    const templateId = (env.VITE_EMAILJS_TEMPLATE || env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || (tplMeta ? (tplMeta.getAttribute('content') || '').trim() : '')).trim();
    const userId = (env.VITE_EMAILJS_KEY || env.NEXT_PUBLIC_EMAILJS_USER_ID || (keyMeta ? (keyMeta.getAttribute('content') || '').trim() : '')).trim();

    if (!serviceId || !templateId || !userId) {
      setStatus('EmailJS no configurado (service/template/key).');
      throw new Error('EmailJS no configurado');
    }

    // try multiple CDN endpoints and provide diagnostic info if they fail
    function loadScript(src){
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve(src);
        s.onerror = (e) => reject({ src, event: e });
        document.head.appendChild(s);
      });
    }

    async function tryLoadScripts(urls, statusLogger){
      const errors = [];
      for (const u of urls) {
        try {
          statusLogger && statusLogger('Cargando EmailJS desde ' + u + ' ...');
          await loadScript(u);
          return u; // success
        } catch (err) {
          console.warn('loadScript failed', err);
          errors.push(err);
        }
      }
      const err = new Error('No se pudo cargar EmailJS desde los CDNs probados');
      err.details = errors;
      throw err;
    }

    let emailjsLib = (window && window.emailjs) ? window.emailjs : null;
    if (!emailjsLib) {
      try {
        setStatus('Cargando EmailJS...');
        const tried = await tryLoadScripts([
          'https://cdn.emailjs.com/sdk/3.2.0/email.min.js',
          'https://cdn.emailjs.com/sdk/latest/email.min.js',
          'https://cdn.jsdelivr.net/npm/@emailjs/browser/dist/email.min.js',
          'https://unpkg.com/@emailjs/browser/dist/email.min.js'
        ], setStatus);
        console.info('EmailJS loaded from', tried);
        emailjsLib = (window && window.emailjs) ? window.emailjs : null;
        if (!emailjsLib) throw new Error('EmailJS cargado pero window.emailjs no disponible');
      } catch (ldErr) {
        console.error('Could not load EmailJS SDK from CDN', ldErr);
        // If we have detailed errors, show a compact summary to the user
        let msg = 'No se pudo cargar EmailJS SDK. Intentando fallback vía API REST...';
        try { if (ldErr && ldErr.details) { msg += ' Fuentes probadas: ' + ldErr.details.map(d => d && d.src ? d.src : String(d)).join(', '); } } catch(e){}
        setStatus(msg);
        // attach details for debugging in console
        console.error('EmailJS load details:', ldErr);

        // Attempt REST API fallback (no SDK required)
        try {
          setStatus('Enviando vía EmailJS REST API...');
          const templateParams = { to_email: email };
          const resp = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ service_id: serviceId, template_id: templateId, user_id: userId, template_params: templateParams })
          });
          if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            throw new Error('HTTP ' + resp.status + ' ' + resp.statusText + ' ' + text);
          }
          setStatus('Enviado correctamente (vía API REST). Revisa tu correo.');
          return; // success, skip SDK-based send
        } catch (apiErr) {
          console.error('EmailJS REST fallback failed', apiErr);
          setStatus('Fallo al enviar vía API REST: ' + (apiErr && apiErr.message ? apiErr.message : String(apiErr)));
          const finalErr = new Error('No se pudo cargar EmailJS SDK ni enviar via REST');
          finalErr.cdn = ldErr;
          finalErr.rest = apiErr;
          throw finalErr;
        }
      }
    }

    try { if (typeof emailjsLib.init === 'function') emailjsLib.init(userId); } catch (ie) {}

    const templateParams = { to_email: email };
    setStatus('Enviando...');
    console.info('EmailJS send:', { serviceId, templateId, userId, templateParams });
    await emailjsLib.send(serviceId, templateId, templateParams, userId);
    setStatus('Enviado correctamente. Revisa tu correo.');
  }

  // Delegated submit handler so the newsletter works even if the footer is mounted later
  document.addEventListener('submit', async (e) => {
    try {
      const form = e.target;
      if (!form || form.id !== 'newsletter-form') return;
      e.preventDefault();
      const emailInput_ap = form.querySelector('input[type="email"]');
      const email_ap = (emailInput_ap?.value || '').trim();
      const statusEl = document.getElementById('emailjs-test-status');
      try {
        await sendNewsletterEmail(email_ap, (msg) => { if (statusEl) statusEl.textContent = msg; });
        // clear input if successful
        if (emailInput_ap) emailInput_ap.value = '';
        // if not using debug UI, show a simple notice
        if (!statusEl) alert('¡Te has suscrito! Revisa tu correo para confirmar.');
      } catch (err) {
        console.error('Error enviando email de suscripción:', err);
        if (!statusEl) alert('No se pudo enviar el correo de confirmación. Revisa la configuración de EmailJS.');
        else statusEl.textContent = 'Error: ' + (err && err.message ? err.message : String(err));
      }
    } catch (outerErr) {
      console.error('newsletter submit handler failed', outerErr);
    }
  });

  // Login
  const loginForm_ap = document.getElementById('login-form');
  const loginMensaje_ap = document.getElementById('login-mensaje');
  if (loginForm_ap) {
    loginForm_ap.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      try {
        await firebaseServices_ap.loginUser_ap(email, password);
        if (loginMensaje_ap) loginMensaje_ap.textContent = '';
        loginForm_ap.reset();
        window.location.href = '/src/pages/perfil/perfil.html';
      } catch (err) {
        console.error('Error login:', err);
        if (loginMensaje_ap) loginMensaje_ap.textContent = err.message || err;
      }
    });
  }
}

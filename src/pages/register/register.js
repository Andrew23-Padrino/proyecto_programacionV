// Page module: Register
import '/src/style.css'
import { firebaseServices_ap } from '/src/games/originales/firebase-services.js'
import { mountHeader } from '/src/components/header.js'
import { mountFooter } from '/src/components/footer.js'

const mountLayout = () => {
  const headerRoot = document.getElementById('header-root')
  const footerRoot = document.getElementById('footer-root')
  if (headerRoot) mountHeader(headerRoot)
  if (footerRoot) mountFooter(footerRoot)
}

const attachRegisterHandlers = () => {
  const registroForm = document.getElementById('registro-form')
  const registroMensaje = document.getElementById('registro-mensaje')
  if (!registroForm) return

  // prevent default form submit if present
  registroForm.addEventListener('submit', (e) => e.preventDefault())

  const registroBtn = document.getElementById('registro-btn')
  if (!registroBtn) return

  registroBtn.addEventListener('click', async () => {
    const nombreVal = document.getElementById('nombre')?.value?.trim()
    const apellidoVal = document.getElementById('apellido')?.value?.trim()
    const emailVal = document.getElementById('email')?.value?.trim()
    const passwordVal = document.getElementById('password')?.value || ''
    if (!nombreVal || !apellidoVal || !emailVal) {
      if (registroMensaje) {
        registroMensaje.textContent = 'Por favor completa nombre, apellido y correo.'
        registroMensaje.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-800'
        registroMensaje.classList.remove('hidden')
      }
      return
    }
    if (passwordVal.length < 6) {
      if (registroMensaje) {
        registroMensaje.textContent = 'La contraseña debe tener al menos 6 caracteres.'
        registroMensaje.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-800'
        registroMensaje.classList.remove('hidden')
      }
      return
    }

    // UX: disable button
    const originalText = registroBtn.innerHTML
    registroBtn.disabled = true
    registroBtn.innerHTML = 'Registrando...'
    const carnetFile = document.getElementById('carnet')?.files?.[0]
    const userData_ap = {
      nombre: nombreVal,
      apellido: apellidoVal,
      email: emailVal,
      interes: document.getElementById('interes')?.value || '',
      institucion: document.getElementById('institucion')?.value || ''
    }

    try {
      const cred = await firebaseServices_ap.registerUser_ap(userData_ap, passwordVal)
      const uid_ap = cred.user.uid
      let carnetURL = null
      if (carnetFile) {
        try {
          carnetURL = await firebaseServices_ap.uploadCarnet_ap(uid_ap, carnetFile)
        } catch (uploadErr) {
          console.warn('No se pudo subir el carnet:', uploadErr)
          if (registroMensaje) {
            registroMensaje.textContent = 'Cuenta creada, pero no se pudo subir la foto del carnet.'
            registroMensaje.className = 'mt-4 p-4 rounded-lg bg-yellow-100 text-yellow-800'
            registroMensaje.classList.remove('hidden')
          }
        }
      }

      try {
        const toSave = { institucion: userData_ap.institucion }
        if (carnetURL) toSave.carnetURL = carnetURL
        await firebaseServices_ap.saveUserProfile_ap(uid_ap, toSave)
      } catch (saveErr) {
        console.error('No se pudo guardar el perfil en Firestore:', saveErr)
        if (registroMensaje) {
          registroMensaje.textContent = 'Cuenta creada, pero no se pudo guardar el perfil.'
          registroMensaje.className = 'mt-4 p-4 rounded-lg bg-yellow-100 text-yellow-800'
          registroMensaje.classList.remove('hidden')
        }
      }

      // redirect to profile
      window.location.href = '/src/pages/perfil/perfil.html'
    } catch (err) {
      console.error('Error en el registro:', err)
      if (registroMensaje) {
        registroMensaje.textContent = 'Error en el registro: ' + (err.message || err)
        registroMensaje.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-800'
        registroMensaje.classList.remove('hidden')
      }
    } finally {
      registroBtn.disabled = false
      registroBtn.innerHTML = originalText
    }
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    mountLayout()
    attachRegisterHandlers()
  })
} else {
  mountLayout()
  attachRegisterHandlers()
}

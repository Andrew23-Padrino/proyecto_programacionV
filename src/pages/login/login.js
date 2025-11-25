// Page module: Login
import '/src/style.css'
import { firebaseServices_ap } from '/src/games/originales/firebase-services.js'
import { mountHeader } from '/src/components/header.js'
import { mountFooter } from '/src/components/footer.js'

// Mount header/footer immediately and wire login form interactions
const mountLayout = () => {
  const headerRoot = document.getElementById('header-root')
  const footerRoot = document.getElementById('footer-root')
  if (headerRoot) mountHeader(headerRoot)
  if (footerRoot) mountFooter(footerRoot)
}

const attachLoginHandlers = () => {
  const loginForm = document.getElementById('login-form')
  const loginMensaje = document.getElementById('login-mensaje')
  if (!loginForm) return
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('login-email')?.value || ''
    const password = document.getElementById('login-password')?.value || ''
    try {
      await firebaseServices_ap.loginUser_ap(email, password)
      if (loginMensaje) loginMensaje.textContent = ''
      loginForm.reset()
      // If there's a stored redirect target (from a guarded page), go there
      try{
        let after = localStorage.getItem('nc_after_login');
        if (after) {
          // remove stored value early to avoid re-use
          try{ localStorage.removeItem('nc_after_login'); }catch(e){}
          try{
            after = String(after || '').trim();
            // Build an absolute URL from the stored value (handles both relative and absolute values)
            let targetUrl;
            try{
              targetUrl = new URL(after, window.location.origin);
            }catch(e){
              // fallback: ensure leading slash and try again
              if (!after.startsWith('/')) after = '/' + after;
              targetUrl = new URL(after, window.location.origin);
            }
            // Prevent redirect loops to login page
            if (targetUrl.pathname.includes('/src/pages/login')) {
              window.location.href = '/src/pages/perfil/perfil.html';
              return;
            }
            // final redirect
            window.location.href = targetUrl.href;
            return;
          }catch(e){
            console.warn('redirect normalization failed', e);
          }
        }
      }catch(e){}
      // fallback to profile
      window.location.href = '/src/pages/perfil/perfil.html'
    } catch (err) {
      console.error('Error login:', err)
      if (loginMensaje) loginMensaje.textContent = err.message || String(err)
    }
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    mountLayout()
    attachLoginHandlers()
  })
} else {
  mountLayout()
  attachLoginHandlers()
}

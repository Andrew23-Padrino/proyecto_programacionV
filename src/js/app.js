
import { initForms } from './forms.js';
import { initAuth } from './auth.js';
import { setupProfileActions } from './profile.js';

async function attachGameLinkGuards() {
  try {
    // find anchors that point to game pages inside the cursos section
    const anchors = Array.from(document.querySelectorAll('#cursos a'))
      .filter(a => {
        const href = a.getAttribute('href') || '';
        const hrefLower = href.toLowerCase();
        return hrefLower.includes('src/pages') && hrefLower.includes('juego');
      });
    if (!anchors.length) return;
    // lazy import firebase services to check auth
    const { firebaseServices_ap } = await import('../games/originales/firebase-services.js');
    anchors.forEach(a => {
      // allow explicit opt-out via attribute or automatic whitelist for memoria
      const href = a.getAttribute('href') || '';
      const hrefLower = href.toLowerCase();
      const noAuthAttr = a.getAttribute('data-no-auth');
      const isMemoria = hrefLower.includes('/src/pages/memoria/')
        || hrefLower.includes('juego_memoria');
      if (noAuthAttr === 'true' || isMemoria) return; // don't guard this link

      a.addEventListener('click', (ev) => {
        try {
          ev.preventDefault();
          const rawHref = a.getAttribute('href');
          const targetUrl = new URL(rawHref, window.location.origin);
          // store absolute path+search so login can return here
          try{ localStorage.setItem('nc_after_login', targetUrl.pathname + targetUrl.search); }catch(e){}
          // if user is authenticated, go straight to the game
          const isAuthed = !!(firebaseServices_ap && firebaseServices_ap.auth && firebaseServices_ap.auth.currentUser);
          if (isAuthed) {
            window.location.href = targetUrl.href;
            return;
          }
          // else go to central login page
          window.location.href = '/src/pages/login/login.html';
        }catch(e){
          console.warn('game link guard failed', e);
          // fallback: navigate normally
          try{ window.location.href = a.href }catch(e2){}
        }
      });
    });
  } catch (e) {
    console.warn('attachGameLinkGuards error', e);
  }
}

// app.js becomes the single entry point that orchestrates modules
document.addEventListener('DOMContentLoaded', () => {
  initForms();
  initAuth();
  setupProfileActions();
  attachGameLinkGuards();
});

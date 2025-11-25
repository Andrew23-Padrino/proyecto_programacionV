import CannonGame from './CannonGame.js';
import CannonLesson from './CannonLesson.js';
import { ensureAuthenticated, showLoginRequiredModal } from './utils.js';

// Immediate auth guard (keeps original behavior)
(function immediateAuthGuard(){
  try{
    import('/src/games/originales/firebase-services.js').then(({ firebaseServices_ap })=>{
      if (!firebaseServices_ap || !firebaseServices_ap.auth) {
        console.warn('Firebase auth no disponible — bloqueando acceso al juego.');
        setTimeout(()=> { try{ window.location.href = '/src/pages/login/login.html'; }catch(e){}; }, 200);
        return;
      }
      if (firebaseServices_ap.auth.currentUser) return;
      const timeoutMs = 1800; let done = false;
      const unsub = firebaseServices_ap.auth.onAuthStateChanged((user) => {
        if (done) return; done = true; try{ unsub(); }catch(e){}
        if (!user) { try{ window.location.href = '/src/pages/login/login.html'; }catch(e){} }
      });
      setTimeout(()=>{ if (done) return; done = true; try{ if (typeof unsub === 'function') unsub(); }catch(e){}; if (!firebaseServices_ap.auth.currentUser) { try{ window.location.href = '/src/pages/login/login.html'; }catch(e){} } }, timeoutMs);
    }).catch((e)=>{ console.warn('immediateAuthGuard import failed', e); setTimeout(()=> { try{ window.location.href = '/src/pages/login/login.html'; }catch(e){}; }, 200); });
  }catch(e){ console.warn('immediateAuthGuard error', e); }
})();

document.addEventListener('DOMContentLoaded', ()=>{
  (async function(){
    try{
      const uid = await ensureAuthenticated();
      if (!uid) {
        showLoginRequiredModal({ message: 'Debes iniciar sesión para jugar. Serás redirigido a la página de inicio de sesión.' });
        return;
      }
      const startGame = async (opts) => {
        console.log('Starting CannonGame; lesson result:', opts);
        setTimeout(()=> new CannonGame('canvas', { vsBot: !!(opts && opts.vsBot), lessonScore: (opts && typeof opts.score !== 'undefined') ? opts.score : 0 }), 50);
      };
      new CannonLesson(startGame);
    }catch(e){ console.warn('Auth check on page load failed', e); showLoginRequiredModal({ message: 'Debes iniciar sesión para jugar.' }); }
  })();
});
import Game from '../common/Game.js'

class CanionGame extends Game {
  constructor(opts = {}) {
    super({ id: 'canion', name: 'Cañón', assets: opts.assets })
  }

  async init(container) {
    await super.init(container)
    container.innerHTML = ''
    const root = document.createElement('div')
    root.className = 'game-root'
    root.innerHTML = `
      <h2 class="game-header">Ángulo del Cañón</h2>
      <div class="game-canvas">Simulación de proyectiles (placeholder)</div>
    `
    container.appendChild(root)
  }
}

export default new CanionGame()

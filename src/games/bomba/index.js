import BombLesson from './BombLesson.js';
import BombGame from './BombGame.js';
import { ensureAuthenticated, showLoginRequiredModal } from './utils.js';

document.addEventListener('DOMContentLoaded', ()=>{
  (async ()=>{
    try{
      const uid = await ensureAuthenticated();
      if (!uid) { showLoginRequiredModal({ message: 'Debes iniciar sesión para jugar. Serás redirigido al login.' }); return; }
      const startGame = (opts) => {
        // opts may contain lesson score and chosen order
        const options = { lessonScore: opts && opts.score ? opts.score : 0 };
        if (opts && opts.order) options.lessonOrder = opts.order;
        setTimeout(()=> new BombGame('bomb-canvas', options), 50);
      };
      new BombLesson(startGame);
    }catch(e){ console.warn('Bomb game init failed', e); showLoginRequiredModal(); }
  })();
});

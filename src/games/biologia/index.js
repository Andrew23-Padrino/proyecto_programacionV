import Game from '../common/Game.js'
import BiologiaLesson from './BiologiaLesson.js'
import { loadOriginalById } from '../loader.js'
import BiologiaCanvasGame from './BiologiaCanvasGame.js'
import { ensureAuthenticated, showLoginRequiredModal } from '../bomba/utils.js'
import MatchRecorder from '../bomba/MatchRecorder.js'

document.addEventListener('DOMContentLoaded', ()=>{
  (async ()=>{
    try{
      const uid = await ensureAuthenticated();
      if (!uid) { showLoginRequiredModal({ message: 'Debes iniciar sesión para jugar. Serás redirigido al login.' }); return; }
      const startGame = async (opts) => {
        const container = document.getElementById('bio-container') || document.body;
        const lessonScore = (opts && typeof opts.score !== 'undefined') ? Number(opts.score) : 0;
        let canvas = document.getElementById('bio-canvas');
        if (!canvas){
          canvas = document.createElement('canvas');
          canvas.id = 'bio-canvas';
          canvas.style.width = '100%';
          canvas.style.height = '520px';
          container.innerHTML = '';
          const msg = document.createElement('div');
          msg.id = 'bio-msg';
          msg.style.margin = '8px';
          container.appendChild(msg);
          container.appendChild(canvas);
        }
        new BiologiaCanvasGame('bio-canvas', { lessonScore, onWin: async ({ recorder: rec })=>{ await onFinish({ winner:true, points:10, subject:'biologia', lessonScore, recorder: rec }) } })
      };
      new BiologiaLesson(startGame);
    }catch(e){ showLoginRequiredModal(); }
  })();
});

async function onFinish({ winner = false, points = 0, subject = 'biologia', lessonScore = 0, recorder }){
  try{
    const { firebaseServices_ap } = await import('../originales/firebase-services.js');
    const localUid = firebaseServices_ap && firebaseServices_ap.auth && firebaseServices_ap.auth.currentUser ? firebaseServices_ap.auth.currentUser.uid : null;
    if (!localUid) return;
    if (winner){ if (points) await firebaseServices_ap.addPointsToUser_ap(localUid, points); let computed = 20 + Number(lessonScore); computed = Math.max(0, Math.min(20, computed)); await firebaseServices_ap.setSubjectGrade_ap(localUid, subject, computed); const saved = await firebaseServices_ap.addMatchResult_ap({ winnerUid: localUid, loserUid: null, pointsAwarded: points, materia: subject, subjectScore: computed, attempts: recorder ? recorder.getAttempts() : [] }); try{ await firebaseServices_ap.addUserMatchSummary_ap(localUid, { partidaId: saved.id, winnerUid: localUid, loserUid: null, pointsAwarded: points, materia: subject, subjectScore: computed, attemptsCount: (recorder ? recorder.getAttempts().length : 0), fecha: saved.fecha || new Date() }); }catch(e){} showResultModal({ title: '¡Ganaste!', autoRedirect: true, redirectAfterMs: 1800 }); }
  }catch(e){}
}

function showResultModal({ title = 'Resultado', message = '', autoRedirect = true, redirectAfterMs = 1600 } = {}){
  try{
    let overlay = document.getElementById('nc-result-modal');
    if (!overlay){ overlay = document.createElement('div'); overlay.id = 'nc-result-modal'; overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center'; overlay.style.background = 'rgba(0,0,0,0.6)'; overlay.style.zIndex = '10000'; const panel = document.createElement('div'); panel.style.background = '#fff'; panel.style.padding = '20px'; panel.style.borderRadius = '10px'; panel.style.minWidth = '340px'; panel.style.textAlign = 'center'; panel.innerHTML = `<div class="nc-result-title" style="font-weight:700;font-size:18px;margin-bottom:8px">${title}</div><div class="nc-result-body" style="margin-bottom:12px">${message}</div><div><button id="nc-result-ok" style="padding:8px 12px;background:#1E6F5C;color:white;border:none;border-radius:6px;">Ir al perfil</button></div>`; overlay.appendChild(panel); document.body.appendChild(overlay); document.getElementById('nc-result-ok').addEventListener('click', ()=>{ try{ window.location.href = '/src/pages/perfil/perfil.html'; }catch(e){} }); } else { overlay.querySelector('.nc-result-title').textContent = title; overlay.querySelector('.nc-result-body').textContent = message; overlay.style.display = 'flex'; }
    if (autoRedirect){ setTimeout(()=>{ try{ window.location.href = '/src/pages/perfil/perfil.html'; }catch(e){} }, redirectAfterMs); }
  }catch(e){}
}

class BiologiaGame extends Game {
  constructor(opts = {}) { super({ id: 'biologia', name: 'Biología', assets: opts.assets }) }
  async init(container) { await super.init(container); container.innerHTML = ''; const root = document.createElement('div'); root.className = 'game-root'; root.innerHTML = `<h2 class="game-header">Juego de Memoria - Biología</h2><div class="game-canvas">Contenido del juego de Biología</div>`; container.appendChild(root) }
}

export default new BiologiaGame()

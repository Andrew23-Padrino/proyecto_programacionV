import { firebaseServices_ap } from '/src/games/originales/firebase-services.js';
import MatchRecorder from './MatchRecorder.js';

export default class CannonGame {
  constructor(canvasId, options = {}){
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.angleEl = document.getElementById('angle');
    this.powerEl = document.getElementById('power');
    this.angleVal = document.getElementById('angleVal');
    this.powerVal = document.getElementById('powerVal');
    this.hintBtn = document.getElementById('hint');
    this.autoAngleBtn = document.getElementById('auto-angle');
    this.hintOutput = document.getElementById('hint-output');
    this.hintSuggestions = document.getElementById('hint-suggestions');
    this.manualDistanceEl = document.getElementById('manual-distance');
    this.setDistanceBtn = document.getElementById('set-distance');
    this.clearDistanceBtn = document.getElementById('clear-distance');
    this.simulateShotBtn = document.getElementById('simulate-shot');
    this.launchBtn = document.getElementById('launch');
    this.resetBtn = document.getElementById('reset');
    this.resultEl = document.getElementById('result');
    this.wsStatus = document.getElementById('ws-status');
    this.ws = null;
    this.playerId = null;
    this.myTurn = false;
    this.options = options || {};
    this.botMode = !!this.options.vsBot;
    this.lessonScore = Number(this.options.lessonScore || 0);
    this.botActive = false;
    this.finished = false;
    this.recorder = new MatchRecorder();
    this.init();
  }

  init(){
    try{ console.log('CannonGame: init() starting'); }catch(e){}
    this.canvas.width = this.canvas.clientWidth * devicePixelRatio;
    this.canvas.height = this.canvas.clientHeight * devicePixelRatio;
    this.ctx.scale(devicePixelRatio, devicePixelRatio);
    if (!this.hintOutput) {
      try{
        const container = document.createElement('div');
        container.id = 'hint-output';
        container.className = 'mt-3 text-sm text-gray-700';
        const parent = document.querySelector('#distance')?.parentElement || document.body;
        parent.appendChild(container);
        this.hintOutput = container;
        console.warn('CannonGame: hint-output was missing; created fallback container.');
      }catch(e){ console.error('CannonGame: could not create hint-output fallback', e); }
    }
    this.angleEl.addEventListener('input', ()=> this.angleVal.textContent = this.angleEl.value);
    this.powerEl.addEventListener('input', ()=> this.powerVal.textContent = this.powerEl.value);
    this.launchBtn.addEventListener('click', ()=> this.onLaunch());
    this.resetBtn.addEventListener('click', ()=> this.reset());
    if (this.hintBtn) this.hintBtn.addEventListener('click', ()=> this.onHint());
    if (this.autoAngleBtn) this.autoAngleBtn.addEventListener('click', ()=> this.onAutoAngle());
    if (this.setDistanceBtn) this.setDistanceBtn.addEventListener('click', ()=> {
      const v = Number(this.manualDistanceEl.value);
      if (v && v > 0) {
        this.distance = v;
        if (this.distanceEl) this.distanceEl.textContent = v;
        this.drawBattlefield();
        if (this.hintOutput) this.hintOutput.textContent = 'Distancia manual establecida.';
      } else {
        if (this.hintOutput) this.hintOutput.textContent = 'Introduce una distancia válida (>0).';
      }
    });
    if (this.clearDistanceBtn) this.clearDistanceBtn.addEventListener('click', ()=> {
      this.distance = 0;
      if (this.distanceEl) this.distanceEl.textContent = '—';
      this.drawBattlefield();
      if (this.hintOutput) this.hintOutput.textContent = 'Distancia manual borrada.';
    });
    if (this.simulateShotBtn) this.simulateShotBtn.addEventListener('click', ()=>{
      try{
        const curUidSim = (firebaseServices_ap && firebaseServices_ap.auth && firebaseServices_ap.auth.currentUser) ? firebaseServices_ap.auth.currentUser.uid : null;
        if (!curUidSim) { try{ showLoginRequiredModal({ message: 'Debes iniciar sesión para usar esta función.' }); }catch(e){}; return; }
        const angle = Number(this.angleEl.value) || 45;
        const power = Number(this.powerEl.value) || 40;
        const opponentFrom = (this.playerId === 1) ? 2 : 1;
        const shooterUid = (firebaseServices_ap.auth.currentUser ? firebaseServices_ap.auth.currentUser.uid : 'LOCAL') + '-sim';
        this.drawShot(angle, power, '#1c7ed6', opponentFrom, shooterUid);
      }catch(e){ console.error('simulateShot error', e); }
    });
    this.connectWS();
    if (this.botMode) this.enableBot();
    try{
      this.userUid = (firebaseServices_ap && firebaseServices_ap.auth && firebaseServices_ap.auth.currentUser) ? firebaseServices_ap.auth.currentUser.uid : null;
      if (firebaseServices_ap && firebaseServices_ap.auth && typeof firebaseServices_ap.auth.onAuthStateChanged === 'function'){
        firebaseServices_ap.auth.onAuthStateChanged((u)=>{ this.userUid = u ? u.uid : null; try{ this.updateAuthUI(); }catch(e){} });
      }
    }catch(e){ console.warn('Auth subscribe failed', e); }
    this.distance = 0; this.failedAttempts = 0; this.distanceEl = document.getElementById('distance'); this.padding = 40; this.scale = 1; this.reset();
  }

  updateAuthUI(){
    const isAuthed = !!this.userUid;
    try{
      if (this.launchBtn) { if (!isAuthed) { this.launchBtn.setAttribute('disabled',''); this.launchBtn.title = 'Inicia sesión para jugar'; } else { this.launchBtn.removeAttribute('disabled'); this.launchBtn.title = ''; } }
      if (this.simulateShotBtn) { if (!isAuthed) { this.simulateShotBtn.setAttribute('disabled',''); this.simulateShotBtn.title = 'Inicia sesión para usar simulate'; } else { this.simulateShotBtn.removeAttribute('disabled'); this.simulateShotBtn.title = ''; } }
    }catch(e){ console.warn('updateAuthUI error', e); }
  }

  connectWS(){
    const defaultUrl = (location.protocol === 'https:' ? 'wss' : 'ws') + '://'+(location.hostname || 'localhost')+':8080';
    const wsUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WS_URL) ? import.meta.env.VITE_WS_URL : defaultUrl;
    try {
      this.ws = new WebSocket(wsUrl);
    } catch (e) {
      console.warn('WebSocket connection failed to', wsUrl, e);
      this.ws = null;
      if (this.wsStatus) { this.wsStatus.textContent = 'Desconectado'; this.wsStatus.className = 'text-red-600'; }
      return;
    }
    this.ws.addEventListener('open', ()=>{ this.wsStatus.textContent = 'Conectado'; this.wsStatus.className='text-green-600'; });
    this.ws.addEventListener('close', ()=>{ this.wsStatus.textContent = 'Desconectado'; this.wsStatus.className='text-red-600'; });
    this.ws.addEventListener('message', (ev)=> this.onMessage(ev));
    this.ws.addEventListener('open', ()=>{ const uid = firebaseServices_ap.auth.currentUser ? firebaseServices_ap.auth.currentUser.uid : null; try{ this.ws.send(JSON.stringify({ type: 'identify', uid })); }catch(e){} });
    setTimeout(()=>{ if (this.botMode && !this.opponentUid) { this.enableBot(); } }, 2500);
  }

  onMessage(ev){
    let msg; try{ msg = JSON.parse(ev.data);}catch(e){return}
    if(msg.type === 'assign'){ this.playerId = msg.player; this.wsStatus.textContent = `Conectado (jugador ${this.playerId})`; }
    else if(msg.type === 'start'){ this.distance = msg.distance || this.distance; this.opponentUid = msg.opponentUid || null; if(this.distanceEl) this.distanceEl.textContent = this.distance; this.myTurn = msg.turn === this.playerId; this.reset(); this.updateTurnUI(); }
    else if(msg.type === 'shot'){ const from = msg.from || 2; const shooterUid = msg.uid || null; const color = from === this.playerId ? '#ff4d4d' : '#1c7ed6'; this.drawShot(msg.angle, msg.power, color, from, shooterUid); if(msg.from && msg.from !== this.playerId){ this.myTurn = true; this.updateTurnUI(); } if (this.botActive) this.scheduleBotTurn(); }
  }

  updateTurnUI(){ if (this.finished) { this.launchBtn.setAttribute('disabled',''); this.launchBtn.textContent = 'Partida finalizada'; return; } if(this.myTurn){ this.launchBtn.removeAttribute('disabled'); this.launchBtn.textContent = 'Tu turno: Disparar'; } else { this.launchBtn.setAttribute('disabled',''); this.launchBtn.textContent = 'Esperando oponente'; } }

  enableBot(){ if (this.botActive) return; this.botActive = true; this.opponentUid = 'BOT'; if (!this.playerId) this.playerId = 1; this.myTurn = (this.playerId === 1); this.updateTurnUI(); if (this.hintOutput) this.hintOutput.textContent = 'Modo Bot activado — jugando contra IA local.'; }

  scheduleBotTurn(){ if (!this.botActive) return; if (this.finished) return; if (this.myTurn) return; setTimeout(()=>{ try{ const R = Number(this.distance) || 200; const angle = 30 + Math.random()*40; let power = this.computeRequiredPower(angle, R); if (!power) power = 40; power = Math.round(power * (0.9 + Math.random()*0.3)); const from = (this.playerId === 1) ? 2 : 1; this.drawShot(angle, power, '#1c7ed6', from, 'BOT'); this.myTurn = true; this.updateTurnUI(); }catch(e){ console.error('Bot error', e); } }, 800 + Math.random()*800); }

  onLaunch(){ if (this.finished) return; if(!this.myTurn) return; const curUid = (firebaseServices_ap && firebaseServices_ap.auth && firebaseServices_ap.auth.currentUser) ? firebaseServices_ap.auth.currentUser.uid : null; if (!curUid) { try{ showLoginRequiredModal({ message: 'Debes iniciar sesión para disparar.' }); }catch(e){}; return; } const angle = Number(this.angleEl.value); const power = Number(this.powerEl.value); const uid = firebaseServices_ap.auth.currentUser ? firebaseServices_ap.auth.currentUser.uid : null; this.drawShot(angle, power, '#ff4d4d', this.playerId || 1, uid); if(this.ws && this.ws.readyState === WebSocket.OPEN){ this.ws.send(JSON.stringify({type:'shot', angle, power, uid})); } this.myTurn = false; this.updateTurnUI(); if (this.botActive) this.scheduleBotTurn(); }

  async endGame({ winnerUid, loserUid, distance = null, angle = null, power = null, points = 0, shooterIsLocal = false }){
    if (this.finished) return; this.finished = true; this.myTurn = false; this.updateTurnUI(); if (this.hintOutput) this.hintOutput.textContent = 'Partida finalizada.'; const localUid = firebaseServices_ap.auth.currentUser ? firebaseServices_ap.auth.currentUser.uid : null;
    try{
      if (winnerUid && localUid && winnerUid === localUid) {
        if (points && Number(points) !== 0) { await firebaseServices_ap.addPointsToUser_ap(localUid, points); }
        let computed = 20 - (3 * (this.failedAttempts || 0)) + (Number(this.lessonScore) || 0);
        if (computed > 20) computed = 20; if (computed < 0) computed = 0; await firebaseServices_ap.setSubjectGrade_ap(localUid, 'fisica', computed);
        const saved = await firebaseServices_ap.addMatchResult_ap({ winnerUid, loserUid, distance, angle, power, pointsAwarded: points, materia: 'fisica', subjectScore: computed, attempts: this.recorder.getAttempts() });
        try{ await firebaseServices_ap.addUserMatchSummary_ap(localUid, { partidaId: saved.id, winnerUid, loserUid, distance, pointsAwarded: points, materia: 'fisica', subjectScore: computed, attemptsCount: this.recorder.getAttempts().length, fecha: saved.fecha || new Date() }); }catch(e){ console.warn('Could not save user summary for winner', e); }
      } else {
        if (localUid && loserUid && localUid === loserUid) {
          try{ await firebaseServices_ap.addPointsToUser_ap(localUid, -5); if (this.hintOutput) this.hintOutput.textContent = 'Has perdido 5 puntos.'; }catch(e){ console.warn('No se pudo restar puntos al perder', e); }
          const saved = await firebaseServices_ap.addMatchResult_ap({ winnerUid, loserUid, distance, angle, power, pointsAwarded: 0, materia: 'fisica', attempts: this.recorder.getAttempts() });
          try{ if (localUid && localUid === loserUid) { await firebaseServices_ap.addUserMatchSummary_ap(localUid, { partidaId: saved.id, winnerUid, loserUid, distance, pointsAwarded: 0, materia: 'fisica', attemptsCount: this.recorder.getAttempts().length, fecha: saved.fecha || new Date(), pointsDelta: -5 }); } }catch(e){ console.warn('Could not save user summary for loser', e); }
        } else {
          try{ await firebaseServices_ap.addMatchResult_ap({ winnerUid, loserUid, distance, angle, power, pointsAwarded: points || 0, materia: 'fisica', attempts: this.recorder.getAttempts() }); }catch(e){}
        }
      }
    }catch(e){ console.warn('endGame: error saving results', e); }
    try{
      const isLocalWinner = (!!winnerUid && !!localUid && winnerUid === localUid);
      const isLocalLoser = (!!loserUid && !!localUid && loserUid === localUid);
      let title = 'Partida finalizada'; let message = 'La partida ha terminado.';
      if (isLocalWinner) { title = '¡Ganaste!'; message = 'Has vencido en la partida. Serás redirigido a tu perfil.'; }
      else if (isLocalLoser) { title = 'Perdiste'; message = 'Has perdido la partida. Serás redirigido a tu perfil.'; }
      else { message = 'Resultado conocido — serás redirigido al perfil.'; }
      this.showResultModal({ title, message, autoRedirect: true, redirectAfterMs: 2000 });
    }catch(e){ console.warn('showResultModal failed', e); }
  }

  showResultModal({ title = 'Resultado', message = '', autoRedirect = false, redirectAfterMs = 1800 } = {}){
    try{
      if (this._resultModal) {
        const t = this._resultModal.querySelector('.result-title'); const m = this._resultModal.querySelector('.result-message'); if (t) t.textContent = title; if (m) m.textContent = message; this._resultModal.style.display = 'flex';
      } else {
        const overlay = document.createElement('div'); overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center'; overlay.style.background = 'rgba(0,0,0,0.6)'; overlay.style.zIndex = '9999';
        const panel = document.createElement('div'); panel.style.background = '#fff'; panel.style.padding = '22px'; panel.style.borderRadius = '10px'; panel.style.minWidth = '280px'; panel.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; panel.style.textAlign = 'center';
        const h = document.createElement('div'); h.className = 'result-title'; h.style.fontSize = '20px'; h.style.fontWeight = '700'; h.style.marginBottom = '8px'; h.textContent = title;
        const p = document.createElement('div'); p.className = 'result-message'; p.style.fontSize = '14px'; p.style.color = '#333'; p.style.marginBottom = '14px'; p.textContent = message;
        const btn = document.createElement('button'); btn.textContent = 'Ir al perfil'; btn.className = 'btn-result'; btn.style.padding = '8px 12px'; btn.style.borderRadius = '6px'; btn.style.border = 'none'; btn.style.background = '#0b74de'; btn.style.color = '#fff'; btn.style.cursor = 'pointer';
        btn.addEventListener('click', ()=>{ try{ window.location.href = '/src/pages/perfil/perfil.html'; }catch(e){ console.warn('Redirect failed', e); } });
        panel.appendChild(h); panel.appendChild(p); panel.appendChild(btn); overlay.appendChild(panel); document.body.appendChild(overlay); this._resultModal = overlay;
      }
      try{ this.launchBtn.setAttribute('disabled',''); }catch(e){}
      if (autoRedirect) { setTimeout(()=>{ try{ window.location.href = '/src/pages/perfil/perfil.html'; }catch(e){ console.warn('Auto redirect failed', e); } }, redirectAfterMs); }
    }catch(e){ console.warn('showResultModal error', e); }
  }

  drawGround(){ const ctx = this.ctx; const canvas = this.canvas; ctx.fillStyle = '#dfe7dd'; ctx.fillRect(0, canvas.clientHeight-40, canvas.clientWidth, 40); }

  toCanvasX(x){ return this.padding + x * this.scale + 30; }
  toCanvasY(y){ return this.canvas.clientHeight - 40 - y * this.scale; }

  computeScale(){ const canvas = this.canvas; const availableWidth = Math.max(100, canvas.clientWidth - this.padding*2 - 60); const worldWidth = Math.max(this.distance, 100); const scaleX = availableWidth / worldWidth; const scaleY = Math.max(1, (canvas.clientHeight - 80) / 100); this.scale = Math.min(scaleX, scaleY); return this.scale; }

  computeRequiredPower(angleDeg, R){ const g = 9.81; const angle = angleDeg * Math.PI / 180; const s2 = Math.sin(2*angle); if (s2 <= 0) return null; const v2 = (R * g) / s2; if (v2 <= 0) return null; return Math.sqrt(v2); }

  computeAngleForPower(v, R){ const g = 9.81; const val = (R * g) / (v*v); if (val > 1 || val < -1) return null; const twoTheta = Math.asin(val); const theta = twoTheta / 2; return theta * 180 / Math.PI; }

  computeRequiredPowerWithSteps(angleDeg, R){ const g = 9.81; const angle = angleDeg * Math.PI / 180; const s2 = Math.sin(2*angle); if (s2 <= 0) return {value: null, steps: 'sin(2θ) ≤ 0 — ángulo no válido para cálculo de alcance.'}; const v2 = (R * g) / s2; if (v2 <= 0) return {value: null, steps: 'Resultado inválido (v² <= 0).'}; const v = Math.sqrt(v2); const steps = `Usando R = v²·sin(2θ)/g → v² = R·g / sin(2θ)\nCon R=${R}, g=${g.toFixed(2)}, θ=${angleDeg}° → sin(2θ)=${s2.toFixed(4)}\nEntonces v² = ${ (R*g).toFixed(4) } / ${ s2.toFixed(4) } ≈ ${ v2.toFixed(4) }\nv = √(${ v2.toFixed(4) }) ≈ ${ v.toFixed(3) }`; return { value: v, steps }; }

  computeAngleSolutionsForPower(v, R){ const g = 9.81; const val = (R * g) / (v*v); if (val > 1 || val < -1) return null; const twoThetaA = Math.asin(val); const twoThetaB = Math.PI - twoThetaA; const thetaA = twoThetaA / 2; const thetaB = twoThetaB / 2; const degA = thetaA * 180 / Math.PI; const degB = thetaB * 180 / Math.PI; return [degA, degB].sort((a,b)=>a-b); }

  drawTrajectory(angleDeg, power, color = '#2b8a3e', fromPlayer = 1){ const g=9.81; const angle = angleDeg*Math.PI/180; const v0=power; const x0 = (fromPlayer === 1) ? 0 : (this.distance && this.distance>0 ? this.distance : Math.max(100, Math.round((this.canvas.clientWidth - this.padding*2 - 60) / Math.max(this.scale,1)))); const vx = (fromPlayer === 1 ? 1 : -1) * v0 * Math.cos(angle); const vy = v0 * Math.sin(angle); const tFlight = (2*vy)/g; const steps = 200; const points = []; for(let i=0;i<=steps;i++){ const t = tFlight * (i/steps); const x = x0 + vx * t; const y = vy * t - 0.5 * g * t * t; points.push({x,y}); } this.drawBattlefield(); const ctx = this.ctx; ctx.beginPath(); ctx.moveTo(this.toCanvasX(points[0].x), this.toCanvasY(points[0].y)); for (let p of points) ctx.lineTo(this.toCanvasX(p.x), this.toCanvasY(p.y)); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash([6,4]); ctx.stroke(); ctx.setLineDash([]); const last = points[points.length-1]; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(this.toCanvasX(last.x), this.toCanvasY(0), 6, 0, Math.PI*2); ctx.fill(); }

  async drawShot(angleDeg, power, color, fromPlayer = 1, shooterUid = null){ const g=9.81; const angle = angleDeg*Math.PI/180; const v0=power; const x0 = (fromPlayer === 1) ? 0 : this.distance; const vx = (fromPlayer === 1 ? 1 : -1) * v0 * Math.cos(angle); const vy = v0 * Math.sin(angle); const tFlight = (2*vy)/g; const steps = 120; const estimatedRange = Math.abs(v0 * Math.cos(angle) * tFlight) || 1; this.computeScale(); const canvas = this.canvas; const availableWidth = Math.max(100, canvas.clientWidth - this.padding*2 - 60); const defaultWorld = Math.max(100, Math.round(availableWidth / Math.max(this.scale, 1))); const effectiveDistance = (this.distance && this.distance > 0) ? this.distance : defaultWorld; const points = []; for(let i=0;i<=steps;i++){ const t = tFlight * (i/steps); const x = x0 + vx * t; const y = vy * t - 0.5 * g * t * t; points.push({x,y}); } this.drawBattlefield(); const ctx = this.ctx; ctx.beginPath(); ctx.moveTo(this.toCanvasX(points[0].x), this.toCanvasY(points[0].y)); for(let p of points){ ctx.lineTo(this.toCanvasX(p.x), this.toCanvasY(p.y)); } ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke(); const last = points[points.length-1]; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(this.toCanvasX(last.x), this.toCanvasY(0), 6, 0, Math.PI*2); ctx.fill(); const targetX = (fromPlayer === 1) ? effectiveDistance : 0; const hitTolerance = Math.max(6, effectiveDistance * 0.03); const landed = last.x; const hit = Math.abs(landed - targetX) <= hitTolerance; try{ this.recorder.recordAttempt({ angle: angleDeg, power: v0, landed: landed, targetX: targetX, hit: hit, fromPlayer, shooterUid }); }catch(e){ console.warn('recorder error', e); }
    if(hit){ if (this.finished) return; ctx.fillStyle = 'orange'; ctx.beginPath(); ctx.arc(this.toCanvasX(landed), this.toCanvasY(0), 18, 0, Math.PI*2); ctx.fill(); this.resultEl.textContent = `¡Impacto! Alcance ≈ ${landed.toFixed(1)} m`; const localUid = firebaseServices_ap.auth.currentUser ? firebaseServices_ap.auth.currentUser.uid : null; const shooterIsLocal = shooterUid && localUid ? (shooterUid === localUid) : (fromPlayer === this.playerId); if (shooterIsLocal && localUid) { const loserUid = this.opponentUid || null; if (loserUid && loserUid === localUid) { console.warn('Detected same UID for winner and loser — skipping points/match save to avoid corrupt data.'); } else { const points = 10; try{ await this.endGame({ winnerUid: localUid, loserUid, distance: this.distance || null, angle: angleDeg, power, points, shooterIsLocal: true }); }catch(e){ console.warn('No se pudo guardar resultado en Firestore (ganador):', e); } } } else { if (!shooterIsLocal && shooterUid && localUid){ if (shooterUid === localUid) { console.warn('Shooter UID equals local UID in receiver branch — skipping save.'); } else { try{ await this.endGame({ winnerUid: shooterUid, loserUid: localUid, distance: this.distance || null, angle: angleDeg, power, points: 0 }); }catch(e){ console.warn('No se pudo guardar resultado en Firestore (perdedor):', e); } } } } } else { this.resultEl.textContent = `Alcance ≈ ${landed.toFixed(1)} m • Error ${ (landed - targetX).toFixed(1)} m`; try{ const localUidForCount = firebaseServices_ap.auth.currentUser ? firebaseServices_ap.auth.currentUser.uid : null; const shooterIsLocalForCount = shooterUid && localUidForCount ? (shooterUid === localUidForCount) : (fromPlayer === this.playerId); if (shooterIsLocalForCount) this.failedAttempts = (this.failedAttempts || 0) + 1; }catch(e){} }
  }

  onHint(){ try{ console.log('CannonGame: hint requested — distance=', this.distance); }catch(e){} const R = Number(this.distance) || 0; if (!R || R <= 0) { const msg = 'Distancia objetivo no definida. Usa "Usar distancia" o espera a que empiece la partida.'; if (this.hintOutput) this.hintOutput.textContent = msg; else alert(msg); return; } const angle = 45; const v = this.computeRequiredPower(angle, R); if (!v) { const msg = 'No se pudo calcular la potencia necesaria con el ángulo seleccionado.'; if (this.hintOutput) this.hintOutput.textContent = msg; else alert(msg); return; } const suggested = Math.round(v); const maxPower = Number(this.powerEl.max) || 1000; const applied = Math.min(suggested, maxPower); this.angleEl.value = angle; this.angleVal.textContent = angle; this.powerEl.value = applied; this.powerVal.textContent = applied; const outMsg = `Sugerencia: ángulo ${angle}°, potencia ${suggested}${applied < suggested ? ' (limitada al máximo del control)' : ''}.`; if (this.hintOutput) this.hintOutput.innerHTML = outMsg; else alert(outMsg); }

  onAutoAngle(){ const power = Number(this.powerEl.value); const R = Number(this.distance) || 0; if (!R || R <= 0){ if (this.hintOutput) this.hintOutput.textContent = 'Distancia objetivo no definida. Usa "Usar distancia" o espera a que empiece la partida.'; return; } const sols = this.computeAngleSolutionsForPower(power, R); if (!sols){ if (this.hintOutput) this.hintOutput.textContent = 'Con la potencia actual no es posible alcanzar esa distancia (val fuera de rango).'; return; } const [a1,a2] = sols.map(x=>Math.round(x)); const html = `<div class="p-3 bg-white rounded border">`+ `<div class="font-semibold mb-2">Ángulos posibles para v=${power}</div>`+ `<div class="text-sm">Solución 1 (ángulo bajo): <strong>${a1}°</strong></div>`+ `<div class="text-sm">Solución 2 (ángulo alto): <strong>${a2}°</strong></div>`+ `<div class="mt-2 flex gap-2"><button id="apply-angle-1" class="btn btn-sm btn-primary">Usar ${a1}°</button><button id="preview-angle-1" class="btn btn-sm btn-ghost">Vista previa</button><button id="apply-angle-2" class="btn btn-sm btn-outline">Usar ${a2}°</button><button id="preview-angle-2" class="btn btn-sm btn-ghost">Vista previa</button></div>`+ `</div>`; if (this.hintOutput) this.hintOutput.innerHTML = html; setTimeout(()=>{ const apply1 = document.getElementById('apply-angle-1'); const preview1 = document.getElementById('preview-angle-1'); const apply2 = document.getElementById('apply-angle-2'); const preview2 = document.getElementById('preview-angle-2'); if (apply1) apply1.addEventListener('click', ()=>{ this.angleEl.value = a1; this.angleVal.textContent = a1; this.hintOutput.textContent = `Ángulo ${a1}° aplicado.`; }); if (apply2) apply2.addEventListener('click', ()=>{ this.angleEl.value = a2; this.angleVal.textContent = a2; this.hintOutput.textContent = `Ángulo ${a2}° aplicado.`; }); if (preview1) preview1.addEventListener('click', ()=>{ this.drawTrajectory(a1, power, '#06b6d4', this.playerId || 1); }); if (preview2) preview2.addEventListener('click', ()=>{ this.drawTrajectory(a2, power, '#a78bfa', this.playerId || 1); }); },50); }

  reset(){ this.angleEl.value = 45; this.powerEl.value = 40; this.angleVal.textContent = 45; this.powerVal.textContent = 40; this.resultEl.textContent = '—'; this.ctx.clearRect(0,0,this.canvas.clientWidth,this.canvas.clientHeight); this.drawBattlefield(); }

  drawBattlefield(){ const ctx = this.ctx; const canvas = this.canvas; ctx.clearRect(0,0,canvas.clientWidth, canvas.clientHeight); this.drawGround(); const scale = this.computeScale(); const availableWidth = Math.max(100, canvas.clientWidth - this.padding*2 - 60); const defaultWorld = Math.max(100, Math.round(availableWidth / Math.max(this.scale, 1))); const effectiveDistance = (this.distance && this.distance > 0) ? this.distance : defaultWorld; const leftX = this.toCanvasX(0); const rightX = this.toCanvasX(effectiveDistance); const baseY = canvas.clientHeight - 60; ctx.save(); ctx.translate(leftX, baseY); ctx.fillStyle = '#333'; ctx.fillRect(-6, 0, 24, 12); ctx.fillStyle = '#666'; ctx.fillRect(4, -8, 26, 8); ctx.restore(); ctx.fillStyle = '#222'; ctx.font = '12px Arial'; ctx.fillText('Cañón A', leftX-18, baseY+28); ctx.save(); ctx.translate(rightX, baseY); ctx.scale(-1,1); ctx.fillStyle = '#333'; ctx.fillRect(-6, 0, 24, 12); ctx.fillStyle = '#666'; ctx.fillRect(4, -8, 26, 8); ctx.restore(); ctx.fillStyle = '#222'; ctx.fillText('Cañón B', rightX-12, baseY+28); ctx.fillStyle = '#0b74de'; ctx.beginPath(); ctx.arc(leftX, baseY+6, 6,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(rightX, baseY+6, 6,0,Math.PI*2); ctx.fill(); }
}

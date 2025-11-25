import MatchRecorder from './MatchRecorder.js';
import { firebaseServices_ap } from '../originales/firebase-services.js';

export default class BombGame {
  constructor(canvasId, options = {}){
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.wires = ['red','blue','green'];
    this.resetBtn = document.getElementById('reset');
    this.statusEl = document.getElementById('status');
    // store options early
    this.options = options || {};
    // If lesson provided a teaching order, use it; otherwise randomize
    if (this.options && Array.isArray(this.options.lessonOrder) && this.options.lessonOrder.length === this.wires.length) {
      this.secret = this.options.lessonOrder.slice();
    } else {
      this.secret = this.shuffle(this.wires);
    }
    this.attempt = [];
    this.wirePositions = [];
    this.recorder = new MatchRecorder();
    this.lessonScore = Number(this.options.lessonScore || 0);
    this.failedAttempts = 0;
    this.finished = false;
    this.particles = [];
    this._time = 0;
    this._animRunning = false;
    this.colorDescriptions = {
      red: 'Rojo — Fuente (conductor)',
      blue: 'Azul — Nodo intermedio',
      green: 'Verde — Tierra/seguro'
    };
    this.init();
  }

  shuffle(arr){ return arr.slice().sort(()=>Math.random()-0.5); }

  init(){
    if (!this.canvas) return;
    this.setCanvasSize();
    // handle resize
    window.addEventListener('resize', ()=>{ this.setCanvasSize(); this.draw(); });
    if (this.resetBtn) this.resetBtn.addEventListener('click', ()=>this.reset());
    // hint button
    this.hintBtn = document.getElementById('hint');
    if (this.hintBtn) this.hintBtn.addEventListener('click', ()=> this.revealHint());
    // mouse hover for wire highlight
    this.canvas.addEventListener('mousemove', (e)=> this.onMouseMove(e));
    this.canvas.addEventListener('mouseleave', ()=>{ this.hoverWire = null; this.draw(); });
    this.canvas.addEventListener('click', (e)=>this.onClick(e));
    this.reset();
    // start animation loop for subtle motion + particles
    if (!this._animRunning){ this._animRunning = true; requestAnimationFrame(this._loop.bind(this)); }
  }

  setCanvasSize(){
    const ratio = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = Math.max(1, Math.floor(w * ratio));
    this.canvas.height = Math.max(1, Math.floor(h * ratio));
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(ratio,0,0,ratio,0,0);
  }

  _loop(ts){
    this._time = ts || performance.now();
    this.draw(this._time);
    // update particles
    if (this.particles.length){
      for (let i = this.particles.length-1;i>=0;i--){
        const p = this.particles[i]; p.life -= 16; if (p.life<=0) this.particles.splice(i,1);
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.alpha = Math.max(0, p.life/ p.maxLife);
      }
    }
    if (this._animRunning) requestAnimationFrame(this._loop.bind(this));
  }

  reset(){
    // preserve lesson order if provided, otherwise reshuffle
    if (this.options && Array.isArray(this.options.lessonOrder) && this.options.lessonOrder.length === this.wires.length) {
      this.secret = this.options.lessonOrder.slice();
    } else {
      this.secret = this.shuffle(this.wires);
    }
    this.attempt = [];
    this.finished = false;
    this.failedAttempts = 0;
    if (this.statusEl) { this.statusEl.textContent = ''; this.statusEl.className = ''; }
    this.draw();
  }

  onClick(e){
    if (this.finished) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for(let i=0;i<this.wirePositions.length;i++){
      const p = this.wirePositions[i];
      const dx = x - p.x; const dy = y - p.y;
      if(Math.hypot(dx,dy) < 24){ this.cutWire(p.color); break; }
    }
  }

  onMouseMove(e){
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let found = null;
    for (let p of this.wirePositions){ if (Math.hypot(x - p.x, y - p.y) < 24) { found = p; break; } }
    if (found && (!this.hoverWire || this.hoverWire.color !== found.color)) { this.hoverWire = found; this.draw(); }
    else if (!found && this.hoverWire) { this.hoverWire = null; this.draw(); }
  }

  cutWire(color){
    if(this.attempt.length>=3 || this.finished) return;
    this.attempt.push(color);
    // store last cut position for feedback animation
    const posObj = this.wirePositions.find(p => p.color === color) || null;
    if (posObj) this.lastCutPos = { x: posObj.x, y: posObj.y };
    this.recorder.recordAttempt({ color, attemptIndex: this.attempt.length });
    this.draw();
    if(this.attempt.length===3){
      const ok = this.attempt.every((v,i)=>v===this.secret[i]);
      if(ok){ this.onSuccess(); }
      else { this.onFail(); }
    }
  }

  async onSuccess(){
    this.finished = true;
    if (this.statusEl) { this.statusEl.textContent = '¡Bomba desactivada! 🎉'; this.statusEl.className = 'text-green-600'; }
    // visual feedback near last cut position
    try{ if (this.lastCutPos) this.animateExplosion(this.lastCutPos.x, this.lastCutPos.y, '#22c55e'); else this.animateExplosion(this.canvas.clientWidth/2, this.canvas.clientHeight/2, '#22c55e'); }catch(e){}
    const localUid = firebaseServices_ap && firebaseServices_ap.auth && firebaseServices_ap.auth.currentUser ? firebaseServices_ap.auth.currentUser.uid : null;
    try{
      if (localUid){
        const points = 10;
        if (firebaseServices_ap && typeof firebaseServices_ap.addPointsToUser_ap === 'function') await firebaseServices_ap.addPointsToUser_ap(localUid, points);
        let computed = 20 - (3 * (this.failedAttempts || 0)) + (Number(this.lessonScore) || 0);
        computed = Math.max(0, Math.min(20, computed));
        if (firebaseServices_ap && typeof firebaseServices_ap.setSubjectGrade_ap === 'function') await firebaseServices_ap.setSubjectGrade_ap(localUid, 'electricidad', computed);
        let saved = null;
        if (firebaseServices_ap && typeof firebaseServices_ap.addMatchResult_ap === 'function') saved = await firebaseServices_ap.addMatchResult_ap({ winnerUid: localUid, loserUid: null, attempts: this.recorder.getAttempts(), pointsAwarded: points, materia: 'electricidad', subjectScore: computed });
        try{ if (saved && firebaseServices_ap && typeof firebaseServices_ap.addUserMatchSummary_ap === 'function') await firebaseServices_ap.addUserMatchSummary_ap(localUid, { partidaId: saved.id, winnerUid: localUid, loserUid: null, pointsAwarded: points, materia: 'electricidad', subjectScore: computed, attemptsCount: this.recorder.getAttempts().length, fecha: saved.fecha || new Date() }); }catch(e){}
        // show result modal with attempts summary and redirect to profile
        const title = '¡Ganaste!';
        const attempts = this.recorder.getAttempts();
        this.showResultModal({ title, attempts, points, subjectScore: computed, autoRedirect: true, redirectAfterMs: 1800 });
      }
    }catch(e){ console.warn('Saving success result failed', e); }
  }

  async onFail(){
    this.finished = true;
    this.failedAttempts = (this.failedAttempts || 0) + 1;
    if (this.statusEl) { this.statusEl.textContent = 'Fallo — la bomba explota. Intenta de nuevo.'; this.statusEl.className = 'text-red-600'; }
    try{ if (this.lastCutPos) this.animateExplosion(this.lastCutPos.x, this.lastCutPos.y, '#f97316'); else this.animateExplosion(this.canvas.clientWidth/2, this.canvas.clientHeight/2, '#f97316'); }catch(e){}
    const localUid = firebaseServices_ap && firebaseServices_ap.auth && firebaseServices_ap.auth.currentUser ? firebaseServices_ap.auth.currentUser.uid : null;
    try{
      if (localUid){
        if (firebaseServices_ap && typeof firebaseServices_ap.addPointsToUser_ap === 'function') await firebaseServices_ap.addPointsToUser_ap(localUid, -5);
        if (firebaseServices_ap && typeof firebaseServices_ap.addMatchResult_ap === 'function') await firebaseServices_ap.addMatchResult_ap({ winnerUid: null, loserUid: localUid, attempts: this.recorder.getAttempts(), pointsAwarded: 0, materia: 'electricidad' });
      }
      // show fail modal with attempts and redirect
      const attemptsFail = this.recorder.getAttempts();
      const title = 'Has perdido';
      this.showResultModal({ title, attempts: attemptsFail, points: 0, subjectScore: null, autoRedirect: true, redirectAfterMs: 1800 });
    }catch(e){ console.warn('Saving fail result failed', e); }
  }

  // Simple visual explosion/feedback animation
  animateExplosion(x, y, color = '#ff7'){
    // create particles that will be rendered in the animation loop
    const count = 28 + Math.floor(Math.random()*12);
    for (let i=0;i<count;i++){
      const angle = Math.random()*Math.PI*2;
      const speed = 1 + Math.random()*3;
      const vx = Math.cos(angle)*speed;
      const vy = Math.sin(angle)*speed;
      const size = 2 + Math.random()*4;
      this.particles.push({ x, y, vx, vy, size, color, life: 400 + Math.random()*400, maxLife: 400 + Math.random()*400, alpha:1 });
    }
  }

  draw(ts){
    const ctx = this.ctx; const W = this.canvas.clientWidth; const H = this.canvas.clientHeight;
    ctx.clearRect(0,0,W,H);
    // subtle background radial
    const bg = ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0, '#fafafa'); bg.addColorStop(1, '#f2f4f7');
    ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

    // animated time for bobbing
    const t = (ts || performance.now())/800;

    // place the bomb at the center of the canvas
    const bombX = W/2; const bombY = H/2; const bombR = Math.max(36, Math.min(72, Math.min(W, H) / 10));
    const g = ctx.createRadialGradient(bombX - 12, bombY - 12, 6, bombX, bombY, bombR);
    g.addColorStop(0, '#4b4b4b'); g.addColorStop(0.6, '#222'); g.addColorStop(1, '#111');
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 18; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bombX, bombY, bombR, 0, Math.PI*2); ctx.fill(); ctx.restore();
    // fuse/top highlight
    ctx.fillStyle = '#ffefc5'; ctx.beginPath(); ctx.ellipse(bombX - 18, bombY - 36, 8, 4, Math.PI/6, 0, Math.PI*2); ctx.fill();

    // cables - distribute nodes around the bomb in a circle
    const radius = Math.max(120, Math.min((Math.min(W, H) / 2) - 80, 220));
    this.wirePositions = [];
    for(let i=0;i<this.wires.length;i++){
      const color = this.wires[i];
      const ang = -Math.PI/2 + i * (2 * Math.PI / this.wires.length); // start at top and evenly space
      const x = bombX + Math.cos(ang) * radius;
      const y = bombY + Math.sin(ang) * radius + Math.sin(t + i*0.9)*6; // bobbing
      // path from bomb to node - slight curve using midpoint control
      ctx.save();
      const path = new Path2D();
      const cpX = bombX + (x - bombX) / 2; const cpY = bombY + (y - bombY) / 2 - 30 + Math.sin(i + t) * 8;
      const startX = bombX + Math.cos(ang) * (bombR * 0.7);
      const startY = bombY + Math.sin(ang) * (bombR * 0.7);
      path.moveTo(startX, startY);
      path.quadraticCurveTo(cpX, cpY, x, y);
      // gradient along path
      const grad = ctx.createLinearGradient(bombX, bombY, x, y);
      grad.addColorStop(0, '#111'); grad.addColorStop(0.25, color); grad.addColorStop(1, color);
      ctx.lineWidth = 8; ctx.strokeStyle = grad; ctx.stroke(path);
      // subtle outer glow when hover/next
      const isHover = this.hoverWire && this.hoverWire.color === color;
      const nextColor = this.secret[this.attempt.length];
      const isNext = (!this.finished && color === nextColor && this._revealNext);
      if (isHover || isNext){ ctx.shadowBlur = 20; ctx.shadowColor = color; ctx.stroke(path); }
      // node circle with rim and shine
      ctx.beginPath(); ctx.fillStyle = color; ctx.arc(x, y, 18, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.arc(x,y,18,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.ellipse(x-6,y-6,8,5,Math.PI/6,0,Math.PI*2); ctx.fill();
      // cut mark
      const cut = this.attempt.includes(color);
      if(cut){ ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x-12,y-12); ctx.lineTo(x+12,y+12); ctx.moveTo(x+12,y-12); ctx.lineTo(x-12,y+12); ctx.stroke(); }
      ctx.restore();
      this.wirePositions.push({x,y,color});
    }

    // draw particles (explosion)
    if (this.particles.length){
      for (let p of this.particles){
        ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); ctx.restore();
      }
    }

    // Draw hover / next indicators (pulses and moving guide)
    try{
      const now = this._time || performance.now();
      for (let i=0;i<this.wirePositions.length;i++){
        const p = this.wirePositions[i];
        const color = p.color;
        const isHover = this.hoverWire && this.hoverWire.color === color;
        const isNext = (!this.finished && color === this.secret[this.attempt.length] && this._revealNext);
        if (isHover){ this._drawPulse(ctx, p.x, p.y, color, now, 48); this._drawTooltip(ctx, p.x, p.y, this.colorDescriptions[color] || color); }
        if (isNext){
          // moving dot along curve to indicate "follow this wire"
          const angNode = Math.atan2(p.y - bombY, p.x - bombX);
          const spx = bombX + Math.cos(angNode) * (bombR * 0.7);
          const spy = bombY + Math.sin(angNode) * (bombR * 0.7);
          const cpx = bombX + (p.x - bombX)/2; const cpy = bombY + (p.y - bombY)/2 - 30 + Math.sin(i + (now/800))*8;
          const phase = ((now - (this._revealStart || 0)) % 800) / 800; const s = this._easeOutCubic(phase);
          // quadratic bezier point
          const ix = (1 - s)*(1 - s)*spx + 2*(1 - s)*s*cpx + s*s*p.x;
          const iy = (1 - s)*(1 - s)*spy + 2*(1 - s)*s*cpy + s*s*p.y;
          ctx.save(); ctx.beginPath(); ctx.fillStyle = '#fff'; ctx.arc(ix, iy, 6, 0, Math.PI*2); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = color; ctx.stroke(); ctx.restore();
          // pulse and tooltip on target node
          this._drawPulse(ctx, p.x, p.y, color, now, 60);
          this._drawTooltip(ctx, p.x, p.y, `Siguiente: ${this.colorDescriptions[color] || color}`);
        }
      }
    }catch(e){ console.warn('hint draw failed', e); }

    // attempts indicator box
    ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1; ctx.fillRect(12, H-46, 220, 34); ctx.strokeRect(12, H-46, 220, 34);
    ctx.fillStyle = '#333'; ctx.font = '14px Arial';
    const masked = this.attempt.map(()=>'●').concat(new Array(Math.max(0,3-this.attempt.length)).fill('○')).join(' ');
    ctx.fillText('Intentos: ' + masked, 22, H-22);
  }

  // reveal next correct wire briefly; costs 1 failedAttempts
  revealHint(){
    if (this.finished) return;
    // show next as highlighted for 1400ms
    this._revealNext = true;
    this._revealStart = performance.now();
    this.failedAttempts = (this.failedAttempts || 0) + 1;
    // keep reveal for duration ms
    const duration = 1400;
    setTimeout(()=>{ this._revealNext = false; }, duration);
  }

  // small easing helper
  _easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

  // draw a pulsing ring at x,y
  _drawPulse(ctx, x, y, color, t, maxR = 40){
    const phase = (t % 800) / 800; // 0..1
    const r = 12 + this._easeOutCubic(phase) * (maxR - 12);
    ctx.save(); ctx.globalAlpha = 0.6 * (1 - phase);
    ctx.beginPath(); ctx.fillStyle = color; ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // draw a small tooltip near node
  _drawTooltip(ctx, x, y, label){
    const pad = 8; const w = ctx.measureText(label).width + pad*2; const h = 28;
    const tx = x - w/2; const ty = y - 44;
    // background
    ctx.save(); ctx.beginPath(); ctx.fillStyle = 'rgba(255,255,255,0.98)'; ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    const r = 8; ctx.moveTo(tx + r, ty);
    ctx.lineTo(tx + w - r, ty); ctx.quadraticCurveTo(tx + w, ty, tx + w, ty + r);
    ctx.lineTo(tx + w, ty + h - r); ctx.quadraticCurveTo(tx + w, ty + h, tx + w - r, ty + h);
    ctx.lineTo(tx + r, ty + h); ctx.quadraticCurveTo(tx, ty + h, tx, ty + h - r);
    ctx.lineTo(tx, ty + r); ctx.quadraticCurveTo(tx, ty, tx + r, ty);
    ctx.fill(); ctx.stroke();
    // text
    ctx.fillStyle = '#111'; ctx.font = '13px Arial'; ctx.fillText(label, tx + pad, ty + h/2 + 5);
    ctx.restore();
  }

  showResultModal({ title = 'Resultado', message = '', autoRedirect = true, redirectAfterMs = 1600 } = {}){
    try{
      let overlay = document.getElementById('nc-result-modal');
      if (!overlay){
        overlay = document.createElement('div'); overlay.id = 'nc-result-modal';
        overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center'; overlay.style.background = 'rgba(0,0,0,0.6)'; overlay.style.zIndex = '10000';
        const panel = document.createElement('div'); panel.style.background = '#fff'; panel.style.padding = '20px'; panel.style.borderRadius = '10px'; panel.style.minWidth = '340px'; panel.style.maxWidth = '720px'; panel.style.textAlign = 'center'; panel.style.maxHeight = '80vh'; panel.style.overflow = 'auto';
        // content placeholder - will be populated below based on provided args
        panel.innerHTML = `<div class="nc-result-title" style="font-weight:700;font-size:18px;margin-bottom:8px">${title}</div><div class="nc-result-body" style="margin-bottom:12px"></div><div><button id="nc-result-ok" style="padding:8px 12px;background:#1E6F5C;color:white;border:none;border-radius:6px;">Ir al perfil</button></div>`;
        overlay.appendChild(panel); document.body.appendChild(overlay);
        document.getElementById('nc-result-ok').addEventListener('click', ()=>{ try{ window.location.href = '/src/pages/perfil/perfil.html'; }catch(e){} });
      } else {
        overlay.querySelector('.nc-result-title').textContent = title;
        overlay.style.display = 'flex';
      }
      // populate body: if attempts or subjectScore provided, render a small summary
      try{
        const body = overlay.querySelector('.nc-result-body');
        body.innerHTML = '';
        const attempts = arguments[0] && arguments[0].attempts ? arguments[0].attempts : null;
        const pts = arguments[0] && typeof arguments[0].points !== 'undefined' ? arguments[0].points : null;
        const subj = arguments[0] && typeof arguments[0].subjectScore !== 'undefined' ? arguments[0].subjectScore : null;
        if (attempts && attempts.length){
          const aTitle = document.createElement('div'); aTitle.style.fontWeight='600'; aTitle.style.marginBottom='8px'; aTitle.textContent = 'Resumen de intentos';
          body.appendChild(aTitle);
          const table = document.createElement('table'); table.style.width='100%'; table.style.borderCollapse='collapse';
          table.innerHTML = `<thead><tr><th style="text-align:left;padding:6px">#</th><th style="text-align:left;padding:6px">Cable</th><th style="text-align:left;padding:6px">Hora</th></tr></thead>`;
          const tbody = document.createElement('tbody');
          attempts.forEach((at, i)=>{
            const tr = document.createElement('tr');
            tr.innerHTML = `<td style="padding:6px">${i+1}</td><td style="padding:6px">${at.color}</td><td style="padding:6px">${(at.timestamp && at.timestamp.toDate) ? at.timestamp.toDate().toLocaleTimeString() : (new Date(at.timestamp)).toLocaleTimeString()}</td>`;
            tbody.appendChild(tr);
          });
          table.appendChild(tbody); body.appendChild(table);
        }
        if (pts !== null){
          const pdiv = document.createElement('div'); pdiv.style.marginTop='10px'; pdiv.innerHTML = `<strong>Puntos:</strong> ${pts}`; body.appendChild(pdiv);
        }
        if (subj !== null){
          const sdiv = document.createElement('div'); sdiv.style.marginTop='6px'; sdiv.innerHTML = `<strong>Nota (Electricidad):</strong> ${subj} / 20`; body.appendChild(sdiv);
        }
        if (!attempts && !pts && !subj && (message && message.length)){
          body.textContent = message;
        }
      }catch(e){ console.warn('Could not populate result body', e); }

      if (autoRedirect){ setTimeout(()=>{ try{ window.location.href = '/src/pages/perfil/perfil.html'; }catch(e){} }, redirectAfterMs); }
    }catch(e){ console.warn('showResultModal error', e); }
  }
}

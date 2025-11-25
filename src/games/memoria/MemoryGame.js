import Game from '../common/Game.js';

const ANIMALS = ['🐶','🐱','🐭','🐼','🦊','🐵','🐸','🐯'];

export default class MemoryGame extends Game {
  constructor(canvasId, opts = {}){
    super({ id: 'memoria', name: 'Memoria — Animales' });
    this.canvasId = canvasId || 'memoria-canvas';
    this.canvas = null;
    this.ctx = null;
    this.cards = [];
    this.cols = 4;
    this.rows = 4;
    this.cardW = 0;
    this.cardH = 0;
    this.firstPick = null;
    this.busy = false;
    this.matches = 0;
    this.moves = 0;
    this.startTime = 0;
    this._animLoop = false;
    this.options = opts || {};
    this.init();
  }

  init(){
    this.canvas = document.getElementById(this.canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.setCanvasSize();
    window.addEventListener('resize', ()=>{ this.setCanvasSize(); this.draw(); });
    this.canvas.addEventListener('click', (e)=> this.onClick(e));
    this.reset();
    if (!this._animLoop){ this._animLoop = true; requestAnimationFrame(this._loop.bind(this)); }
  }

  setCanvasSize(){
    const ratio = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth || 640;
    const h = this.canvas.clientHeight || 480;
    this.canvas.width = Math.max(1, Math.floor(w * ratio));
    this.canvas.height = Math.max(1, Math.floor(h * ratio));
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(ratio,0,0,ratio,0,0);
    this.cardW = Math.floor((w - 32) / this.cols);
    this.cardH = Math.floor((h - 120) / this.rows);
  }

  _loop(ts){
    this.draw(ts);
    if (this._animLoop) requestAnimationFrame(this._loop.bind(this));
  }

  reset(){
    // create deck: pair each animal
    // clear any existing preview timer
    try{ if (this._previewTimer){ clearTimeout(this._previewTimer); this._previewTimer = null; } }catch(e){}
    const pool = ANIMALS.slice(0, (this.rows*this.cols)/2);
    const deck = pool.concat(pool).map((emoji, idx)=>({ id: idx + '-' + emoji, emoji, revealed: false, matched: false }));
    // shuffle
    for (let i = deck.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i+1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    this.cards = deck;
    this.firstPick = null; this.matches = 0; this.moves = 0; this.startTime = 0;
    // Show preview: reveal all cards for 3 seconds, then hide and start timer
    this.busy = true; // disable clicks during preview
    this.cards.forEach(c=>{ c.revealed = true; c.matched = false; });
    this.draw();
    this._previewTimer = setTimeout(()=>{
      try{
        this.cards.forEach(c=>{ c.revealed = false; });
        this.busy = false;
        this.startTime = performance.now();
        this._previewTimer = null;
        this.draw();
      }catch(e){ console.warn('preview hide failed', e); }
    }, 3000);
  }

  getCardAt(x,y){
    const rect = this.canvas.getBoundingClientRect();
    const cx = x - rect.left; const cy = y - rect.top;
    const paddingLeft = 16; const paddingTop = 80;
    const col = Math.floor((cx - paddingLeft) / this.cardW);
    const row = Math.floor((cy - paddingTop) / this.cardH);
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return null;
    const idx = row * this.cols + col;
    return { idx, col, row };
  }

  onClick(e){
    if (this.busy) return;
    const pos = this.getCardAt(e.clientX, e.clientY);
    if (!pos) return;
    const card = this.cards[pos.idx];
    if (!card || card.revealed || card.matched) return;
    this.revealCard(pos.idx);
  }

  revealCard(idx){
    const card = this.cards[idx];
    if (!card || card.revealed || card.matched) return;
    card.revealed = true; this.draw();
    if (!this.firstPick){ this.firstPick = { idx, card }; return; }
    // second pick
    this.busy = true; this.moves += 1;
    const first = this.firstPick; const second = { idx, card };
    if (first.card.emoji === second.card.emoji){
      // match
      this.cards[first.idx].matched = true; this.cards[second.idx].matched = true;
      this.matches += 1; this.firstPick = null; this.busy = false; this.draw();
      if (this.matches === (this.rows*this.cols)/2) setTimeout(()=> this.showWinModal(), 400);
    } else {
      // not match: flip back
      setTimeout(()=>{
        this.cards[first.idx].revealed = false; this.cards[second.idx].revealed = false; this.firstPick = null; this.busy = false; this.draw();
      }, 800);
    }
  }

  showWinModal(){
    try{
      let overlay = document.getElementById('nc-memoria-result');
      if (!overlay){
        overlay = document.createElement('div'); overlay.id = 'nc-memoria-result';
        overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center'; overlay.style.background = 'rgba(0,0,0,0.6)'; overlay.style.zIndex = '10000';
        const panel = document.createElement('div'); panel.style.background = '#fff'; panel.style.padding = '18px'; panel.style.borderRadius = '10px'; panel.style.minWidth = '300px'; panel.style.textAlign = 'center';
        panel.innerHTML = `<div style="font-weight:700;font-size:18px;margin-bottom:8px">¡Ganaste! 🐾</div><div style="margin-bottom:8px">Movimientos: ${this.moves}</div><div style="margin-bottom:12px">Tiempo: ${Math.round((performance.now()-this.startTime)/1000)} s</div><div><button id="nc-memoria-restart" style="padding:8px 12px;background:#1E6F5C;color:white;border:none;border-radius:6px;">Jugar otra vez</button></div>`;
        overlay.appendChild(panel); document.body.appendChild(overlay);
        document.getElementById('nc-memoria-restart').addEventListener('click', ()=>{ overlay.remove(); this.reset(); });
      } else { overlay.style.display = 'flex'; }
    }catch(e){ console.warn('showWinModal error', e); }
  }

  draw(){
    if (!this.ctx) return;
    const ctx = this.ctx; const W = this.canvas.clientWidth; const H = this.canvas.clientHeight;
    ctx.clearRect(0,0,W,H);
    // background
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(0,0,W,H);
    // title area
    ctx.fillStyle = '#111827'; ctx.font = '20px Arial'; ctx.fillText('Memoria — Animales', 18, 32);
    ctx.font = '14px Arial'; ctx.fillStyle = '#374151'; ctx.fillText(`Movimientos: ${this.moves}`, 18, 52);
    const elapsed = Math.max(0, Math.floor((performance.now() - this.startTime)/1000)); ctx.fillText(`Tiempo: ${elapsed}s`, 160, 52);

    // grid draw
    const paddingLeft = 16; const paddingTop = 80; const gap = 8;
    for (let r=0;r<this.rows;r++){
      for (let c=0;c<this.cols;c++){
        const idx = r*this.cols + c; const card = this.cards[idx];
        const x = paddingLeft + c*this.cardW + gap/2; const y = paddingTop + r*this.cardH + gap/2;
        const w = this.cardW - gap; const h = this.cardH - gap;
        // card background
        ctx.save(); ctx.beginPath(); this._roundRect(ctx, x, y, w, h, 10);
        if (card.matched){ ctx.fillStyle = '#d1fae5'; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1; ctx.stroke(); }
        else if (card.revealed){ ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1; ctx.stroke(); }
        else { ctx.fillStyle = '#e5e7eb'; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.03)'; ctx.lineWidth = 1; ctx.stroke(); }
        // emoji or back
        if (card.revealed || card.matched){ ctx.font = Math.min(w,h)/2 + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#111'; ctx.fillText(card.emoji, x + w/2, y + h/2 + 2); }
        else {
          // draw simple pattern/back
          ctx.fillStyle = 'rgba(0,0,0,0.04)'; ctx.font = '22px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', x + w/2, y + h/2 + 2);
        }
        ctx.restore();
      }
    }
  }

  _roundRect(ctx,x,y,w,h,r){
    ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
  }
}

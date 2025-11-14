class BombGame {
  constructor(canvasId){
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.wires = ['red','blue','green'];
    this.resetBtn = document.getElementById('reset');
    this.statusEl = document.getElementById('status');
    this.secret = this.shuffle(this.wires);
    this.attempt = [];
    this.wirePositions = []; // will hold clickable positions
    this.init();
  }

  shuffle(arr){ return arr.slice().sort(()=>Math.random()-0.5); }

  init(){
    this.canvas.width = this.canvas.clientWidth * devicePixelRatio;
    this.canvas.height = this.canvas.clientHeight * devicePixelRatio;
    this.ctx.scale(devicePixelRatio, devicePixelRatio);
    this.resetBtn.addEventListener('click', ()=>this.reset());
    this.canvas.addEventListener('click', (e)=>this.onClick(e));
    this.reset();
    this.draw();
  }

  reset(){
    this.secret = this.shuffle(this.wires);
    this.attempt = [];
    this.statusEl.textContent = '';
    this.draw();
  }

  onClick(e){
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for(let i=0;i<this.wirePositions.length;i++){
      const p = this.wirePositions[i];
      const dx = x - p.x; const dy = y - p.y;
      if(Math.hypot(dx,dy) < 24){
        this.cutWire(p.color);
        break;
      }
    }
  }

  cutWire(color){
    if(this.attempt.length>=3) return;
    this.attempt.push(color);
    this.draw();
    if(this.attempt.length===3){
      const ok = this.attempt.every((v,i)=>v===this.secret[i]);
      if(ok){ this.statusEl.textContent = '¡Bomba desactivada! 🎉'; this.statusEl.className = 'text-green-600'; }
      else { this.statusEl.textContent = 'Fallo — la bomba explota. Intenta de nuevo.'; this.statusEl.className = 'text-red-600'; }
    }
  }

  draw(){
    const ctx = this.ctx;
    const W = this.canvas.clientWidth;
    const H = this.canvas.clientHeight;
    ctx.clearRect(0,0,W,H);
    // draw bomb body
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(120, H/2, 48, 0, Math.PI*2); ctx.fill();
    // draw wires positions to the right
    const startX = 220; const startY = H/2 - 30;
    this.wirePositions = [];
    for(let i=0;i<this.wires.length;i++){
      const color = this.wires[i];
      const x = startX + i*100; const y = startY + 30;
      // line from bomb to wire
      ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(160, H/2 - 6 + i*4); ctx.lineTo(x, y); ctx.stroke();
      // circle for wire
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI*2); ctx.fill();
      // cross-out if cut
      const cut = this.attempt.includes(color);
      if(cut){ ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x-12,y-12); ctx.lineTo(x+12,y+12); ctx.moveTo(x+12,y-12); ctx.lineTo(x-12,y+12); ctx.stroke(); }
      this.wirePositions.push({x,y,color});
    }
    // show masked attempts
    ctx.fillStyle = '#333'; ctx.font = '16px Arial';
    const masked = this.attempt.map(()=>'●').concat(new Array(Math.max(0,3-this.attempt.length)).fill('○')).join(' ');
    ctx.fillText('Intentos: ' + masked, 20, H-18);
  }
}

// initialize when DOM ready
document.addEventListener('DOMContentLoaded', ()=>{
  new BombGame('bomb-canvas');
});

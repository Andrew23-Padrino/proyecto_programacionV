import MatchRecorder from '../bomba/MatchRecorder.js'

export default class AstronomiaCanvasGame {
  constructor(canvasId, opts = {}){
    this.canvas = document.getElementById(canvasId)
    this.ctx = this.canvas.getContext('2d')
    this.recorder = new MatchRecorder()
    this.lessonScore = Number(opts.lessonScore || 0)
    this.onWin = typeof opts.onWin === 'function' ? opts.onWin : null
    this.messageEl = document.getElementById('astro-msg')
    this.targetNumber = 1
    this.discs = []
    this.hover = null
    this.finished = false
    this.init()
  }
  init(){
    this.setSize()
    window.addEventListener('resize', ()=>{ this.setSize(); this.draw() })
    this.canvas.addEventListener('mousemove', (e)=> this.onMouseMove(e))
    this.canvas.addEventListener('click', (e)=> this.onClick(e))
    this.reset()
  }
  setSize(){
    const r = window.devicePixelRatio || 1
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    this.canvas.width = Math.max(1, Math.floor(w*r))
    this.canvas.height = Math.max(1, Math.floor(h*r))
    this.ctx.setTransform(r,0,0,r,0,0)
  }
  reset(){
    const numbers = Array.from({ length: 10 }, (_, i) => i + 1)
    const shuffled = numbers.sort(()=>Math.random()-0.5)
    const W = this.canvas.clientWidth, H = this.canvas.clientHeight
    const cols = 5, rows = 2, padX = 40, padY = 40
    const cellW = (W - padX*2) / cols, cellH = (H - padY*2) / rows
    const radius = Math.min(cellW, cellH) * 0.36
    this.discs = shuffled.map((num, idx)=>{
      const c = idx % cols, r = Math.floor(idx / cols)
      const x = padX + cellW*c + cellW/2
      const y = padY + cellH*r + cellH/2
      return { id: idx, number: num, x, y, r: radius, revealed: false }
    })
    this.targetNumber = 1
    this.finished = false
    this.setMessage('Encuentra el 1')
    this.draw()
  }
  setMessage(m){ if (this.messageEl) this.messageEl.textContent = m }
  onMouseMove(e){
    if (this.finished) return
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    let found = null
    for (const d of this.discs){ if (Math.hypot(x - d.x, y - d.y) < d.r) { found = d; break } }
    this.hover = found
    this.draw()
  }
  onClick(e){
    if (this.finished) return
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    for (const d of this.discs){
      if (Math.hypot(x - d.x, y - d.y) < d.r){
        this.handleDisc(d)
        break
      }
    }
  }
  handleDisc(d){
    if (d.revealed) return
    if (d.number === this.targetNumber){
      d.revealed = true
      this.recorder.recordAttempt({ number: d.number, ok: true })
      const next = this.targetNumber + 1
      if (next > 10){ this.win() }
      else { this.targetNumber = next; this.setMessage('Ahora encuentra el ' + next) }
    } else {
      this.recorder.recordAttempt({ number: d.number, ok: false })
      this.setMessage('Ese es ' + d.number)
    }
    this.draw()
  }
  win(){
    this.finished = true
    this.setMessage('¡Ganaste!')
    if (this.onWin) this.onWin({ recorder: this.recorder, lessonScore: this.lessonScore })
  }
  draw(){
    const ctx = this.ctx, W = this.canvas.clientWidth, H = this.canvas.clientHeight
    ctx.clearRect(0,0,W,H)
    const bg = ctx.createLinearGradient(0,0,0,H)
    bg.addColorStop(0,'#fafafa'); bg.addColorStop(1,'#f2f4f7')
    ctx.fillStyle = bg; ctx.fillRect(0,0,W,H)
    for (const d of this.discs){
      ctx.save()
      const hover = this.hover && this.hover.id === d.id
      ctx.beginPath(); ctx.fillStyle = hover ? '#fef08a' : '#ffffff'; ctx.arc(d.x, d.y, d.r, 0, Math.PI*2); ctx.fill()
      ctx.lineWidth = 4; ctx.strokeStyle = '#111'; ctx.stroke()
      if (d.revealed){ ctx.fillStyle = '#166534'; ctx.font = '24px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(d.number), d.x, d.y) }
      ctx.restore()
    }
  }
}

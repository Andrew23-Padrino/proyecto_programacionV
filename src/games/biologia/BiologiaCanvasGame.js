import MatchRecorder from '../bomba/MatchRecorder.js'

export default class BiologiaCanvasGame {
  constructor(canvasId, opts = {}){
    this.canvas = document.getElementById(canvasId)
    this.ctx = this.canvas.getContext('2d')
    this.recorder = new MatchRecorder()
    this.lessonScore = Number(opts.lessonScore || 0)
    this.onWin = typeof opts.onWin === 'function' ? opts.onWin : null
    this.messageEl = document.getElementById('bio-msg')
    this.imageSrc = 'assets/img/Celula_animal.jpg'
    this.hotspots = []
    this.collected = new Set()
    this.img = new Image()
    this.hover = null
    this.finished = false
    this.init()
  }
  init(){
    this.setSize()
    window.addEventListener('resize', ()=>{ this.setSize(); this.draw() })
    this.canvas.addEventListener('mousemove', (e)=> this.onMouseMove(e))
    this.canvas.addEventListener('click', (e)=> this.onClick(e))
    this.img.onload = ()=>{ this.layoutHotspots(); this.draw() }
    this.img.src = this.imageSrc
    this.setMessage('Identifica las partes de la célula')
  }
  setSize(){
    const r = window.devicePixelRatio || 1
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    this.canvas.width = Math.max(1, Math.floor(w*r))
    this.canvas.height = Math.max(1, Math.floor(h*r))
    this.ctx.setTransform(r,0,0,r,0,0)
  }
  layoutHotspots(){
    const W = this.canvas.clientWidth, H = this.canvas.clientHeight
    const data = [
      { name: 'Núcleo', x: 51, y: 50 },
      { name: 'Mitocondria', x: 78, y: 58 },
      { name: 'Membrana Celular', x: 92, y: 46 },
      { name: 'Citoplasma', x: 60, y: 66 },
      { name: 'Retículo Endoplasmático', x: 47, y: 58 },
      { name: 'Lisosoma', x: 34, y: 32 }
    ]
    const radius = Math.min(W,H) * 0.03
    this.hotspots = data.map((d)=>({ name:d.name, x: (d.x/100)*W, y: (d.y/100)*H, r: radius }))
  }
  setMessage(m){ if (this.messageEl) this.messageEl.textContent = m }
  onMouseMove(e){
    if (this.finished) return
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    let found = null
    for (const h of this.hotspots){ if (Math.hypot(x - h.x, y - h.y) < h.r) { found = h; break } }
    this.hover = found
    this.draw()
  }
  onClick(e){
    if (this.finished) return
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    for (const h of this.hotspots){
      if (Math.hypot(x - h.x, y - h.y) < h.r){
        this.collect(h)
        break
      }
    }
  }
  collect(h){
    if (this.collected.has(h.name)) return
    this.collected.add(h.name)
    this.recorder.recordAttempt({ hotspot: h.name })
    this.setMessage(h.name)
    if (this.collected.size === this.hotspots.length) this.win()
    this.draw()
  }
  win(){
    this.finished = true
    this.setMessage('¡Nivel completado!')
    if (this.onWin) this.onWin({ recorder: this.recorder, lessonScore: this.lessonScore })
  }
  draw(){
    const ctx = this.ctx, W = this.canvas.clientWidth, H = this.canvas.clientHeight
    ctx.clearRect(0,0,W,H)
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(0,0,W,H)
    if (this.img && this.img.complete){
      const iw = this.img.naturalWidth, ih = this.img.naturalHeight
      const scale = Math.min(W/iw, H/ih)
      const dw = iw*scale, dh = ih*scale
      const dx = (W - dw)/2, dy = (H - dh)/2
      ctx.drawImage(this.img, dx, dy, dw, dh)
    }
    for (const h of this.hotspots){
      const collected = this.collected.has(h.name)
      const hover = this.hover && this.hover.name === h.name
      ctx.save()
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI*2)
      ctx.fillStyle = collected ? 'rgba(22,101,52,0.6)' : hover ? 'rgba(234,179,8,0.6)' : 'rgba(59,130,246,0.4)'
      ctx.fill()
      ctx.restore()
      if (collected){ ctx.fillStyle = '#111'; ctx.font = '12px Arial'; ctx.textAlign = 'center'; ctx.fillText(h.name, h.x, h.y - h.r - 6) }
    }
  }
}

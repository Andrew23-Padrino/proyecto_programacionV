export default class BombLesson {
  constructor(onComplete){
    this.onComplete = onComplete;
    this.overlay = document.getElementById('lesson-overlay');
    this.slides = Array.from(document.querySelectorAll('.lesson-slide'));
    this.idx = 0;
    this.prevBtn = document.getElementById('lesson-prev');
    this.nextBtn = document.getElementById('lesson-next');
    this.skipBtn = document.getElementById('lesson-skip');
    this.startBtn = document.getElementById('lesson-start-game');
    this.feedback = document.getElementById('lesson-feedback');
    this.bind();
    this.showSlide(0);
  }

  bind(){
    if (!this.overlay) { if (this.onComplete) this.onComplete(); return; }
    if (this.prevBtn) this.prevBtn.addEventListener('click', ()=> this.showSlide(this.idx-1));
    if (this.nextBtn) this.nextBtn.addEventListener('click', ()=> this.showSlide(this.idx+1));
    if (this.skipBtn) this.skipBtn.addEventListener('click', ()=> this.finish({ skipped:true }));
    if (this.startBtn) this.startBtn.addEventListener('click', ()=> this.startRequested());
  }

  showSlide(i){
    if (i < 0) i = 0; if (i >= this.slides.length) i = this.slides.length-1;
    this.slides.forEach((s,idx)=> s.classList.toggle('hidden', idx !== i));
    this.idx = i;
    if (this.prevBtn) this.prevBtn.disabled = (i === 0);
    if (this.nextBtn) this.nextBtn.disabled = (i === this.slides.length-1);
  }

  startRequested(){
    // Quick quiz scoring if present
    try{
      const q1 = document.querySelector('input[name="q1"]:checked');
      let score = 0; if (q1 && q1.value === 'conductor') score += 1;
      if (this.feedback) this.feedback.textContent = `Puntuación lección: ${score}/1`;
      // read selected order option (teaching mode)
      const sel = document.getElementById('lesson-order-select');
      let order = null;
      if (sel && sel.value === 'teaching') order = ['red','blue','green'];
      setTimeout(()=> this.finish({ score, order }), 500);
    }catch(e){ this.finish({}); }
  }

  finish(result){
    if (this.overlay) this.overlay.style.display = 'none';
    if (this.onComplete) this.onComplete(result || {});
  }
}

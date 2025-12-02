export default class AstronomiaLesson {
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
    this.quizForm = document.getElementById('lesson-quiz');
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
    try{
      let score = 0;
      const q1 = this.quizForm ? this.quizForm.querySelector('input[name="q1"]:checked') : null;
      if (q1 && q1.value === 'orden') score += 1;
      const modeSel = document.getElementById('lesson-mode-select');
      const mode = modeSel && modeSel.value === 'canvas' ? 'canvas' : 'original';
      if (this.feedback) this.feedback.textContent = `Puntuación: ${score}/1`;
      setTimeout(()=> this.finish({ score, mode }), 600);
    }catch(e){ this.finish({}); }
  }
  finish(result){
    if (this.overlay) this.overlay.style.display = 'none';
    if (this.onComplete) this.onComplete(result || {});
  }
}

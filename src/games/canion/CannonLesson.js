export default class CannonLesson {
  constructor(onComplete){
    this.onComplete = onComplete;
    this.overlay = document.getElementById('lesson-overlay');
    this.slides = Array.from(document.querySelectorAll('.lesson-slide'));
    this.idx = 0;
    this.prevBtn = document.getElementById('lesson-prev');
    this.nextBtn = document.getElementById('lesson-next');
    this.skipBtn = document.getElementById('lesson-skip');
    this.startGameBtn = document.getElementById('lesson-start-game');
    this.startBotBtn = document.getElementById('lesson-start-bot');
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
    if (this.startGameBtn) this.startGameBtn.addEventListener('click', ()=> this.startRequested(false));
    if (this.startBotBtn) this.startBotBtn.addEventListener('click', ()=> this.startRequested(true));
  }

  showSlide(i){
    if (i < 0) i = 0; if (i >= this.slides.length) i = this.slides.length-1;
    this.slides.forEach((s,idx)=> s.classList.toggle('hidden', idx !== i));
    this.idx = i;
    if (this.prevBtn) this.prevBtn.disabled = (i === 0);
    if (this.nextBtn) this.nextBtn.disabled = (i === this.slides.length-1);
  }

  startRequested(vsBot){
    try{
      const q1 = this.quizForm.querySelector('input[name="q1"]:checked');
      const q2 = this.quizForm.querySelector('input[name="q2"]:checked');
      let score = 0; if (q1 && q1.value === '45') score += 1; if (q2 && q2.value === 'quad') score += 1;
      if (this.feedback) this.feedback.textContent = `Puntuación: ${score}/2`;
      setTimeout(()=> this.finish({ skipped:false, score, vsBot }), 600);
    }catch(e){ console.error('startRequested error', e); this.finish({ vsBot }); }
  }

  finish(result){
    if (this.overlay) this.overlay.style.display = 'none';
    if (this.onComplete) this.onComplete(result || {});
  }
}

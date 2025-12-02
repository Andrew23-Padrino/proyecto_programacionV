import MemoryGame from './MemoryGame.js';

document.addEventListener('DOMContentLoaded', ()=>{
  try{
    // No auth required; start immediately
    setTimeout(()=>{
      const inst = new MemoryGame('memoria-canvas');
      try{ const c = document.getElementById('memoria-canvas'); if (c) c.__memoriaInstance = inst; }catch(e){}
      window.__memoriaInstance = inst;
    }, 50);
  }catch(e){ console.warn('Memoria init failed', e); }

  // allow external reset requests
  window.addEventListener('memoria:reset', ()=>{ try{ if (window.__memoriaInstance && typeof window.__memoriaInstance.reset === 'function') window.__memoriaInstance.reset(); }catch(e){} });
});

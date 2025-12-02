export async function ensureAuthenticated(){
  try{
    // firebaseServices_ap is globally available in many modules, but we import lazily where needed
    // this helper returns uid or null
    const { firebaseServices_ap } = await import('../originales/firebase-services.js');
    if (!firebaseServices_ap || !firebaseServices_ap.auth) return null;
    return new Promise((resolve) => {
      const user = firebaseServices_ap.auth.currentUser;
      if (user) return resolve(user.uid);
      // wait briefly for auth state change
      const timeout = setTimeout(()=> resolve(null), 1800);
      const unsub = firebaseServices_ap.auth.onAuthStateChanged((u)=>{ clearTimeout(timeout); try{ unsub(); }catch(e){}; resolve(u ? u.uid : null); });
    });
  }catch(e){ return null; }
}

export function showLoginRequiredModal({ message = 'Debes iniciar sesión para continuar.' } = {}){
  try{
    const existing = document.getElementById('nc-login-required-modal');
    if (existing) { existing.querySelector('.nc-modal-body').textContent = message; existing.style.display = 'flex'; return; }
    const overlay = document.createElement('div');
    overlay.id = 'nc-login-required-modal';
    overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center'; overlay.style.background = 'rgba(0,0,0,0.6)'; overlay.style.zIndex = '9999';
    const panel = document.createElement('div'); panel.style.background = '#fff'; panel.style.padding = '18px'; panel.style.borderRadius = '10px'; panel.style.minWidth = '320px'; panel.style.textAlign = 'center';
    panel.innerHTML = `<div class="nc-modal-body" style="margin-bottom:12px;color:#111">${message}</div><div style="display:flex;gap:8px;justify-content:center"><button id="nc-login-goto" style="padding:8px 12px;background:#1E6F5C;color:white;border:none;border-radius:6px;">Ir a iniciar sesión</button><button id="nc-login-close" style="padding:8px 12px;background:#e5e7eb;color:#111;border:none;border-radius:6px;">Cerrar</button></div>`;
    overlay.appendChild(panel); document.body.appendChild(overlay);
    document.getElementById('nc-login-goto').addEventListener('click', ()=>{
      try{
        // store current page so we can return after successful login
        try{ localStorage.setItem('nc_after_login', window.location.pathname + window.location.search); }catch(e){}
        window.location.href = '/src/pages/login/login.html';
      }catch(e){}
    });
    document.getElementById('nc-login-close').addEventListener('click', ()=>{ overlay.style.display='none'; });
  }catch(e){ console.warn('showLoginRequiredModal error', e); }
}

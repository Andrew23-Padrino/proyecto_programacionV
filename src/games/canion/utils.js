export function ensureAuthenticated(timeoutMs = 3000){
  return new Promise((resolve)=>{
    try{
      import('/src/games/originales/firebase-services.js').then(({ firebaseServices_ap })=>{
        if (!firebaseServices_ap || !firebaseServices_ap.auth) return resolve(null);
        const cur = firebaseServices_ap.auth.currentUser;
        if (cur) return resolve(cur.uid);
        const unsub = firebaseServices_ap.auth.onAuthStateChanged((user)=>{ try{ unsub(); }catch(e){}; if (user) return resolve(user.uid); return resolve(null); });
        setTimeout(()=>{ try{ if (typeof unsub === 'function') unsub(); }catch(e){}; resolve(null); }, timeoutMs);
      }).catch((e)=>{ console.warn('could not import firebase services', e); resolve(null); });
    }catch(e){ console.warn('ensureAuthenticated error', e); resolve(null); }
  });
}

export function showLoginRequiredModal({ title = 'Inicio de sesión requerido', message = 'Necesitas iniciar sesión para jugar.', autoRedirectMs = 2500 } = {}){
  try{
    if (window._globalLoginModal) {
      const modal = window._globalLoginModal; const t = modal.querySelector('.login-title'); const m = modal.querySelector('.login-message'); if (t) t.textContent = title; if (m) m.textContent = message; modal.style.display = 'flex'; return;
    }
    const overlay = document.createElement('div'); overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center'; overlay.style.background = 'rgba(0,0,0,0.6)'; overlay.style.zIndex = '10000';
    const panel = document.createElement('div'); panel.style.background = '#fff'; panel.style.padding = '20px'; panel.style.borderRadius = '10px'; panel.style.minWidth = '300px'; panel.style.textAlign = 'center'; panel.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
    const h = document.createElement('div'); h.className = 'login-title'; h.style.fontSize = '18px'; h.style.fontWeight = '700'; h.style.marginBottom = '8px'; h.textContent = title;
    const p = document.createElement('div'); p.className = 'login-message'; p.style.fontSize = '14px'; p.style.color = '#333'; p.style.marginBottom = '12px'; p.textContent = message;
    const btnLogin = document.createElement('button'); btnLogin.textContent = 'Iniciar sesión'; btnLogin.style.marginRight = '8px'; btnLogin.style.padding = '8px 12px'; btnLogin.style.border = 'none'; btnLogin.style.borderRadius = '6px'; btnLogin.style.background = '#0b74de'; btnLogin.style.color = '#fff'; btnLogin.style.cursor = 'pointer';
    btnLogin.addEventListener('click', ()=>{
      try{
        try{ localStorage.setItem('nc_after_login', window.location.pathname + window.location.search); }catch(e){}
        window.location.href = '/src/pages/login/login.html';
      }catch(e){ console.warn('redirect to login failed', e); }
    });
    const btnRegister = document.createElement('button'); btnRegister.textContent = 'Registrarse'; btnRegister.style.padding = '8px 12px'; btnRegister.style.border = '1px solid #ddd'; btnRegister.style.borderRadius = '6px'; btnRegister.style.background = '#fff'; btnRegister.style.cursor = 'pointer';
    btnRegister.addEventListener('click', ()=>{
      try{ try{ localStorage.setItem('nc_after_login', window.location.pathname + window.location.search); }catch(e){}; window.location.href = '/src/pages/login/login.html'; }catch(e){ console.warn('redirect to registro failed', e); }
    });
    panel.appendChild(h); panel.appendChild(p); panel.appendChild(btnLogin); panel.appendChild(btnRegister); overlay.appendChild(panel); document.body.appendChild(overlay); window._globalLoginModal = overlay;
    if (autoRedirectMs && typeof autoRedirectMs === 'number'){ setTimeout(()=>{ try{ localStorage.setItem('nc_after_login', window.location.pathname + window.location.search); window.location.href = '/src/pages/login/login.html'; }catch(e){ /*ignore*/ } }, autoRedirectMs); }
  }catch(e){ console.warn('showLoginRequiredModal error', e); }
}

import { firebaseServices_ap } from '../games/originales/firebase-services.js';
import { escapeHTML } from './utils.js';

export async function renderUserProfile(user, profile) {
  try {
    const profileForm_ap = document.getElementById('profile-form');
    const profileStatus_ap = document.getElementById('profile-status');
    const profileCarnetPreview_ap = document.getElementById('profile-carnet-preview');
    const profileCarnetContainer = document.getElementById('profile-avatar');

    if (profileForm_ap) profileForm_ap.classList.remove('hidden');
    document.getElementById('profile-logged-out')?.classList.add('hidden');
    document.getElementById('profile-nombre').value = profile?.nombre || '';
    document.getElementById('profile-apellido').value = profile?.apellido || '';
    document.getElementById('profile-institucion').value = profile?.institucion || '';
    document.getElementById('profile-email').value = profile?.email || (user.email || '');
    profileStatus_ap.textContent = profile?.profileComplete ? 'Perfil completo' : 'Perfil incompleto';
    profileStatus_ap.className = profile?.profileComplete ? 'text-green-600' : 'text-yellow-600';

    // Materias display
    try {
      let materiaContainer = document.getElementById('profile-materias');
      if (!materiaContainer) {
        materiaContainer = document.createElement('div');
        materiaContainer.id = 'profile-materias';
        materiaContainer.className = 'mt-2 text-sm text-gray-700';
        profileStatus_ap.parentElement.appendChild(materiaContainer);
      }
      const fisica = profile?.materias && typeof profile.materias.fisica !== 'undefined' ? profile.materias.fisica : null;
      const electricidad = profile?.materias && typeof profile.materias.electricidad !== 'undefined' ? profile.materias.electricidad : null;
      const parts = [];
      if (fisica !== null) parts.push(`<strong>Física:</strong> ${escapeHTML(String(fisica))} / 20`);
      else parts.push(`<strong>Física:</strong> -`);
      if (electricidad !== null) parts.push(`<strong>Electricidad:</strong> ${escapeHTML(String(electricidad))} / 20`);
      else parts.push(`<strong>Electricidad:</strong> -`);
      materiaContainer.innerHTML = parts.join(' &nbsp; | &nbsp; ');
    } catch (e) { console.error('Error mostrando materias:', e); }

    // Avatar and carnet preview
    if (profile?.carnetURL) {
      const safeUrl = escapeHTML(profile.carnetURL);
      if (profileCarnetContainer) profileCarnetContainer.innerHTML = `<img src="${safeUrl}" alt="carnet" class="w-full h-full object-cover">`;
      if (profileCarnetPreview_ap) profileCarnetPreview_ap.innerHTML = `<img src="${safeUrl}" alt="carnet" class="w-32 h-auto rounded">`;
    } else {
      if (profileCarnetContainer) profileCarnetContainer.textContent = escapeHTML((profile && (profile.nombre || profile.apellido)) ? (profile.nombre?.charAt(0) || '') + (profile.apellido?.charAt(0) || '') : (user.email?.charAt(0) || 'U'));
      if (profileCarnetPreview_ap) profileCarnetPreview_ap.innerHTML = '';
    }

    // Load and render matches for this user
    try {
      let matches = [];
      try{
        matches = await firebaseServices_ap.getUserMatchSummaries_ap(user.uid);
        console.log('Loaded user summaries for', user.uid, 'count=', matches.length);
      }catch(e){
        console.warn('Could not load user summaries, falling back to global partidas query', e);
        matches = await firebaseServices_ap.getMatchesForUser_ap(user.uid);
      }
      console.log('Loaded matches for user', user.uid, 'count=', matches ? matches.length : 0);
      const matchesSection = document.getElementById('matches-section');
      const matchesTableBody = document.getElementById('matches-table-body');
      const matchesCount = document.getElementById('matches-count');
      const matchesPrev = document.getElementById('matches-prev');
      const matchesNext = document.getElementById('matches-next');
      if (!matchesSection || !matchesTableBody) return;
      matchesSection.classList.remove('hidden');
      matchesTableBody.innerHTML = '';
      const PAGE_SIZE = 8;
      let pageIdx = 0;
      const sorted = (matches || []).slice().sort((a,b)=>{
        const ta = a.fecha && a.fecha.toDate ? a.fecha.toDate().getTime() : (a.fecha ? new Date(a.fecha).getTime() : 0);
        const tb = b.fecha && b.fecha.toDate ? b.fecha.toDate().getTime() : (b.fecha ? new Date(b.fecha).getTime() : 0);
        return tb - ta;
      });
      const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

      function renderPage(idx){
        pageIdx = Math.max(0, Math.min(totalPages-1, idx));
        matchesTableBody.innerHTML = '';
        const start = pageIdx * PAGE_SIZE; const end = Math.min(sorted.length, start + PAGE_SIZE);
        for (let i=start;i<end;i++){
          const m = sorted[i];
          const tr = document.createElement('tr'); tr.className = 'border-b';
          const dateStr = m.fecha && m.fecha.toDate ? m.fecha.toDate().toLocaleString() : (m.fecha ? new Date(m.fecha).toLocaleString() : '');
          const gameLabel = m.materia ? (String(m.materia).charAt(0).toUpperCase()+String(m.materia).slice(1)) : (m.game || 'Juego');
          const result = (m.winnerUid && m.winnerUid === user.uid) ? 'Victoria' : (m.loserUid && m.loserUid === user.uid ? 'Derrota' : '—');
          const pts = typeof m.pointsAwarded !== 'undefined' ? String(m.pointsAwarded) : '-';
          const subj = m.materia || '-';
          const subjScore = typeof m.subjectScore !== 'undefined' && m.subjectScore !== null ? String(m.subjectScore) + ' / 20' : '-';
          let attemptsSummary = '-';
          if (Array.isArray(m.attempts) && m.attempts.length){
            if (m.attempts[0].color) attemptsSummary = m.attempts.map(a=>a.color).join(', ');
            else attemptsSummary = `${m.attempts.length} intentos`;
          }
          tr.innerHTML = `<td class="px-4 py-3 align-top">${escapeHTML(dateStr)}</td><td class="px-4 py-3 align-top">${escapeHTML(gameLabel)}</td><td class="px-4 py-3 align-top">${escapeHTML(result)}</td><td class="px-4 py-3 align-top">${escapeHTML(pts)}</td><td class="px-4 py-3 align-top">${escapeHTML(subj)}</td><td class="px-4 py-3 align-top">${escapeHTML(subjScore)}</td><td class="px-4 py-3 align-top"><button class="btn btn-ghost btn-sm" data-index="${i}">Ver</button></td>`;
          matchesTableBody.appendChild(tr);
        }
        if (matchesCount) matchesCount.textContent = `Mostrando ${sorted.length === 0 ? 0 : (start+1)}–${end} de ${sorted.length}`;
        if (matchesPrev) matchesPrev.disabled = pageIdx === 0;
        if (matchesNext) matchesNext.disabled = pageIdx >= totalPages-1;
      }

      if (matchesPrev) matchesPrev.addEventListener('click', ()=> renderPage(pageIdx-1));
      if (matchesNext) matchesNext.addEventListener('click', ()=> renderPage(pageIdx+1));

      matchesTableBody.addEventListener('click', (ev)=>{
        const btn = ev.target.closest('button[data-index]'); if (!btn) return;
        const idx = Number(btn.getAttribute('data-index'));
        const match = sorted[idx]; if (!match) return;
        const bodyHtml = [];
        bodyHtml.push(`<div style="text-align:left"><strong>Fecha:</strong> ${escapeHTML(match.fecha && match.fecha.toDate ? match.fecha.toDate().toLocaleString() : (match.fecha ? new Date(match.fecha).toLocaleString() : ''))}</div>`);
        bodyHtml.push(`<div style="margin-top:8px"><strong>Materia:</strong> ${escapeHTML(match.materia||'-')}</div>`);
        if (Array.isArray(match.attempts) && match.attempts.length){
          bodyHtml.push('<div style="margin-top:8px"><strong>Intentos:</strong></div>');
          bodyHtml.push('<ol style="margin-left:14px">');
          match.attempts.forEach((a,ii)=>{
            if (a.color) bodyHtml.push(`<li>${escapeHTML(String(a.color))} — ${escapeHTML(a.timestamp && a.timestamp.toDate ? a.timestamp.toDate().toLocaleTimeString() : (a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : ''))}</li>`);
            else bodyHtml.push(`<li>Intento ${ii+1}</li>`);
          });
          bodyHtml.push('</ol>');
        }
        if (typeof match.subjectScore !== 'undefined') bodyHtml.push(`<div style="margin-top:8px"><strong>Nota:</strong> ${escapeHTML(String(match.subjectScore))} / 20</div>`);
        const modal = document.createElement('div'); modal.style.position='fixed'; modal.style.inset='0'; modal.style.display='flex'; modal.style.alignItems='center'; modal.style.justifyContent='center'; modal.style.background='rgba(0,0,0,0.5)'; modal.style.zIndex='20000';
        const panel = document.createElement('div'); panel.style.background='#fff'; panel.style.padding='18px'; panel.style.borderRadius='8px'; panel.style.maxWidth='520px'; panel.style.width='90%'; panel.innerHTML = `<div style="font-weight:700;margin-bottom:8px">Detalle de la partida</div><div>${bodyHtml.join('')}</div><div style="margin-top:12px;text-align:right"><button id="md-close" class="btn btn-primary">Cerrar</button></div>`;
        modal.appendChild(panel); document.body.appendChild(modal);
        modal.querySelector('#md-close').addEventListener('click', ()=> modal.remove());
      });

      renderPage(0);

      // preload profile names
      try{
        const profileCache = {};
        const uids = new Set();
        (matches || []).forEach(m => { if (m.winnerUid) uids.add(m.winnerUid); if (m.loserUid) uids.add(m.loserUid); });
        await Promise.all(Array.from(uids).map(async (uid) => {
          try{ const p = await firebaseServices_ap.getUserProfile_ap(uid); if (p) profileCache[uid] = ((p.nombre || '') + ' ' + (p.apellido || '')).trim() || p.email || uid; else profileCache[uid] = uid; }catch(e){ profileCache[uid] = uid; }
        }));
      }catch(e){ console.warn('Could not preload profile names for matches', e); }

      if (!sorted || sorted.length === 0) {
        matchesTableBody.innerHTML = `<tr><td class="px-4 py-6" colspan="7">No se encontraron partidas jugadas.</td></tr>`;
      }
    } catch (err) {
      console.error('Error cargando partidas:', err);
    }
  } catch (err) {
    console.error('Error en renderUserProfile:', err);
  }
}

export function setupProfileActions() {
  const saveProfileBtn_ap = document.getElementById('save-profile');
  const profileCarnetPreview_ap = document.getElementById('profile-carnet-preview');
  const profileStatus_ap = document.getElementById('profile-status');
  if (saveProfileBtn_ap) {
    saveProfileBtn_ap.addEventListener('click', async () => {
      try {
        const user = firebaseServices_ap.auth.currentUser;
        if (!user) throw new Error('No autenticado');
        const upd = {
          nombre: document.getElementById('profile-nombre').value,
          apellido: document.getElementById('profile-apellido').value,
          institucion: document.getElementById('profile-institucion').value
        };
        const carnetFile = document.getElementById('profile-carnet')?.files?.[0];
        if (carnetFile) {
          const url = await firebaseServices_ap.uploadCarnet_ap(user.uid, carnetFile);
          upd.carnetURL = url;
        }
        const merged = await firebaseServices_ap.saveUserProfile_ap(user.uid, upd);
        profileStatus_ap.textContent = merged.profileComplete ? 'Perfil completo' : 'Perfil incompleto';
        profileStatus_ap.className = merged.profileComplete ? 'text-green-600' : 'text-yellow-600';
        if (merged.carnetURL && profileCarnetPreview_ap) { profileCarnetPreview_ap.innerHTML = `<img src="${escapeHTML(merged.carnetURL)}" alt="carnet" class="w-32 h-auto rounded">`; }
        alert('Perfil guardado');
      } catch (err) {
        console.error('Error guardando perfil', err);
        alert('Error guardando perfil: ' + (err.message || err));
      }
    });
  }

  // Logout button on profile page (if present)
  const logoutBtn_ap = document.getElementById('logout-btn');
  if (logoutBtn_ap) {
    logoutBtn_ap.addEventListener('click', async () => {
      try {
        await firebaseServices_ap.logoutUser_ap();
        window.location.href = '/';
      } catch (err) {
        console.error('Error logout', err);
      }
    });
  }
}

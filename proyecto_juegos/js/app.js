// Import Firebase services
import { firebaseServices_ap } from './firebase-services.js';

document.addEventListener('DOMContentLoaded', () => {
  // Small helper to escape HTML to avoid injection when inserting user data
  const escapeHTML = (unsafe) => {
    if (!unsafe && unsafe !== 0) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const registroForm_ap = document.getElementById('registro-form');
  const registroMensaje_ap = document.getElementById('registro-mensaje');

  const loginForm_ap = document.getElementById('login-form');
  const loginMensaje_ap = document.getElementById('login-mensaje');

  const contactoForm_ap = document.getElementById('contacto-form');
  const newsletterForm_ap = document.getElementById('newsletter-form');

  const profileForm_ap = document.getElementById('profile-form');
  const profileStatus_ap = document.getElementById('profile-status');
  const profileCarnetPreview_ap = document.getElementById('profile-carnet-preview');
  const saveProfileBtn_ap = document.getElementById('save-profile');
  const logoutBtn_ap = document.getElementById('logout-btn');

  // --- Registro (botón) ---
  if (registroForm_ap) {
    // Evitar submit por Enter
    registroForm_ap.addEventListener('submit', (e) => e.preventDefault());

    const registroBtn = document.getElementById('registro-btn');
    if (registroBtn) {
      registroBtn.addEventListener('click', async () => {
        // Basic validation
        const nombreVal = document.getElementById('nombre')?.value?.trim();
        const apellidoVal = document.getElementById('apellido')?.value?.trim();
        const emailVal = document.getElementById('email')?.value?.trim();
        const passwordVal = document.getElementById('password')?.value || '';
        if (!nombreVal || !apellidoVal || !emailVal) {
          if (registroMensaje_ap) {
            registroMensaje_ap.textContent = 'Por favor completa nombre, apellido y correo.';
            registroMensaje_ap.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-800';
            registroMensaje_ap.classList.remove('hidden');
          }
          return;
        }
        if (passwordVal.length < 6) {
          if (registroMensaje_ap) {
            registroMensaje_ap.textContent = 'La contraseña debe tener al menos 6 caracteres.';
            registroMensaje_ap.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-800';
            registroMensaje_ap.classList.remove('hidden');
          }
          return;
        }

        // UX: disable button and show spinner
        const originalText = registroBtn.innerHTML;
        registroBtn.disabled = true;
        registroBtn.classList.add('btn', 'btn-primary');
        registroBtn.innerHTML = `<span class="spinner"></span> Registrando...`;
        const carnetFile = document.getElementById('carnet')?.files?.[0];
        const userData_ap = {
          nombre: nombreVal,
          apellido: apellidoVal,
          email: emailVal,
          interes: document.getElementById('interes')?.value || '',
          institucion: document.getElementById('institucion')?.value || ''
        };
        const password_ap = passwordVal;

        try {
          const cred = await firebaseServices_ap.registerUser_ap(userData_ap, password_ap);
          const uid_ap = cred.user.uid;

          // Try uploading carnet, but don't fail the whole registration if upload is denied
          let carnetURL = null;
          if (carnetFile) {
            try {
              carnetURL = await firebaseServices_ap.uploadCarnet_ap(uid_ap, carnetFile);
            } catch (uploadErr) {
              console.warn('No se pudo subir el carnet:', uploadErr);
              // Show a friendly message but continue
              if (registroMensaje_ap) {
                registroMensaje_ap.textContent = 'Cuenta creada, pero no se pudo subir la foto del carnet: ' + (uploadErr.message || uploadErr) + '. Revisa las reglas de Storage.';
                registroMensaje_ap.className = 'mt-4 p-4 rounded-lg bg-yellow-100 text-yellow-800';
                registroMensaje_ap.classList.remove('hidden');
              }
            }
          }

          // Save profile (with or without carnetURL)
          try {
            const toSave = { institucion: userData_ap.institucion };
            if (carnetURL) toSave.carnetURL = carnetURL;
            await firebaseServices_ap.saveUserProfile_ap(uid_ap, toSave);
          } catch (saveErr) {
            console.error('No se pudo guardar el perfil en Firestore:', saveErr);
            if (registroMensaje_ap) {
              registroMensaje_ap.textContent = 'Cuenta creada, pero no se pudo guardar el perfil: ' + (saveErr.message || saveErr) + '. Revisa las reglas de Firestore.';
              registroMensaje_ap.className = 'mt-4 p-4 rounded-lg bg-yellow-100 text-yellow-800';
              registroMensaje_ap.classList.remove('hidden');
            }
          }

          // Redirigir al perfil
          window.location.href = 'perfil.html';
        } catch (err) {
          console.error('Error en el registro:', err);
          if (registroMensaje_ap) {
            registroMensaje_ap.textContent = 'Error en el registro: ' + (err.message || err);
            registroMensaje_ap.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-800';
            registroMensaje_ap.classList.remove('hidden');
          } else {
            alert('Error en el registro: ' + (err.message || err));
          }
        } finally {
          // restore button in all cases
          registroBtn.disabled = false;
          registroBtn.innerHTML = originalText;
        }
      });
    }
  }

  // --- Contacto ---
  if (contactoForm_ap) {
    contactoForm_ap.addEventListener('submit', async (e) => {
      e.preventDefault();
      const messageData_ap = {
        nombre: document.getElementById('nombre-contacto').value,
        email: document.getElementById('email-contacto').value,
        asunto: document.getElementById('asunto').value,
        mensaje: document.getElementById('mensaje').value
      };
      try {
        await firebaseServices_ap.sendContactMessage_ap(messageData_ap);
        alert('¡Mensaje enviado con éxito!');
        contactoForm_ap.reset();
      } catch (err) {
        console.error('Error al enviar mensaje:', err);
        alert('Error al enviar mensaje: ' + (err.message || err));
      }
    });
  }

  // --- Newsletter ---
  if (newsletterForm_ap) {
    newsletterForm_ap.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput_ap = newsletterForm_ap.querySelector('input[type="email"]');
      const email_ap = emailInput_ap.value;
      try {
        await firebaseServices_ap.subscribeNewsletter_ap(email_ap);
        alert('¡Te has suscrito con éxito a nuestro boletín!');
        emailInput_ap.value = '';
      } catch (err) {
        console.error('Error al suscribirse:', err);
        alert('Error al suscribirse: ' + (err.message || err));
      }
    });
  }

  // --- Login ---
  if (loginForm_ap) {
    loginForm_ap.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      try {
        await firebaseServices_ap.loginUser_ap(email, password);
        if (loginMensaje_ap) loginMensaje_ap.textContent = '';
        loginForm_ap.reset();
        // Redirect to profile after login
        window.location.href = 'perfil.html';
      } catch (err) {
        console.error('Error login:', err);
        if (loginMensaje_ap) loginMensaje_ap.textContent = err.message || err;
      }
    });
  }

  // --- Auth state listener ---
  if (firebaseServices_ap && firebaseServices_ap.auth) {
    firebaseServices_ap.onAuthStateChanged_ap(async (user) => {
      if (user) {
        const profile = await firebaseServices_ap.getUserProfile_ap(user.uid);

        // Update navbar: hide auth links and show user menu
        const loginLink = document.getElementById('login-link');
        const registerLink = document.getElementById('register-link');
        const navAuth = document.getElementById('nav-auth');
        const navUser = document.getElementById('nav-user');
        if (loginLink) loginLink.classList.add('hidden');
        if (registerLink) registerLink.classList.add('hidden');
        if (navAuth) navAuth.classList.add('hidden');
        if (navUser) {
          navUser.classList.remove('hidden');
          const displayNameRaw = (profile && (profile.nombre || profile.apellido)) ? `${profile.nombre || ''} ${profile.apellido || ''}`.trim() : (user.email || 'Usuario');
          const displayName = escapeHTML(displayNameRaw);
          let avatarHTML = '';
          if (profile?.carnetURL) {
            const safeUrl = escapeHTML(profile.carnetURL);
            avatarHTML = `<img src="${safeUrl}" alt="avatar" class="w-8 h-8 rounded-full object-cover">`;
          } else {
            const initials = escapeHTML(((profile && (profile.nombre || profile.apellido)) ? (profile.nombre?.charAt(0) || '') + (profile.apellido?.charAt(0) || '') : (user.email?.charAt(0) || 'U')));
            avatarHTML = `<div class="avatar">${initials}</div>`;
          }

          navUser.innerHTML = `
            <div class="dropdown" id="nav-dropdown">
              <button class="flex items-center gap-2 text-white" id="nav-user-btn">
                ${avatarHTML}
                <span class="hidden sm:inline">${displayName}</span>
              </button>
              <div class="dropdown-menu" id="nav-user-menu">
                <a href="perfil.html">Mi perfil</a>
                <a href="#">Ajustes</a>
                <button id="nav-logout" class="text-left">Cerrar sesión</button>
              </div>
            </div>
          `;

          const dropdown = document.getElementById('nav-dropdown');
          const navLogout = document.getElementById('nav-logout');
          if (navLogout) navLogout.addEventListener('click', async () => { await firebaseServices_ap.logoutUser_ap(); window.location.href = 'index.html'; });

          // Close any open dropdown when clicking outside
          const closeDropdowns = () => {
            document.querySelectorAll('.dropdown.open').forEach((d) => d.classList.remove('open'));
          };
          document.addEventListener('click', closeDropdowns);

          // Toggle this dropdown
          const btnEl = document.getElementById('nav-user-btn');
          if (btnEl && dropdown) {
            btnEl.addEventListener('click', (ev) => {
              ev.stopPropagation();
              dropdown.classList.toggle('open');
            });
          }
        }

          if (profileForm_ap) {
          document.getElementById('profile-logged-out')?.classList.add('hidden');
          profileForm_ap.classList.remove('hidden');
          document.getElementById('profile-nombre').value = profile?.nombre || '';
          document.getElementById('profile-apellido').value = profile?.apellido || '';
          document.getElementById('profile-institucion').value = profile?.institucion || '';
          document.getElementById('profile-email').value = profile?.email || (user.email || '');
          profileStatus_ap.textContent = profile?.profileComplete ? 'Perfil completo' : 'Perfil incompleto';
          profileStatus_ap.className = profile?.profileComplete ? 'text-green-600' : 'text-yellow-600';
          // Mostrar notas/materias si existen
          try{
            let materiaContainer = document.getElementById('profile-materias');
            if (!materiaContainer) {
              materiaContainer = document.createElement('div');
              materiaContainer.id = 'profile-materias';
              materiaContainer.className = 'mt-2 text-sm text-gray-700';
              profileStatus_ap.parentElement.appendChild(materiaContainer);
            }
            const fisica = profile?.materias && typeof profile.materias.fisica !== 'undefined' ? profile.materias.fisica : null;
            if (fisica !== null) {
              materiaContainer.innerHTML = `<strong>Física:</strong> ${escapeHTML(String(fisica))} / 20`;
            } else {
              materiaContainer.innerHTML = `<strong>Física:</strong> -`;
            }
          }catch(e){console.error('Error mostrando materias:', e);} 
          // Avatar
          const avatar = document.getElementById('profile-avatar');
          if (profile?.carnetURL) {
            const safeUrl = escapeHTML(profile.carnetURL);
            if (avatar) avatar.innerHTML = `<img src="${safeUrl}" alt="carnet" class="w-full h-full object-cover">`;
            if (profile.carnetURL) profileCarnetPreview_ap.innerHTML = `<img src="${safeUrl}" alt="carnet" class="w-32 h-auto rounded">`;
          } else {
            if (avatar) avatar.textContent = escapeHTML((profile && (profile.nombre || profile.apellido)) ? (profile.nombre?.charAt(0) || '') + (profile.apellido?.charAt(0) || '') : (user.email?.charAt(0) || 'U'));
            profileCarnetPreview_ap.innerHTML = '';
          }
            // Load and render matches for this user (use POO MatchDisplay)
          (async () => {
            try {
              // Prefer per-user summaries (owner-scoped) to avoid cross-user read rules
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
              const matchesList = document.getElementById('matches-list');
              if (!matchesSection || !matchesList) return;
              matchesSection.classList.remove('hidden');
              matchesList.innerHTML = '';
              if (matches && matches.length > 0) {
                // Define a small POO renderer for matches
                class MatchDisplay {
                  constructor(match){ this.match = match; }
                  render(){
                    const m = this.match;
                    const dateStr = m.fecha && m.fecha.toDate ? m.fecha.toDate().toLocaleString() : (m.fecha ? new Date(m.fecha).toLocaleString() : '');
                    const winner = escapeHTML(m.winnerUid || 'Desconocido');
                    const loser = escapeHTML(m.loserUid || '-');
                    const pts = m.pointsAwarded != null ? String(m.pointsAwarded) : '-';
                    const distance = m.distance != null ? String(m.distance) + ' m' : '-';
                    const container = document.createElement('div');
                    container.className = 'p-3 bg-gray-50 rounded shadow-sm mb-3';
                    const attempts = m.attempts || [];
                    container.innerHTML = `<div class="flex justify-between items-start"><div><strong>${dateStr}</strong><div class="text-sm text-gray-600">Ganador: ${winner} • Perdedor: ${loser}</div></div><div class="text-right"><div class="font-semibold">${pts} pts</div><div class="text-sm text-gray-500">Dist: ${distance}</div></div></div>`;
                    if (attempts.length) {
                      const btn = document.createElement('button');
                      btn.className = 'mt-2 px-3 py-1 text-sm bg-white border rounded';
                      btn.textContent = 'Ver intentos';
                      const table = document.createElement('table');
                          table.className = 'w-full text-sm mt-2 border-collapse';
                          // show the attempts table by default to help visibility (toggle remains available)
                          table.style.display = 'table';
                      table.innerHTML = `<thead><tr><th class="p-1 text-left">#</th><th class="p-1 text-left">Ángulo</th><th class="p-1 text-left">Potencia</th><th class="p-1 text-left">Aterrizaje</th><th class="p-1 text-left">Hit</th><th class="p-1 text-left">Tiempo</th></tr></thead><tbody></tbody>`;
                      const tbody = table.querySelector('tbody');
                      attempts.forEach((a, i) => {
                            console.log('Match attempt', i+1, a);
                        const tr = document.createElement('tr');
                        // handle Firestore Timestamp or Date
                        let timeStr = '';
                        if (a.timestamp) {
                          if (typeof a.timestamp.toDate === 'function') timeStr = a.timestamp.toDate().toLocaleTimeString();
                          else timeStr = new Date(a.timestamp).toLocaleTimeString();
                        }
                        tr.innerHTML = `<td class="p-1">${i+1}</td><td class="p-1">${escapeHTML(String(a.angle))}</td><td class="p-1">${escapeHTML(String(Math.round(a.power)))}</td><td class="p-1">${escapeHTML(String((a.landed||0).toFixed ? a.landed.toFixed(1) : a.landed || '-'))}</td><td class="p-1">${a.hit ? 'Sí' : 'No'}</td><td class="p-1">${timeStr}</td>`;
                        tbody.appendChild(tr);
                      });
                      btn.addEventListener('click', ()=>{ table.style.display = table.style.display === 'none' ? 'table' : 'none'; });
                      container.appendChild(btn);
                      // show subjectScore if present
                      if (typeof m.subjectScore !== 'undefined'){
                        const scoreDiv = document.createElement('div');
                        scoreDiv.className = 'mt-2 text-sm font-medium';
                        scoreDiv.innerHTML = `<strong>Nota (Física):</strong> ${escapeHTML(String(m.subjectScore))} / 20`;
                        container.appendChild(scoreDiv);
                      }
                      container.appendChild(table);
                    }
                    return container;
                  }
                }

                matches.forEach(m => { const md = new MatchDisplay(m); matchesList.appendChild(md.render()); });
              } else {
                matchesList.innerHTML = '<div class="p-3 bg-gray-50 rounded">No se encontraron partidas jugadas.</div>';
              }
            } catch (err) {
              console.error('Error cargando partidas:', err);
            }
          })();
        }
      } else {
        // User logged out: show auth links
        const loginLink = document.getElementById('login-link');
        const registerLink = document.getElementById('register-link');
        const navAuth = document.getElementById('nav-auth');
        const navUser = document.getElementById('nav-user');
        if (loginLink) loginLink.classList.remove('hidden');
        if (registerLink) registerLink.classList.remove('hidden');
        if (navAuth) navAuth.classList.remove('hidden');
        if (navUser) navUser.classList.add('hidden');
        document.getElementById('profile-logged-out')?.classList.remove('hidden');
        profileForm_ap?.classList.add('hidden');
      }
    });
  }

  // --- Guardar perfil ---
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
        if (merged.carnetURL) profileCarnetPreview_ap.innerHTML = `<img src="${escapeHTML(merged.carnetURL)}" alt="carnet" class="w-32 h-auto rounded">`;
        alert('Perfil guardado');
      } catch (err) {
        console.error('Error guardando perfil', err);
        alert('Error guardando perfil: ' + (err.message || err));
      }
    });
  }

  // --- Logout ---
  if (logoutBtn_ap) {
    logoutBtn_ap.addEventListener('click', async () => {
      try {
        await firebaseServices_ap.logoutUser_ap();
        window.location.href = 'index.html';
      } catch (err) {
        console.error('Error logout', err);
      }
    });
  }
});
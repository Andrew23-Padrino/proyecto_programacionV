import { mountHeader } from '../components/header.js';
import { mountFooter } from '../components/footer.js';
import { escapeHTML } from './utils.js';
import { firebaseServices_ap } from '../games/originales/firebase-services.js';

export function mountShell() {
  const headerRoot = document.getElementById('header-root');
  const footerRoot = document.getElementById('footer-root');
  if (headerRoot) mountHeader(headerRoot);
  if (footerRoot) mountFooter(footerRoot);
}

function closeDropdownsOnClickOutside() {
  // global click listener to close dropdowns
  const closeDropdowns = () => {
    document.querySelectorAll('.dropdown.open').forEach((d) => d.classList.remove('open'));
  };
  document.addEventListener('click', closeDropdowns);
}

export function showLoggedOutNav() {
  const loginLink = document.getElementById('login-link');
  const registerLink = document.getElementById('register-link');
  const navAuth = document.getElementById('nav-auth');
  const navUser = document.getElementById('nav-user');
  if (loginLink) loginLink.classList.remove('hidden');
  if (registerLink) registerLink.classList.remove('hidden');
  if (navAuth) navAuth.classList.remove('hidden');
  if (navUser) navUser.classList.add('hidden');
}

export function updateNavForUser(user, profile) {
  const loginLink = document.getElementById('login-link');
  const registerLink = document.getElementById('register-link');
  const navAuth = document.getElementById('nav-auth');
  const navUser = document.getElementById('nav-user');
  if (loginLink) loginLink.classList.add('hidden');
  if (registerLink) registerLink.classList.add('hidden');
  if (navAuth) navAuth.classList.add('hidden');
  if (!navUser) return;

  navUser.classList.remove('hidden');
  const displayNameRaw = (profile && (profile.nombre || profile.apellido)) ? `${profile.nombre || ''} ${profile.apellido || ''}`.trim() : (user.email || 'Usuario');
  const displayName = escapeHTML(displayNameRaw);
  let avatarHTML = '';
  if (profile?.carnetURL) {
    const safeUrl = escapeHTML(profile.carnetURL);
    avatarHTML = `<img src="${safeUrl}" alt="avatar" class="w-8 h-8 rounded-full object-cover">`;
  } else {
    const initials = escapeHTML(((profile && (profile.nombre || profile.apellido)) ? (profile.nombre?.charAt(0) || '') + (profile.apellido?.charAt(0) || '') : (user.email?.charAt(0) || 'U')));
    avatarHTML = `<div class="avatar bg-primary">${initials}</div>`;
  }

  navUser.innerHTML = `
    <div class="dropdown" id="nav-dropdown">
      <button class="flex items-center gap-2 text-white" id="nav-user-btn">
        ${avatarHTML}
        <span class="hidden sm:inline">${displayName}</span>
      </button>
      <div class="dropdown-menu" id="nav-user-menu">
        <a href="/src/pages/perfil/perfil.html">Mi perfil</a>
        <button id="nav-logout" class="text-left">Cerrar sesión</button>
      </div>
    </div>
  `;

  // wire dropdown + logout
  const dropdown = document.getElementById('nav-dropdown');
  const navLogout = document.getElementById('nav-logout');
  if (navLogout) navLogout.addEventListener('click', async () => { await firebaseServices_ap.logoutUser_ap(); window.location.href = '/'; });
  closeDropdownsOnClickOutside();
  const btnEl = document.getElementById('nav-user-btn');
  if (btnEl && dropdown) {
    btnEl.addEventListener('click', (ev) => {
      ev.stopPropagation();
      dropdown.classList.toggle('open');
    });
  }
}

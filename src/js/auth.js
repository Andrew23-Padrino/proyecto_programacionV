import { firebaseServices_ap } from '../games/originales/firebase-services.js';
import { updateNavForUser, showLoggedOutNav, mountShell } from './nav.js';
import { renderUserProfile } from './profile.js';

export function initAuth() {
  // Ensure header/footer mounted before any nav updates
  mountShell();

  if (firebaseServices_ap && firebaseServices_ap.auth) {
    firebaseServices_ap.onAuthStateChanged_ap(async (user) => {
      if (user) {
        const profile = await firebaseServices_ap.getUserProfile_ap(user.uid);
        try {
          updateNavForUser(user, profile);
        } catch (e) { console.warn('Error updating nav for user', e); }
        try {
          if (document.getElementById('profile-form')) {
            await renderUserProfile(user, profile);
          }
        } catch (e) { console.warn('Error rendering profile after auth', e); }
      } else {
        showLoggedOutNav();
        // show profile logged out state
        document.getElementById('profile-logged-out')?.classList.remove('hidden');
        document.getElementById('profile-form')?.classList.add('hidden');
      }
    });
  }
}

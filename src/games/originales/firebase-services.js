// Importar Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js';
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, query, where, getDocs, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js';
import { firebaseConfig_ap } from './firebase-config.js';

// Inicializar Firebase
const app_ap = initializeApp(firebaseConfig_ap);
const analytics_ap = getAnalytics(app_ap);
const db_ap = getFirestore(app_ap);
const auth_ap = getAuth(app_ap);
const storage_ap = getStorage(app_ap);

// Utilidades
const usuariosCollection = (uid) => doc(db_ap, 'usuarios', uid);

const isProfileComplete_ap = (profile) => {
  if (!profile) return false;
  const required = ['email', 'nombre', 'apellido', 'institucion', 'carnetURL'];
  return required.every((k) => profile[k] && profile[k].toString().trim() !== '');
};

export const firebaseServices_ap = {
  // Registrar usuario con contraseña proporcionada
  registerUser_ap: async (userData_ap, password_ap) => {
    const userCredential_ap = await createUserWithEmailAndPassword(
      auth_ap,
      userData_ap.email,
      password_ap
    );

    const uid_ap = userCredential_ap.user.uid;

    const profileDoc_ap = {
      uid: uid_ap,
      nombre: userData_ap.nombre || '',
      apellido: userData_ap.apellido || '',
      email: userData_ap.email || '',
      institucion: userData_ap.institucion || '',
      interes: userData_ap.interes || '',
      carnetURL: userData_ap.carnetURL || '',
      fechaRegistro: new Date(),
      profileComplete: isProfileComplete_ap(userData_ap) // Esto será recalculado al actualizar
    };

    await setDoc(usuariosCollection(uid_ap), profileDoc_ap);

    return userCredential_ap;
  },

  // Login
  loginUser_ap: async (email_ap, password_ap) => {
    const cred = await signInWithEmailAndPassword(auth_ap, email_ap, password_ap);
    return cred;
  },

  // Logout
  logoutUser_ap: async () => {
    await signOut(auth_ap);
  },

  // Subir carnet a Storage y devolver URL
  uploadCarnet_ap: async (uid_ap, file_ap) => {
    if (!file_ap) return null;
    const ref_ap = storageRef(storage_ap, `carnets/${uid_ap}/${file_ap.name}`);
    const snapshot_ap = await uploadBytes(ref_ap, file_ap);
    const url_ap = await getDownloadURL(snapshot_ap.ref);
    return url_ap;
  },

  // Guardar/Actualiza perfil en Firestore
  saveUserProfile_ap: async (uid_ap, profileData_ap) => {
    const docRef_ap = usuariosCollection(uid_ap);
    const existing = await getDoc(docRef_ap);
    const merged = Object.assign({}, existing.exists() ? existing.data() : {}, profileData_ap);
    merged.profileComplete = isProfileComplete_ap(merged);
    await setDoc(docRef_ap, merged, { merge: true });
    return merged;
  },

  // Obtener perfil de usuario
  getUserProfile_ap: async (uid_ap) => {
    const docRef_ap = usuariosCollection(uid_ap);
    const snap_ap = await getDoc(docRef_ap);
    return snap_ap.exists() ? snap_ap.data() : null;
  },

  // Enviar mensaje de contacto
  sendContactMessage_ap: async (messageData_ap) => {
    await addDoc(collection(db_ap, "mensajes"), {
      nombre: messageData_ap.nombre,
      email: messageData_ap.email,
      asunto: messageData_ap.asunto,
      mensaje: messageData_ap.mensaje,
      fecha: new Date(),
      leido: false
    });
  },

  // Suscribir al newsletter
  subscribeNewsletter_ap: async (email_ap) => {
    await addDoc(collection(db_ap, "suscripciones"), {
      email: email_ap,
      fecha: new Date(),
      activo: true
    });
  },

  // Registrar resultado de una partida en la colección 'partidas'
  addMatchResult_ap: async (matchData_ap) => {
    // matchData_ap: { winnerUid, loserUid, distance, angle, power, pointsAwarded, fecha }
    const docData = Object.assign({}, matchData_ap);
    // asegurar que pointsAwarded sea un número (por defecto 0)
    docData.pointsAwarded = typeof docData.pointsAwarded === 'number' ? docData.pointsAwarded : 0;
    // construir el array 'players' solo con UIDs presentes
    const players = [];
    if (docData.winnerUid && typeof docData.winnerUid === 'string') players.push(docData.winnerUid);
    if (docData.loserUid && typeof docData.loserUid === 'string') players.push(docData.loserUid);
    if (players.length) docData.players = players;
    // asignar un timestamp cliente en 'fecha' para que pase las reglas de seguridad
    // (usar serverTimestamp() puede hacer que las reglas lo rechacen porque es un marcador, no un timestamp concreto)
    docData.fecha = new Date();
    // Eliminar claves null o undefined para satisfacer reglas que requieren tipos numéricos cuando están presentes
    Object.keys(docData).forEach((k) => {
      if (docData[k] === null || typeof docData[k] === 'undefined') delete docData[k];
    });

    try{
      const ref = await addDoc(collection(db_ap, 'partidas'), docData);
      console.log('addMatchResult_ap success', ref.id, docData);
      return { id: ref.id, ...docData };
    }catch(e){
      console.error('addMatchResult_ap failed', e, docData);
      throw e;
    }
  },

  // Guardar un resumen de partida dentro del documento del usuario para lectura privada
  // path: usuarios/{uid}/partidas/{autoId}
  addUserMatchSummary_ap: async (uid_ap, summary_ap) => {
    if (!uid_ap) throw new Error('No uid for summary');
    const userPartidasCol = collection(db_ap, 'usuarios', uid_ap, 'partidas');
    const docData = Object.assign({}, summary_ap);
    docData.fecha = docData.fecha || new Date();
    try{
      const ref = await addDoc(userPartidasCol, docData);
      console.log('addUserMatchSummary_ap success', uid_ap, ref.id, docData);
      return { id: ref.id, ...docData };
    }catch(e){ console.error('addUserMatchSummary_ap failed', e, uid_ap, docData); throw e; }
  },

  // Obtener resúmenes de partidas guardadas en usuarios/{uid}/partidas
  getUserMatchSummaries_ap: async (uid_ap) => {
    if (!uid_ap) return [];
    try{
      const colRef = collection(db_ap, 'usuarios', uid_ap, 'partidas');
      const snap = await getDocs(colRef);
      const res = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      res.sort((a,b) => (b.fecha?.toMillis ? b.fecha.toMillis() : new Date(b.fecha).getTime()) - (a.fecha?.toMillis ? a.fecha.toMillis() : new Date(a.fecha).getTime()));
      return res;
    }catch(e){ console.error('getUserMatchSummaries_ap failed', e, uid_ap); throw e; }
  },

  // Obtener partidas de un usuario (usa 'players' array si existe)
  getMatchesForUser_ap: async (uid_ap) => {
    if (!uid_ap) return [];
    // Try query by players array first
    const col = collection(db_ap, 'partidas');
    try {
      const q = query(col, where('players', 'array-contains', uid_ap));
      const snap = await getDocs(q);
      if (!snap.empty) return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Fallback: query winnerUid and loserUid
      const q1 = query(col, where('winnerUid', '==', uid_ap));
      const q2 = query(col, where('loserUid', '==', uid_ap));
      const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const results = [];
      s1.forEach(d => results.push({ id: d.id, ...d.data() }));
      s2.forEach(d => results.push({ id: d.id, ...d.data() }));
      // sort by fecha desc
      results.sort((a,b) => (b.fecha?.toMillis ? b.fecha.toMillis() : new Date(b.fecha).getTime()) - (a.fecha?.toMillis ? a.fecha.toMillis() : new Date(a.fecha).getTime()));
      return results;
    } catch (err) {
      console.error('getMatchesForUser_ap failed for uid=', uid_ap, err);
      throw err;
    }
  },

  // Sumar puntos a un usuario (lee doc y actualiza campo 'puntos')
  addPointsToUser_ap: async (uid_ap, points_ap) => {
    if (!uid_ap) return null;
    const docRef = usuariosCollection(uid_ap);
    const snap = await getDoc(docRef);
    const existing = snap.exists() ? snap.data() : {};
    const currentPoints = existing.puntos ? Number(existing.puntos) : 0;
    const updated = Object.assign({}, existing, { puntos: currentPoints + Number(points_ap) });
    await setDoc(docRef, updated, { merge: true });
    return updated;
  },

  // Guardar/actualizar la nota de una materia para un usuario
  // subject_ap: string (e.g. 'fisica'), score_ap: number
  setSubjectGrade_ap: async (uid_ap, subject_ap, score_ap) => {
    if (!uid_ap || !subject_ap) return null;
    const docRef = usuariosCollection(uid_ap);
    const snap = await getDoc(docRef);
    const existing = snap.exists() ? snap.data() : {};
    const materias = existing.materias ? Object.assign({}, existing.materias) : {};
    materias[subject_ap] = Number(score_ap);
    const updated = Object.assign({}, existing, { materias });
    await setDoc(docRef, updated, { merge: true });
    return updated;
  },

  // Exponer auth object por si se necesita onAuthStateChanged en app.js
  auth: auth_ap,
  isProfileComplete_ap,
  // Wrapper para la suscripción a cambios de autenticación
  onAuthStateChanged_ap: (cb) => onAuthStateChanged(auth_ap, cb)
};
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const LEGACY_KEY = "beyond-state";
const LEGACY_OWNER_KEY = "beyond-state-owner";
const LOCAL_UID_KEY = "beyond-uid";

let app = null;
let auth = null;
let db = null;
let currentUser = null;
let authReady = false;
let authWaiters = [];

function notifyAuthReady() {
  authReady = true;
  authWaiters.splice(0).forEach((fn) => fn(currentUser));
}

function localKey(uid) {
  return uid ? "beyond-state-" + uid : "beyond-state-guest";
}

function unwrapLocal(raw) {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!data) return null;
    if (data.state && typeof data.updatedAt === "number") {
      return { updatedAt: data.updatedAt, state: data.state };
    }
    if (data.character) {
      return { updatedAt: 0, state: data };
    }
    return null;
  } catch {
    return null;
  }
}

export function cloudEnabled() {
  return isFirebaseConfigured();
}

export function getCurrentUser() {
  return currentUser;
}

export function whenAuthReady() {
  if (authReady) return Promise.resolve(currentUser);
  return new Promise((resolve) => authWaiters.push(resolve));
}

export function initCloud() {
  if (!isFirebaseConfigured()) {
    currentUser = null;
    notifyAuthReady();
    return { enabled: false };
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) localStorage.setItem(LOCAL_UID_KEY, user.uid);
    else localStorage.removeItem(LOCAL_UID_KEY);
    notifyAuthReady();
  });

  return { enabled: true };
}

export async function register(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }
  return cred.user;
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}

export function loadLocal(uid) {
  const keyUid = uid || (currentUser && currentUser.uid) || null;
  const keyed = unwrapLocal(localStorage.getItem(localKey(keyUid)));
  if (keyed) return keyed.state;

  // Legacy shared key — only for guest / same owner
  const legacy = unwrapLocal(localStorage.getItem(LEGACY_KEY));
  if (!legacy) return null;
  const owner = localStorage.getItem(LEGACY_OWNER_KEY);
  if (!keyUid) {
    if (!owner) return legacy.state;
    return null;
  }
  if (owner === keyUid) return legacy.state;
  return null;
}

export function saveLocal(state) {
  try {
    const uid = currentUser && currentUser.uid;
    const bundle = { updatedAt: Date.now(), state };
    localStorage.setItem(localKey(uid || null), JSON.stringify(bundle));
    if (uid) localStorage.setItem(LEGACY_OWNER_KEY, uid);
    else localStorage.removeItem(LEGACY_OWNER_KEY);
    // Keep legacy key in sync for older builds, scoped by owner
    localStorage.setItem(LEGACY_KEY, JSON.stringify(bundle));
    return true;
  } catch (e) {
    console.error("local save failed", e);
    return false;
  }
}

export function clearLocal() {
  const uid = currentUser && currentUser.uid;
  localStorage.removeItem(localKey(uid || null));
  localStorage.removeItem(localKey(null));
  const owner = localStorage.getItem(LEGACY_OWNER_KEY);
  if (!owner || (uid && owner === uid)) {
    localStorage.removeItem(LEGACY_KEY);
    localStorage.removeItem(LEGACY_OWNER_KEY);
  }
}

function userDocRef(uid) {
  return doc(db, "users", uid);
}

export async function loadCloud(uid) {
  if (!db || !uid) return null;
  const snap = await getDoc(userDocRef(uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!data || !data.state) return null;
  return { updatedAt: data.updatedAt || 0, state: data.state };
}

export async function saveCloud(uid, state) {
  if (!db || !uid || !state) return;
  await setDoc(
    userDocRef(uid),
    {
      email: currentUser?.email || null,
      updatedAt: Date.now(),
      state,
    },
    { merge: true }
  );
}

/** Save both locally and to cloud when logged in. */
export async function persistState(state) {
  const ok = saveLocal(state);
  if (currentUser) {
    try {
      await saveCloud(currentUser.uid, state);
    } catch (e) {
      console.error("cloud save failed", e);
      throw e;
    }
  }
  return ok;
}

/**
 * Prefer newer of cloud vs local for this uid.
 * Never upload another account's / guest blob to a fresh account.
 */
export async function hydrateState() {
  if (!currentUser) {
    return loadLocal(null);
  }

  const uid = currentUser.uid;
  let localBundle = unwrapLocal(localStorage.getItem(localKey(uid)));
  if (!localBundle) {
    const legacy = unwrapLocal(localStorage.getItem(LEGACY_KEY));
    const owner = localStorage.getItem(LEGACY_OWNER_KEY);
    // Same owner, or orphan legacy (pre-scoped saves) — only used if cloud empty below
    if (legacy && (!owner || owner === uid)) localBundle = legacy;
  }

  try {
    const cloudBundle = await loadCloud(uid);
    if (cloudBundle && localBundle) {
      if ((localBundle.updatedAt || 0) > (cloudBundle.updatedAt || 0)) {
        await saveCloud(uid, localBundle.state);
        saveLocal(localBundle.state);
        return localBundle.state;
      }
      saveLocal(cloudBundle.state);
      return cloudBundle.state;
    }
    if (cloudBundle) {
      saveLocal(cloudBundle.state);
      return cloudBundle.state;
    }
    if (localBundle) {
      await saveCloud(uid, localBundle.state);
      saveLocal(localBundle.state);
      return localBundle.state;
    }
    return null;
  } catch (e) {
    console.error("cloud load failed", e);
    return localBundle ? localBundle.state : null;
  }
}

export async function deleteCloudAndLocal() {
  clearLocal();
  if (currentUser && db) {
    try {
      await setDoc(
        userDocRef(currentUser.uid),
        { state: null, updatedAt: Date.now(), cleared: true },
        { merge: true }
      );
    } catch (e) {
      console.error("cloud clear failed", e);
    }
  }
}

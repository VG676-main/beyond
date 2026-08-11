// Ключи из Firebase Console (проект beyond-vg676)

export const firebaseConfig = {
  apiKey: "AIzaSyAfwYgoyTj-8BxSbJQ_DVwbjC1AZMntaqE",
  authDomain: "beyond-vg676.firebaseapp.com",
  projectId: "beyond-vg676",
  storageBucket: "beyond-vg676.firebasestorage.app",
  messagingSenderId: "962958308820",
  appId: "1:962958308820:web:f23e0c1971a68e2636d241",
};

export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

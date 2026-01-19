import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAEtOn6Inzj9F3fE_003_MvJqrajYrAO3M",
  authDomain: "escape-9ab42.firebaseapp.com",
  projectId: "escape-9ab42",
  storageBucket: "escape-9ab42.firebasestorage.app",
  messagingSenderId: "776660008357",
  appId: "1:776660008357:web:96275b585876fcb7557c4c",
  measurementId: "G-8KBXJZF2ZF"
};
const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";  // <-- import getStorage

const firebaseConfig = {
  apiKey: "AIzaSyAx2eYJu9HNQTSCtfVCqvZAF7gUjDjmA0A",
  authDomain: "freedome-dfd07.firebaseapp.com",
  projectId: "freedome-dfd07",
  storageBucket: "freedome-dfd07.appspot.com", // <-- fix storageBucket url here
  messagingSenderId: "1042730816071",
  appId: "1:1042730816071:web:625861056b00d0b2461762"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);  // <-- initialize storage

export { auth, provider, db, storage };  // <-- export storage

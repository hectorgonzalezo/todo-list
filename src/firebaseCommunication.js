// Saves a new message to Cloud Firestore.
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signOut,
  signInWithPopup,
} from "firebase/auth";
import { getFirebaseConfig } from "./firebase-config";

const firebaseApp = initializeApp(getFirebaseConfig());

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const todosCol = collection(db, "todos");
// const snapshot = await getDocs(todosCol);

function getProfilePicUrl() {
  return getAuth().currentUser.photoURL || "";
}

// Returns the signed-in user's display name.
function getUserName() {
  return getAuth().currentUser.displayName || "";
}

async function signIn(e) {
  // sign in
  if (e.target.innerText === "Sign In") {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(getAuth(), provider);
  } else {
    // sign out
    signOut(getAuth());
  }
}

async function saveMessage(messageText) {
  // Add a new message entry to the Firebase database.
  try {
    console.log(messageText);
    await addDoc(collection(db, "messages"), {
      name: getAuth().currentUser.displayName,
      text: messageText,
      profilePicUrl: getAuth().currentUser.photoURL,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error writing new message to Firebase Database", error);
  }
}

export { saveMessage, signIn, auth, getUserName, getProfilePicUrl };

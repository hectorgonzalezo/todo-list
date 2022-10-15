import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
  signInWithPopup,
} from "firebase/auth";
import { getFirebaseConfig } from "./firebase-config";

const buttonSignIn = document.querySelector("#button-sign");
const userName = document.querySelector("#user-name");
const userImg = document.querySelector("#user-img");

function addImgAndName() {
  userName.innerText = getAuth().currentUser.displayName || "";
  userImg.src = getAuth().currentUser.photoURL || "./assets/user-icon.svg`";
}

// Show sign in popup
async function signIn(e) {
  // sign in
  if (e.target.innerText === "Sign In") {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(getAuth(), provider);
    buttonSignIn.innerText = "Sign Out";
  } else {
    // sign out
    signOut(getAuth());
    buttonSignIn.innerText = "Sign In";
  }
  addImgAndName();
}

buttonSignIn.addEventListener("click", signIn);

const firebaseApp = initializeApp(getFirebaseConfig());

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const todosCol = collection(db, "todos");
// const snapshot = await getDocs(todosCol);

onAuthStateChanged(auth, (user) => {
  if (user != null) {
    console.log("loged in");
  } else {
    console.log("No user");
  }
});

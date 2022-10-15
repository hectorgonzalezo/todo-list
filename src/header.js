import { onAuthStateChanged } from "firebase/auth";
import {
  auth,
  signIn,
  getUserName,
  getProfilePicUrl,
} from "./firebaseCommunication";

const buttonSignIn = document.querySelector("#button-sign");
const userName = document.querySelector("#user-name");
const userImg = document.querySelector("#user-img");

function addImgAndName() {
  userName.innerText = getUserName();
  userImg.src = getProfilePicUrl();
}

function removeImgAndName() {
  userName.innerText = "";
  userImg.src = "";
}

// Show sign in popup

buttonSignIn.addEventListener("click", signIn);

// changes the user area on log in and log out
onAuthStateChanged(auth, (user) => {
  if (user != null) {
    console.log("loged in");
    addImgAndName();
    buttonSignIn.innerText = "Sign Out";
  } else {
    console.log("No user");
    removeImgAndName();
    buttonSignIn.innerText = "Sign In";
  }
});

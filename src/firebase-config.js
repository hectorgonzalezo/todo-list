const config = {
  apiKey: "AIzaSyAnx9tC7G7V2x2yisYuSJfDIvkavL1V_G4",
  authDomain: "todo-list-ff25d.firebaseapp.com",
  projectId: "todo-list-ff25d",
  storageBucket: "todo-list-ff25d.appspot.com",
  messagingSenderId: "982547243631",
  appId: "1:982547243631:web:898a7be4f90980453c639a",
  measurementId: "G-HXPS1MCNCF",
};

export function getFirebaseConfig() {
  if (!config || !config.apiKey) {
    throw new Error(
      "No Firebase configuration object provided." +
        "\n" +
        "Add your web app's configuration object to firebase-config.js"
    );
  } else {
    return config;
  }
}

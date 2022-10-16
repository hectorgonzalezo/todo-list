// Saves a new message to Cloud Firestore.
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDocs,
  deleteDoc,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signOut,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirebaseConfig } from "./firebase-config";
import PubSub from "pubsub-js";

const firebaseApp = initializeApp(getFirebaseConfig());

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

function getProfilePicUrl() {
  return getAuth().currentUser.photoURL || "";
}

// Returns the signed-in user's display name.
function getUserName() {
  return getAuth().currentUser.displayName || "Sign in to view todos";
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

onAuthStateChanged(auth, (user) => {
  if (user != null) {
    getTodos();
  }
});

async function saveTodo(todo) {
  // Add a new message entry to the Firebase database.
  try {
    await addDoc(collection(db, `${auth.currentUser.uid}todos`), {
      userName: getAuth().currentUser.displayName,
      name: todo.name,
      notes: todo.notes || "",
      date: todo.date.toString(),
      priority: todo.priority || "",
      list: todo.list || "",
      done: todo.done || false,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error writing new message to Firebase Database", error);
  }
}

async function getTodos() {
  if (auth.currentUser !== null) {
    // Create the query to load the last 12 messages and listen for new ones.
    const todosQuery = await getDocs(
      collection(db, `${auth.currentUser.uid}todos`),
      orderBy("date", "desc")
    );
    const todos = [];
    todosQuery.forEach((todo) => {
      const { name, date, priority, list, notes } = todo.data();
      todos.push({ name, date, priority, list, notes });
    });
    PubSub.publish("todos-fetched-from-storage", todos);
    return todos;
  }
  return [];
}

async function deleteTodo(todoName) {
  if (auth.currentUser !== null) {
    const todosQuery = await getDocs(
      collection(db, `${auth.currentUser.uid}todos`)
    );
    todosQuery.forEach((todo) => {
      if (todo.data().name === todoName) {
        deleteDoc(doc(db, `${auth.currentUser.uid}todos`, todo.id));
      }
    });
  }
}

async function updateTodo(todoName, todo) {
  if (auth.currentUser !== null) {
    const todosQuery = await getDocs(
      collection(db, `${auth.currentUser.uid}todos`)
    );
    todosQuery.forEach(async (todoUpdate) => {
      if (todoUpdate.data().name === todoName) {
        await deleteTodo(todoName);
        await saveTodo(todo);
      }
    });
  }
}

const database = { saveTodo, getTodos, deleteTodo, updateTodo };

export { database, signIn, auth, getUserName, getProfilePicUrl };

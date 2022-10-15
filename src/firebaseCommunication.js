// Saves a new message to Cloud Firestore.
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDocs,
  deleteDoc,
  updateDoc,
  orderBy,
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

async function saveTodo(todo) {
  // Add a new message entry to the Firebase database.
  try {
    await addDoc(collection(db, "todos"), {
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
  // Create the query to load the last 12 messages and listen for new ones.
  const todosQuery = await getDocs(
    collection(db, "todos"),
    orderBy("date", "desc")
  );
  const todos = [];
  todosQuery.forEach((todo) => {
    const { name, date, priority, list, notes } = todo.data();
    todos.push({ name, date, priority, list, notes });
  });
  return todos;
}

async function deleteTodo(todoName) {
  const todosQuery = await getDocs(collection(db, "todos"));
  todosQuery.forEach((todo) => {
    if (todo.data().name === todoName) {
      deleteDoc(doc(db, "todos", todo.id));
    }
  });
}

async function updateTodo(todoName, todo) {
  const todosQuery = await getDocs(collection(db, "todos"));
  todosQuery.forEach(async (todoUpdate) => {
    if (todoUpdate.data().name === todoName) {
      await deleteTodo(todoName);
      await saveTodo(todo);
    }
  });
}

const database = { saveTodo, getTodos, deleteTodo, updateTodo };

export { database, signIn, auth, getUserName, getProfilePicUrl };

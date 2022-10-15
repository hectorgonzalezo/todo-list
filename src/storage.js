import PubSub from "pubsub-js";
import { saveMessage } from "./firebaseCommunication";

// this function checks if there's storage available to implement persistence of todos.
const storage = (function () {
  function storageAvailable(type) {
    let currentStorage;

    try {
      currentStorage = window[type];
      const x = "__currentStorage_test__";
      currentStorage.setItem(x, x);
      currentStorage.removeItem(x);
      return true;
    } catch (e) {
      return (
        e instanceof DOMException &&
        // everything except Firefox
        (e.code === 22 ||
          // Firefox
          e.code === 1014 ||
          // test name field too, because code might not be present
          // everything except Firefox
          e.name === "QuotaExceededError" ||
          // Firefox
          e.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
        // acknowledge QuotaExceededError only if there's something already stored
        currentStorage &&
        currentStorage.length !== 0
      );
    }
  }

  const getAll = function getAll() {
    const storedTodosNames = [];
    // iterate trough localStorage and extract the names of each Todo stored
    for (let i = 0; i < localStorage.length; i++) {
      storedTodosNames.push(localStorage.key(i));
    }
    // get the todos themselves from the names
    const storedTodos = storedTodosNames.map((name) =>
      // convert each item back to an object.
      JSON.parse(localStorage.getItem(name))
    );
    return Array.from(storedTodos);
  };

  function startStorage() {
    // if there's local storage available, store any todos made by user
    if (storageAvailable("localStorage")) {
      // if there's previous data on storage, display it
      if (localStorage.length > 0) {
        const storedTodos = getAll();
        PubSub.publish("todos-fetched-from-storage", storedTodos);
      }
    }
  }

  function add(todo) {
    // convert object to string and save it in local storage
    localStorage.setItem(todo.name, JSON.stringify(todo));
    // save on firebase
    saveMessage(todo.name);
  }

  function remove(todoName) {
    localStorage.removeItem(todoName);
  }

  function update(previousName, updatedTodo) {
    remove(previousName);
    add(updatedTodo);
  }

  PubSub.subscribe("webpage-loaded", startStorage);

  return { getAll, add, remove, update };
})();

export default storage;

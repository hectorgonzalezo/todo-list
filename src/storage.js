import PubSub from "pubsub-js";
import { database } from "./firebaseCommunication";

// this function checks if there's storage available to implement persistence of todos.
const storage = (function () {
  function startStorage() {
    database.getTodos().then((todos) => {
      PubSub.publish("todos-fetched-from-storage", todos);
    });
  }

  function add(todo) {
    database.saveTodo(todo);
  }

  function remove(todoName) {
    // localStorage.removeItem(todoName);
    database.deleteTodo(todoName);
  }

  async function update(previousName, updatedTodo) {
    database.updateTodo(previousName, updatedTodo);
  }

  PubSub.subscribe("webpage-loaded", startStorage);

  return { add, remove, update };
})();

export default storage;

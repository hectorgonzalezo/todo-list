import { compareAsc } from "date-fns";
import PubSub from "pubsub-js";
import storage from "./storage";

// todo class
class Todo {
  constructor(name, notes, date, priority, list = "", done = false) {
    this.name = name;
    this.notes = notes;
    this.date = date;
    this.priority = priority;
    this.list = list;
    this.done = done;
  }

  getName() {
    return this.name;
  }

  getList() {
    return this.lists;
  }
}

const List = function (name) {
  // start with empty content if not provided
  let content = [];

  function filterContent() {
    content = content.sort((a, b) => compareAsc(a.date, b.date));
    return content;
  }

  function length() {
    return Object.keys(content).length;
  }

  function getName() {
    return name;
  }

  function getContent() {
    return filterContent();
  }

  function add(todo) {
    content.push(todo);
  }

  function from(array) {
    content = array;
  }

  function remove(todoName) {
    content = content.filter((todo) => todo.name !== todoName);
  }

  const update = function (todoName, updatedTodo) {
    console.log({ todoName });
    // find todo index and update information
    const indexOfTodoToUpdate = content.findIndex(
      (todo) => todo.name === todoName
    );
    // if it found one, update it
    if (indexOfTodoToUpdate >= 0) {
      // keep 'done' value
      updatedTodo.done = content[indexOfTodoToUpdate].done;
      content[indexOfTodoToUpdate] = updatedTodo;
    }
  };

  return { getName, getContent, length, add, from, remove, update };
};

// Inbox inherits from List
// empty name
const Inbox = function () {
  const { length, getName, getContent, add, remove, update } = List("Inbox");

  return { length, getName, getContent, add, remove, update };
};

const listManager = (function () {
  const lists = {};

  function addList(msg, listName) {
    lists[listName] = List(listName);
  }

  function getAllLists() {
    return lists;
  }

  function getList(name) {
    if (Object.prototype.hasOwnProperty.call(lists, name)) {
      return lists[name];
    }
    return inboxManager.getInbox();
  }

  function deleteList(msg, name) {
    const listToDelete = lists[name].getContent();
    // change list value and store in memory
    listToDelete.forEach((todo) => {
      todo.list = "";
      storage.update(todo.name, todo);
    });

    // delete from list
    delete lists[name];
  }

  function addToList(msg, todo) {
    const todoListName = todo.list;
    console.log(todoListName);
    // if todo list exists, add it there
    if (Object.prototype.hasOwnProperty.call(lists, todoListName)) {
      getList(lists[todoListName]).add(todo);
    } else if (todoListName !== "") {
      // if listName doesnt exist and isn't empty option, create it
      addList("", todoListName);
      // and add todo
      lists[todoListName].add(todo);
    }
  }

  function removeFromList(msg, todoName) {
    for (const listName in lists) {
      const list = lists[listName];
      list.remove(todoName);
    }
  }

  function updateList(msg, updatedTodo) {
    const [previousName, todo] = updatedTodo;
    for (const listName in lists) {
      const list = lists[listName];
      if (list !== "Inbox") {
        list.update(previousName, updatedTodo);
      }
    }
  }

  PubSub.subscribe("pressed-add-list", addList);
  PubSub.subscribe("object-added-to-inbox", addToList);
  PubSub.subscribe("object-removed-from-inbox", removeFromList);
  PubSub.subscribe("pressed-delete-list", deleteList);
  PubSub.subscribe("todo-updated", updateList);

  return { addList, getAllLists, getList };
})();

const inboxManager = (function () {
  const inbox = new Inbox();

  const getInbox = function () {
    return inbox;
  };

  const addTodo = function (data, msg) {
    const newTodo = Object.assign(new Todo(), format(data));
    inbox.add(newTodo);
    PubSub.publish("object-added-to-inbox", newTodo);

    if (msg !== "todos-fetched-from-storage") {
      // add to local storage only if message wasnt sent after fetching from local storage
      storage.add(newTodo);
    }
  };

  const deleteTodo = function (todoName) {
    inbox.remove(todoName);
    PubSub.publish("object-removed-from-inbox", todoName);

    // delete form local storage
    storage.remove(todoName);
  };

  const updateTodo = function (previousName, data) {
    const updatedTodo = Object.assign(new Todo(), format(data));
    inbox.update(previousName, updatedTodo);
    PubSub.publish("todo-selected", data);
    PubSub.publish("todo-updated", [previousName, updatedTodo]);

    // update local storage
    storage.update(previousName, updatedTodo);
    PubSub.publish("inbox-updated", inbox.getContent());
  };

  const getFilteredInbox = function (comparerFunction, title) {
    let inboxArray = inbox.getContent();
    // filter array and only get today's results
    inboxArray = inboxArray.filter((todo) => comparerFunction(todo.date));

    // make new list and add array to it
    const filteredList = new List(title);
    filteredList.from(inboxArray);

    return filteredList;
  };

  const updateFromStorage = function (msg, todosArray) {
    todosArray.forEach((todo) => {
      addTodo(todo, msg);
    });
    PubSub.publish("inbox-initialized", inbox.getContent());
  };

  // gives the correct format to date before passing it to add
  const format = function (todoData) {
    const newDate = new Date(todoData.date);
    todoData.date = newDate;
    return todoData;
  };

  PubSub.subscribe("todos-fetched-from-storage", updateFromStorage);

  return { getInbox, addTodo, deleteTodo, updateTodo, getFilteredInbox };
})();

export { listManager, inboxManager };

import PubSub from "pubsub-js";
import { selectorPopulator } from "./webpageLibrary";
import { listManager, inboxManager } from "./todos";
import { isPast } from "date-fns";

(function popupFormController() {
  const form = document.querySelector("#popup > form");

  const clearForm = function () {
    form.reset();
  };

  const createTodo = function () {
    // extract data from form and make it a FormData
    const formData = new FormData(form);
    const todoData = Object.fromEntries(formData.entries());
    todoData.date = new Date(todoData.date);

    // add to inbox
    inboxManager.addTodo(todoData);

    clearForm();
  };

  PubSub.subscribe("pressed-create-button", () => {
    createTodo();
    clearForm();
  });
})();

const popupDisplay = (function () {
  const popup = document.querySelector("#popup");
  const listsSelector = document.querySelector("#add-todo-list");
  const buttonCreate = document.querySelector("#popup-button");
  const buttonClose = document.querySelector("#close-pop-up");
  const dateInput = document.querySelector("input#date");
  const dateWarning = document.querySelector("#date-warning");
  const form = document.querySelector("#popup > form");

  // hide or show popup
  const toggle = function () {
    popup.classList.toggle("invisible");
    PubSub.publish("popup-toggled");
  };

  const populateListsSelector = function () {
    selectorPopulator.populateLists(
      listsSelector,
      "",
      listManager.getAllLists()
    );
  };

  // if the user chooses a date that passed, highlight the input
  dateInput.addEventListener("change", () => {
    const chosenDate = new Date(dateInput.value);
    if (isPast(chosenDate)) {
      dateInput.classList.add("invalid");
    } else {
      dateWarning.classList.remove("visible");
      dateInput.classList.remove("invalid");
    }
  });

  buttonCreate.addEventListener("click", (e) => {
    const chosenDate = new Date(dateInput.value);
    // if the user chooses a date that passed,  show warning

    if (isPast(chosenDate)) {
      dateWarning.classList.add("visible");
    } else if (form.checkValidity()) {
      e.preventDefault();
      dateWarning.classList.remove("visible");
      toggle();
      PubSub.publish("pressed-create-button");
    }
  });
  buttonClose.addEventListener("click", toggle);

  PubSub.subscribe("pressed-add-button", toggle);
  PubSub.subscribe("pressed-add-button", populateListsSelector);
})();

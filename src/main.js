import PubSub from "pubsub-js";
import { isToday, isThisWeek, isPast, format, formatDistance } from "date-fns";
import _ from "lodash";
import deleteIconUrl from "./assets/delete-icon.png";
import { listManager, inboxManager } from "./todos";
import deleteIconBlackUrl from "./assets/delete-icon-black.png";
import "./style.css";
import {
  webpage,
  selectorPopulator,
  DetailElement,
  DetailDate,
  DetailSelector,
} from "./webpageLibrary";
import "./header";
import { saveMessage } from "./firebaseCommunication";

(function visibleArea() {
  // toggles through activation/deactivation of all buttons
  // and other inputs when showing popup
  const toggleAllInputs = function () {
    const visibleInputs = document.querySelectorAll(
      `#visible-area button, 
            #visible-area li,
            #visible-area .sidebar-list,
            #visible-area textarea,
            #visible-area input,
            #visible-area select,
            #visible-area img`
    );

    visibleInputs.forEach((input) => {
      input.classList.toggle("inactive");
    });
  };

  PubSub.subscribe("popup-toggled", toggleAllInputs);
})();

(function sideBarController() {
  const listsArea = document.querySelector("#lists-area");
  const buttonAddList = document.querySelector("#lists-area button");
  const commonItems = document.querySelectorAll("#common-items-area li");

  const removeTrashBins = function () {
    const trashBin = document.querySelector(".trash-bin");
    if (trashBin != null) {
      // if there's one
      trashBin.remove();
    }
  };

  const removeSelectedClasses = function () {
    const selectedField = document.querySelector(".selected");
    if (selectedField != null) {
      // if there's one
      selectedField.classList.remove("selected");
    }
  };

  const expandList = function (name, field) {
    // if field exists
    // else go to inbox
    removeTrashBins();
    removeSelectedClasses();

    field.classList.add("selected");
    // PubSub.publish('list-clicked', name);

    // add delete icon to list field
    const deleteIcon = document.createElement("img");
    deleteIcon.src = deleteIconUrl;
    deleteIcon.classList.add("trash-bin"); // so that it can be shaken
    field.append(deleteIcon);

    // delete list when pressing delete icon
    deleteIcon.addEventListener("click", deleteSelectedList);
  };

  const deleteSelectedList = function (e) {
    e.stopPropagation();
    const selectedList = document.querySelector("div.selected");
    selectedList.remove();
    PubSub.publish("pressed-delete-list", selectedList.id);
    const inboxField = document.querySelector("#inbox-field");
    inboxField.classList.add("selected");
  };

  const addList = function (name) {
    // create List field, add name and id
    const listField = document.createElement("div");
    listField.classList.add("list-field");
    listField.setAttribute("id", name);
    listField.classList.add("sidebar-list");
    const listTitle = document.createElement("h2");
    listTitle.innerText = _.capitalize(name);
    listTitle.classList.add("list-title");
    listField.append(listTitle);

    listsArea.append(listField);

    // when clicking on listField
    listField.addEventListener("click", () => {
      expandList(name, listField);
      PubSub.publish("sidebar-item-selected", name);
    });
  };

  // shows prompt to add list
  const showListAdder = function () {
    // prevent multiple presses of button
    buttonAddList.disabled = true;
    buttonAddList.classList.add("inactive");

    // creates the field where user will input the new list name
    const inputForm = document.createElement("form");
    inputForm.setAttribute("id", "list-input");
    const listInput = document.createElement("input");
    listInput.setAttribute("type", "text");
    listInput.setAttribute("minlength", "1");
    listInput.setAttribute("placeholder", "List name");
    listInput.setAttribute("required", "");
    const buttonAdd = document.createElement("button");
    buttonAdd.setAttribute("type", "submit");
    buttonAdd.innerText = "Add";
    const buttonCancel = document.createElement("button");
    buttonCancel.setAttribute("type", "button");
    buttonCancel.innerText = "Cancel";

    inputForm.append(listInput, buttonAdd, buttonCancel);

    listsArea.append(inputForm);

    // add listener for both buttons
    inputForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // publish so that listManager can be updated
      PubSub.publish("pressed-add-list", listInput.value);
      addList(listInput.value);
      buttonAddList.disabled = false;
      buttonAddList.classList.remove("inactive");
      inputForm.remove();
    });

    buttonCancel.addEventListener("click", () => {
      inputForm.remove();
      buttonAddList.disabled = false;
      buttonAddList.classList.remove("inactive");
    });
  };

  // create lists stored on listManager on site load
  const populateInitialLists = function () {
    const existingLists = listManager.getAllLists();
    for (const property in existingLists) {
      addList(property);
    }
  };

  // when pressing button to add lists
  buttonAddList.addEventListener("click", showListAdder);

  // add functionality to inbox, today and this week areas
  commonItems.forEach((item) => {
    item.addEventListener("click", () => {
      removeTrashBins();
      removeSelectedClasses();
      item.classList.add("selected");
      PubSub.publish("sidebar-item-selected", item.innerText);
    });
  });

  PubSub.subscribe("inbox-initialized", populateInitialLists);
  // PubSub.subscribe('inbox-updated', updateLists)
})();

// controls details display window
(function mainTodoListController() {
  const titleList = document.querySelector("#list-title");
  const todoContainer = document.querySelector("#todos-container");
  const todos = todoContainer.children;
  const buttonAddTodo = document.querySelector("#button-add-todo");
  let currentListInView;
  let nameOfSelected;

  // this function looks through the DOM list, and if it finds a
  // todo with a data attribute as the edited one, it keeps the selection
  // this allows to keep selections, even when changing the date
  const keepSelection = function (previousName) {
    // otherwise, select item indicated by selected argument
    const containerItems = todoContainer.children;
    const itemsArray = Array.from(containerItems);
    let selectedIndex;
    itemsArray.forEach((item, i) => {
      if (item.getAttribute("data") == previousName) {
        selectedIndex = i;
      }
    });
    containerItems.item(selectedIndex).classList.add("selected");
  };

  // update left side div with items from list
  const renderList = function (msg, listName = "Inbox", previousName) {
    webpage.cleanDiv(todoContainer);
    let list;
    if (listName == "Inbox" || listName == undefined || listName == "") {
      list = inboxManager.getInbox();
    } else if (listName == "Today") {
      list = inboxManager.getFilteredInbox(isToday, "Today");
    } else if (listName == "This week") {
      list = inboxManager.getFilteredInbox(isThisWeek, "This Week");
    } else {
      list = listManager.getList(listName);
    }

    currentListInView = list.getName();

    // update title
    titleList.innerText = _.capitalize(currentListInView);
    const listContent = list.getContent();

    // append all of the content to todoContainer
    // name is sent to be added as a data attribute
    for (const todo of listContent) {
      renderTodo(todo, todo.name);
    }
    // select first element if list isn't empty
    if (list.getContent().length > 0) {
      if (previousName == undefined) {
        // if none is selected, choose the first
        todoContainer.firstChild.classList.add("selected");
        PubSub.publish("todo-selected", listContent[0]);
        nameOfSelected = currentListInView;
      } else {
        // if there's one already selected
        keepSelection(previousName);
      }
    }
  };

  const renderTodo = function (todo, dataAttribute) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("todo");
    // this will be used to extract currentIndexOfSelected
    // which in turn is used by renderList to determine if there's
    // an item selected at the moment
    wrapper.setAttribute("data", dataAttribute);

    // create elements
    const checkBox = document.createElement("div");
    checkBox.classList.add("check-box");
    const todoName = document.createElement("h3");
    todoName.innerText = todo.getName();
    const todoList = document.createElement("p");
    todoList.innerText = todo.getList() || "";

    wrapper.append(checkBox, todoName, todoList);
    todoContainer.append(wrapper);

    // if its done, add the corresponding class to wrapper
    if (todo.done == true) {
      wrapper.classList.add("done");
    } else if (isPast(todo.date)) {
      // if it isn't done but dueDate is past
      wrapper.classList.add("past");
    }

    // add eventListener that selects wrapper
    wrapper.addEventListener("click", () => {
      selectTodo(wrapper);
      PubSub.publish("todo-selected", todo);
      nameOfSelected = wrapper.getAttribute("data");
    });

    // pressing on the checkbox updates the todo to be done
    // this should cross out the text and put the selected todo
    // at the bottom
    checkBox.addEventListener("click", () => {
      todo.done = !todo.done;
      wrapper.classList.toggle("done");
    });
  };

  const selectTodo = function (todoWrapper) {
    if (todoWrapper) {
      // prevents from trying when there are no more todos
      // remove selected from the rest of todos
      const currentTodos = Array.from(todos);
      currentTodos.forEach((todo) => todo.classList.remove("selected"));
      todoWrapper.classList.add("selected");
    }
  };

  const removeTodo = function () {
    // when pressing delete button on details
    const selectedTodo = document.querySelector("#todos-container .selected");
    selectedTodo.remove();

    selectTodo(todoContainer.firstChild);
    renderList(currentListInView);
  };

  buttonAddTodo.addEventListener("click", () => {
    PubSub.publish("pressed-add-button");
  });

  PubSub.subscribe("inbox-initialized", renderList);
  PubSub.subscribe("sidebar-item-selected", renderList);
  PubSub.subscribe("pressed-delete-button", removeTodo);
  PubSub.subscribe("list-removed", renderList);
  // when a todo is edited, render the same list as currently selected
  PubSub.subscribe("todo-saved", (msg, previousName) => {
    renderList("", currentListInView, previousName);
  });
  PubSub.subscribe("object-added-to-inbox", (msg, todo) => {
    renderList(msg, todo.list);
  });
})();

// controls todo details window
(function mainDetailsController() {
  const todoArea = document.querySelector("#todo-area");
  let detailName;
  let detailDate;
  let detailPriority;
  let detailList;
  let detailNotes;

  const removeDetailsContainer = function () {
    const previousContainer = document.querySelector("#details-container");
    if (previousContainer) {
      previousContainer.remove();
    }
  };

  const populateDetails = function (container) {
    // const container = document.querySelector('#details-display');
    webpage.cleanDiv(container);
    detailName = document.createElement("h1");
    detailName.setAttribute("id", "detail-name");
    container.append(detailName);

    detailDate = new DetailElement("date", "p");
    detailDate.appendTo(container);

    detailPriority = new DetailElement("priority");
    detailPriority.appendTo(container);

    detailList = new DetailElement("list");

    detailList.appendTo(container);

    detailNotes = new DetailElement("notes", "textarea");
    detailNotes.appendTo(container);
    detailNotes.getElement().setAttribute("readonly", "");
    detailNotes.getElement().classList.add("inactive");
  };

  const populateEditDetails = function () {
    const container = document.querySelector("#details-display");

    // extract data from previous elements to fill in the fields
    const previousName = detailName.innerText;
    // match the correct date format using regex
    // and format function from date-fns
    let previousDate = detailDate.getValue();
    previousDate = new Date(previousDate.match(/\d+\s\w+\,\s\d+/)[0]);
    previousDate = format(previousDate, "yyy-MM-dd");

    const previousPriority = detailPriority.getValue();
    const previousList = detailList.getValue();
    const previousNotes = detailNotes.getValue();

    webpage.cleanDiv(container);

    // add new text input and populate it with previous todo name
    detailName = document.createElement("input");
    detailName.setAttribute("type", "text");
    detailName.setAttribute("id", "detail-name");

    detailName.value = previousName;
    container.append(detailName);

    detailDate = new DetailDate("date");
    detailDate.changeValue(previousDate);
    detailDate.appendTo(container);

    detailPriority = new DetailSelector("priority", previousPriority, true);
    detailPriority.appendTo(container);

    detailList = new DetailSelector("list", previousList);
    detailList.appendTo(container);

    detailNotes = new DetailElement("notes", "textarea");
    detailNotes.appendTo(container);
    detailNotes.changeValue(previousNotes);
  };

  const addDetailsContainer = function (todo) {
    // removes previous details container
    removeDetailsContainer();
    // creates the container and displays it in DOM
    const container = document.createElement("div");
    container.classList.add("container");
    container.setAttribute("id", "details-container");

    const title = document.createElement("h2");
    title.innerText = "Todo details";
    const detailsDisplay = document.createElement("div");
    detailsDisplay.setAttribute("id", "details-display");
    container.append(title, detailsDisplay);

    populateDetails(detailsDisplay);

    renderButtons(container, todo.name);

    todoArea.append(container);
  };

  const renderButtons = function (parent, todoName) {
    // add div with buttons at the bottom
    const buttonWrapper = document.createElement("div");
    buttonWrapper.setAttribute("id", "details-buttons-area");
    const buttonEdit = document.createElement("button");
    // data attribute is used by edit button to extract the previous
    // name of the todo, and thus be able to edit it.
    buttonEdit.setAttribute("data", todoName);
    buttonEdit.setAttribute("type", "button");
    buttonEdit.innerText = "Edit todo";

    const imgDelete = document.createElement("img");
    imgDelete.src = deleteIconBlackUrl;
    imgDelete.classList.add("trash-bin");
    imgDelete.setAttribute("data", todoName);
    buttonWrapper.append(buttonEdit, imgDelete);

    parent.append(buttonWrapper);

    // edit button
    buttonEdit.addEventListener("click", editTodo);
    // delete button
    imgDelete.addEventListener("click", () => {
      deleteTodo(imgDelete);
    });
  };

  // when pressing edit todo, change the functionality of button
  // to save edited todo
  const changeEditButton = function () {
    const buttonSave = document.querySelector("#details-buttons-area > button");
    buttonSave.innerText = "Save todo";

    buttonSave.removeEventListener("click", editTodo);
    buttonSave.addEventListener("click", () => {
      saveTodo(buttonSave.getAttribute("data"));
    });
  };

  // when pressing "edit todo" button, change the display and button
  const editTodo = function () {
    populateEditDetails();
    changeEditButton();
  };

  // updates selected todo
  const saveTodo = function (previousName) {
    const name = detailName.value;
    const date = detailDate.getValue();
    const priority = detailPriority.getValue();
    const list = detailList.getValue();
    const notes = detailNotes.getValue();

    // give the data the format required by inboxManager
    const todoData = { name, date, priority, list, notes };

    // add to inbox
    inboxManager.updateTodo(previousName, todoData);
    PubSub.publish("todo-saved", previousName);
  };

  const deleteTodo = function (button) {
    const todoName = button.getAttribute("data");
    inboxManager.deleteTodo(todoName);
    removeDetailsContainer();
    // remove from inbox
    PubSub.publish("pressed-delete-button");
  };

  const renderDetails = function (msg, todo) {
    const dueDate = new Date(todo.date);
    addDetailsContainer(todo);
    detailName.innerText = todo.name;
    // date Value
    detailDate.changeValue(
      `${format(dueDate, "dd MMMM, yyyy")} 
                ${formatDistance(dueDate, Date.now(), { addSuffix: true })}`
    );
    detailPriority.changeValue(todo.priority);
    detailList.changeValue(todo.list);
    detailNotes.changeValue(todo.notes);
  };

  PubSub.subscribe("todo-selected", renderDetails);
  // PubSub.subscribe('webpage-loaded', addDetailsContainer);
  PubSub.subscribe("sidebar-item-selected", removeDetailsContainer);
})();

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

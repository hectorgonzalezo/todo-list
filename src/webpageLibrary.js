// Classes used by index.js to implement DOM elements
import _ from "lodash";
import PubSub from "pubsub-js";
import { listManager } from "./todos";

// methods that control the functioning of the whole webpage
const webpage = (function () {
  const visibleArea = document.querySelector("#visible-area");

  // when loaded, update lists on sidebar
  window.addEventListener("load", () => {
    PubSub.publish("webpage-loaded");
  });

  // adds opacity when showing the popup
  const toggleVisibility = function () {
    visibleArea.classList.toggle("invisible");
  };

  const cleanDiv = function (div) {
    // remove everything inside div
    while (div.firstChild) {
      div.removeChild(div.firstChild);
    }
  };

  PubSub.subscribe("popup-toggled", toggleVisibility);

  return { cleanDiv };
})();

// populates chosen <selector> with info about lists
// used by popup and todo details
const selectorPopulator = (function () {
  const populate = function (selector, array, previousValue) {
    const existingOptions = Array.from(selector.children);
    // extract text from existingSelectors
    const optionsText = existingOptions.map((option) => option.innerText);

    // append each one to selector
    for (const element in array) {
      if (!optionsText.includes(element)) {
        // create options to add
        const newOption = document.createElement("option");
        newOption.setAttribute("data", element);
        newOption.innerText = element;
        selector.append(newOption);

        // select same value as todo
        if (element == previousValue) {
          newOption.setAttribute("selected", "");
        }
      }
    }
  };

  const populateLists = function (selector, previousValue, lists) {
    // extract lists

    // add empty value
    lists[""] = "Inbox";

    populate(selector, lists, previousValue);
  };

  const populatePriorities = function (selector, previousValue) {
    // priority lists
    const priorities = { High: "High", Normal: "Normal", Low: "low" };
    populate(selector, priorities, previousValue);
  };

  return { populateLists, populatePriorities };
})();

// class that displays DOM elements for detail display
const DetailElement = function (name, type = "p") {
  const title = document.createElement("h2");
  const info = document.createElement(type);

  // parent should be a dom element
  const appendTo = function (parent) {
    title.innerText = `${_.capitalize(name)}:`;
    info.setAttribute("id", `detail-${name}`);
    this.changeValue(name);
    parent.append(title, info);
  };

  const getElement = function () {
    return info;
  };

  const changeValue = function (value) {
    info.innerText = _.capitalize(value);
  };

  const getValue = function () {
    // for notes, return a different value
    if (type == "textarea") {
      return info.value;
    }
    return info.innerText;
  };

  return { appendTo, getElement, changeValue, getValue };
};

// inherits from DetailElement, implements functionality for <selector>
const DetailSelector = function (name, previousValue, priority) {
  const title = document.createElement("h2");
  const { appendTo, getElement } = DetailElement(name, "select");

  const changeValue = function () {
    if (priority == true) {
      selectorPopulator.populatePriorities(
        this.getElement(),
        previousValue,
        listManager.getAllLists()
      );
    } else {
      selectorPopulator.populateLists(
        this.getElement(),
        previousValue,
        listManager.getAllLists()
      );
    }
  };

  const getValue = function () {
    return getElement().value;
  };
  return { appendTo, getElement, changeValue, getValue };
};

// inherits from DetailElemet, implements functionality for <input type='date'>
const DetailDate = function (name) {
  const title = document.createElement("h2");

  const { getElement } = DetailElement(name, "input");

  const element = getElement();

  // override inherited appendTo metod, so that value can be changed on demand.
  const appendTo = function (parent) {
    title.innerText = "Date:";
    const info = getElement();
    info.setAttribute("id", `detail-date`);
    parent.append(title, info);
  };

  const changeValue = function (date) {
    element.setAttribute("type", "date");
    element.value = date;
  };

  const getValue = function () {
    return element.value;
  };

  return { appendTo, getElement, changeValue, getValue };
};

export {
  webpage,
  selectorPopulator,
  DetailElement,
  DetailDate,
  DetailSelector,
};

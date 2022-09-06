//Classes used by index.js to implement DOM elements

import { listManager } from "./todos";

//methods that control the functioning of the whole webpage
const webpage = (function () {
  const _visibleArea = document.querySelector("#visible-area");

  //when loaded, update lists on sidebar
  window.addEventListener("load", () => {
    PubSub.publish("webpage-loaded");
  });

  //adds opacity when showing the popup
  const _toggleVisibility = function () {
    _visibleArea.classList.toggle("invisible");
  };

  const cleanDiv = function (div) {
    //remove everything inside div
    while (div.firstChild) {
      div.removeChild(div.firstChild);
    }
  };

  PubSub.subscribe("popup-toggled", _toggleVisibility);

  return { cleanDiv };
})();

//populates chosen <selector> with info about lists
//used by popup and todo details
const selectorPopulator = (function () {
  const populateLists = function (selector, previousValue, lists) {
    //extract lists

    //add empty value
    lists[""] = "Inbox";

    _populate(selector, lists, previousValue);
  };

  const populatePriorities = function (selector, previousValue) {
    //priority lists
    const priorities = { High: "High", Normal: "Normal", Low: "low" };
    _populate(selector, priorities, previousValue);
  };

  const _populate = function (selector, array, previousValue) {
    const existingOptions = Array.from(selector.children);
    //extract text from existingSelectors
    const optionsText = existingOptions.map((option) => {
      return option.innerText;
    });

    //append each one to selector
    for (const element in array) {
      if (!optionsText.includes(element)) {
        //create options to add
        const newOption = document.createElement("option");
        newOption.setAttribute("data", element);
        newOption.innerText = element;
        selector.append(newOption);

        //select same value as todo
        if (element == previousValue) {
          newOption.setAttribute("selected", "");
        }
      }
    }
  };
  return { populateLists, populatePriorities };
})();

//class that displays DOM elements for detail display
const DetailElement = function (name, type = "p") {
  const title = document.createElement("h2");
  let info = document.createElement(type);

  //parent should be a dom element
  const appendTo = function (parent) {
    title.innerText = _.capitalize(name) + ":";
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
    //for notes, return a different value
    if (type == "textarea") {
      return info.value;
    } else {
      return info.innerText;
    }
  };

  return { appendTo, getElement, changeValue, getValue };
};

//inherits from DetailElement, implements functionality for <selector>
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

//inherits from DetailElemet, implements functionality for <input type='date'>
const DetailDate = function (name) {
  const title = document.createElement("h2");

  const { getElement } = DetailElement(name, "input");

  const _element = getElement();

  //override inherited appendTo metod, so that value can be changed on demand.
  const appendTo = function (parent) {
    title.innerText = "Date:";
    const info = getElement();
    info.setAttribute("id", `detail-date`);
    parent.append(title, info);
  };

  const changeValue = function (date) {
    _element.setAttribute("type", "date");
    _element.value = date;
  };

  const getValue = function () {
    return _element.value;
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

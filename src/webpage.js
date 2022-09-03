import PubSub from "pubsub-js";
import { format, compareAsc, differenceInDays} from 'date-fns';
import { listManager, inboxManager } from "./todos.js";
import deleteIconUrl from './assets/delete-icon.png';
import deleteIconBlackUrl from './assets/delete-icon-black.png';

const webpage = (
    function () {
        const _visibleArea = document.querySelector('#visible-area');

        //when loaded, update lists on sidebar
        window.addEventListener('load', () => {
            PubSub.publish('webpage-loaded');
        })

        const _toggleVisibility = function () {
            _visibleArea.classList.toggle('invisible');
        }

        const cleanDiv = function (div) {
            //remove everything inside div
            while (div.firstChild) {
               div.removeChild(div.firstChild);
            }
        }

        PubSub.subscribe('popup-toggled', _toggleVisibility);

        return {cleanDiv}
    }
)();

const headerController = (
    function () {
        const _buttonOpenMenu = document.querySelector('#button-open-menu');
        const _buttonAdd = document.querySelector('#button-add-todo');

        _buttonOpenMenu.addEventListener('click', () => {
            PubSub.publish('pressed-menu-button')
        });

        _buttonAdd.addEventListener('click', () => {
            PubSub.publish('pressed-add-button')
        });
    }
)();

const sideBarController = (
    function () {
        const _sideBar = document.querySelector('#sidebar');
        const _listsArea = document.querySelector('#lists-area');
        const _buttonAddList = document.querySelector('#lists-area button');
        const _commonItems = document.querySelectorAll('#common-items-area li');

        //hide or show sidebar
        const _toggle = function () {
            _sideBar.classList.toggle('hidden');
        };

        const _removeTrashBins = function () {
            const trashBin = document.querySelector('.trash-bin');
            if (trashBin != null) {//if there's one
                trashBin.remove();
            }
        }

        const _removeSelectedClasses = function () {
            const selectedField = document.querySelector('.selected');
            if (selectedField != null) {//if there's one
                selectedField.classList.remove('selected')
            }
        }


        const _expandList = function (name, field) {
            _removeTrashBins();
            _removeSelectedClasses();

            field.classList.add('selected')
            PubSub.publish('list-clicked', name);

            //add delete icon to list field
            const deleteIcon = document.createElement('img');
            deleteIcon.src = deleteIconUrl;
            deleteIcon.classList.add('trash-bin');//so that it can be shaken
            field.append(deleteIcon)
        }


        const _addList = function (name) {
            //create List field, add name and id
            const listField = document.createElement('div');
            listField.classList.add('list-field');
            listField.setAttribute('id', name);
            listField.classList.add('sidebar-list');
            const listTitle = document.createElement('h2');
            listTitle.innerText = _.capitalize(name);
            listField.append(listTitle);

            _listsArea.append(listField);

            //when clicking on listField
            listField.addEventListener('click', () => {
                _expandList(name, listField);
                PubSub.publish('sidebar-item-selected', name)
            })
        }


        //shows prompt to add list
        const _showListAdder = function () {
            //prevent multiple presses of button
            _buttonAddList.disabled = true;

            //creates the field where user will input the new list name
            const inputForm = document.createElement('form');
            inputForm.setAttribute('id', 'list-input');
            const listInput = document.createElement('input');
            listInput.setAttribute('type', 'text');
            listInput.setAttribute('minlength', '1');
            listInput.setAttribute('placeholder', 'List name');
            listInput.setAttribute('required', '');
            const buttonAdd = document.createElement('button');
            buttonAdd.setAttribute('type', 'submit')
            buttonAdd.innerText = 'Add';
            const buttonCancel = document.createElement('button');
            buttonCancel.setAttribute('type', 'button');
            buttonCancel.innerText = 'Cancel';

            inputForm.append(listInput, buttonAdd, buttonCancel);

            _listsArea.append(inputForm);

            //add listener for both buttons
            inputForm.addEventListener('submit', (e) => {
                e.preventDefault();

                //publish so that listManager can be updated
                PubSub.publish('pressed-add-list', listInput.value);
                _addList(listInput.value);
                _buttonAddList.disabled = false;
                inputForm.remove();
            });

            buttonCancel.addEventListener('click', () => {
                inputForm.remove();
                _buttonAddList.disabled = false;
            });
        };

        //create lists stored on listManager on site load
        const _populateInitialLists = function () {
            const existingLists = listManager.getAllLists();
            for (const property in existingLists) {
                _addList(property)
            }
        }

        //when pressing button to add lists
        _buttonAddList.addEventListener('click', _showListAdder);

        //add functionality to inbox, today and this week areas
        _commonItems.forEach((item) => {
            item.addEventListener('click', () => {
                _removeTrashBins();
                _removeSelectedClasses();
                item.classList.add('selected');
                PubSub.publish('sidebar-item-selected', item.innerText)
            })
        })

        PubSub.subscribe('pressed-menu-button', _toggle);
        PubSub.subscribe('webpage-loaded', _populateInitialLists);
    }
)();

const mainTodoListController = (
    function () {
        const _titleList = document.querySelector('#list-title');
        const _todoContainer = document.querySelector('#todos-container');
        const _todos = _todoContainer.children;


        //update left side div with items from list
        const _renderList = function (msg, listName = 'Inbox') {
            webpage.cleanDiv(_todoContainer)
            let list
            if (listName == 'Inbox') {
                list = inboxManager.getInbox()
            } else {
                list = listManager.getList(listName);
            }

            //update title
            _titleList.innerText = _.capitalize(list.getName());
            const listContent = list.getContent();

            //append all content to div
            for (const todo of listContent) {
                _renderTodo(todo)
            }
            //select first element if list isn't empty
            if (list.getContent().length > 0) {
                _todoContainer.firstElementChild.classList.add('selected');
                PubSub.publish('todo-selected', listContent[0])
            }
        }

        const _renderTodo = function (todo) {
            const wrapper = document.createElement('div');
            wrapper.classList.add('todo');

            //create elements
            const checkBox = document.createElement('div');
            checkBox.classList.add('check-box');
            const todoName = document.createElement('h3');
            todoName.innerText = todo.getName();
            const todoList = document.createElement('p');
            todoList.innerText = todo.getList();

            wrapper.append(checkBox, todoName, todoList);
            _todoContainer.append(wrapper);

            //add eventListener that selects wrapper
            wrapper.addEventListener('click', () => {
                _selectTodo(wrapper)
                PubSub.publish('todo-selected', todo);
            })
        };

        const _selectTodo = function (todoWrapper) {
            //remove selected from the rest of todos
            const currentTodos = Array.from(_todos)
            currentTodos.forEach((todo) => todo.classList.remove('selected'));
            todoWrapper.classList.add('selected');

        }

        const _removeTodo = function (){//when pressing delete button on details
            const selectedTodo = document.querySelector('#todos-container .selected')
            selectedTodo.remove();

            _selectTodo(_todoContainer.firstChild)
            _renderList();
        }

        PubSub.subscribe('webpage-loaded', _renderList);
        PubSub.subscribe('sidebar-item-selected', _renderList);
        PubSub.subscribe('object-added-to-inbox', () => {
            _renderList()
        })
        PubSub.subscribe('pressed-delete-button', _removeTodo)
    }

)();


//class that build elements for detail display
const DetailElement = function (name, type = 'p') {
    const title = document.createElement('h2');
    let info = document.createElement(type);

    //parent should be a dom element
    const appendTo = function (parent) {
        title.innerText = _.capitalize(name) + ':'
        info.setAttribute('id', `detail-${name}`);
        // this.changeValue(name);
        parent.append(title, info);
    }

    const getElement = function () {
        return info
    }

    const changeValue = function (value) {
        info.innerText = _.capitalize(value);
    }

    const getValue = function(){
        return info.innerText
    }


    return { appendTo, getElement, changeValue, getValue}
}

//inherits from DetailElement
const DetailSelector = function(name){
    const title = document.createElement('h2');
    const info = document.createElement('select');
    const {getElement, getValue} = DetailElement(name, 'select');

    const appendTo = function (parent) {
        title.innerText = _.capitalize(name) + ':'
        info.setAttribute('id', `detail-list`);
        selectorPopulator.populate(info);
        parent.append(title, info);
    }

    const changeValue = function(){
        
    }
    return {appendTo, getElement, changeValue, getValue}
}


const DetailDate = function(name){
    const title = document.createElement('h2');

    const {appendTo, getElement} = DetailElement(name, 'input');


    const changeValue = function(date){
        const _element = getElement();
        _element.setAttribute('type', 'date');
       _element.value = date;
    }


    const getValue = function(){

    }

    return {appendTo, getElement, changeValue, getValue}
}

const mainDetailsController = (
    function () {
        const _todoArea = document.querySelector('#todo-area')
        let _detailName
        let _detailDate;
        let _detailPriority;
        let _detailList;
        let _detailNotes;

        const _removeDetailsContainer = function () {
            const previousContainer = document.querySelector('#details-container')
            if (previousContainer) {
                previousContainer.remove()
            }
        }


        const _populateDetails = function (container){
            // const container = document.querySelector('#details-display');
            webpage.cleanDiv(container);
            _detailName = document.createElement('h1');
            _detailName.setAttribute('id', 'detail-name');
            container.append(_detailName)

            _detailDate = new DetailElement('date', 'p');
            _detailDate.appendTo(container);

            _detailPriority = new DetailElement('priority');
            _detailPriority.appendTo(container);

            _detailList = new DetailElement('list');
            
            _detailList.appendTo(container);

            _detailNotes = new DetailElement('notes', 'textarea');
            _detailNotes.appendTo(container);
            _detailNotes.getElement().setAttribute('readonly','')
        }

        const _populateEditDetails = function (){
            const container = document.querySelector('#details-display');
            const _previousName = _detailName.innerText;
            //match the correct date format using regex
            //and format function from date-fns
            let _previousDate = _detailDate.getValue();
            _previousDate = new Date(_previousDate.match(/\d+\s\w+\,\s\d+/)[0]);
            _previousDate = format(_previousDate, 'yyy-MM-dd')
            
            webpage.cleanDiv(container);
            //add new text input and populate it with previous todo name
            _detailName = document.createElement('input');
            _detailName.setAttribute('type', 'text')
            _detailName.setAttribute('id', 'detail-name');
            _detailName.value = _previousName
            container.append(_detailName)

            _detailDate = new DetailDate('date');
            console.log(_previousDate)
            _detailDate.changeValue(_previousDate);
            _detailDate.appendTo(container);

            // _detailPriority = new DetailElement('priority');
            // _detailPriority.appendTo(container);

            // _detailList = new DetailSelector('list');
            
            // _detailList.appendTo(container);

            // _detailNotes = new DetailElement('notes', 'textarea');
            // _detailNotes.appendTo(container);
            // _detailNotes.getElement().setAttribute('readonly','')
        }

        const _addDetailsContainer = function (todo) {
            //removes previous details container
            _removeDetailsContainer();
            //creates the container and displays it in DOM
            const container = document.createElement('div');
            container.classList.add('container');
            container.setAttribute('id', 'details-container');


            const title = document.createElement('h2');
            title.innerText = 'Todo details';
            const detailsDisplay = document.createElement('div');
            detailsDisplay.setAttribute('id', 'details-display')
            container.append(title, detailsDisplay);

            _populateDetails(detailsDisplay);

            _renderButtons(container, todo['name'])

            _todoArea.append(container)
        }


        const _renderButtons = function (parent, todoName) {
            //add div with buttons at the bottom
            const buttonWrapper = document.createElement('div');
            buttonWrapper.setAttribute('id', 'details-buttons-area')
            const buttonEdit = document.createElement('button');
            buttonEdit.setAttribute('type', 'button');
            buttonEdit.innerText = 'Edit todo'

            const imgDelete = document.createElement('img');
            imgDelete.src = deleteIconBlackUrl;
            imgDelete.classList.add('trash-bin')
            imgDelete.setAttribute('data', todoName)
            buttonWrapper.append(buttonEdit, imgDelete);

            parent.append(buttonWrapper);

            //edit button
            buttonEdit.addEventListener('click', _editTodo);
            //delete button
            imgDelete.addEventListener('click', () => {
                _deleteTodo(imgDelete);
            });
        }

        //when pressing edit todo, change the functionality of button
        //to save edited todo
        const _changeEditButton = function(){
            const buttonSave = document.querySelector('#details-buttons-area > button');
            buttonSave.innerText = 'Save todo';

            buttonSave.removeEventListener('click', _editTodo);
            buttonSave.addEventListener('click', _saveTodo)
        }

        //when pressing "edit todo" button, change the display and button
        const _editTodo = function (){
            _populateEditDetails();
            _changeEditButton();
        };

        //updates selected todo
        const _saveTodo = function () {
                console.log(_detailDate.getValue())
            //     _detailDate;
            //     _detailPriority;
            //     _detailList;
            //     _detailNotes;
            // //extract data from form and make it a FormData
            //  const formData = new FormData(_form);
            //  const todoData = Object.fromEntries(formData.entries());
 
            //  //add to inbox
            //  inboxManager.addTodo(todoData);
            //  const inbox = inboxManager.getInbox()
 
            //  _clearForm();
        }

        
        const _deleteTodo = function(button) {
            const todoName = button.getAttribute('data') 
            inboxManager.deleteTodo(todoName);
            _removeDetailsContainer();
            //remove from inbox
            PubSub.publish('pressed-delete-button')
        };

        const _renderDetails = function (msg, todo) {
            const dueDate = new Date(todo['date']);
            _addDetailsContainer(todo);
            _detailName.innerText = todo['name'];
            //date Value
            _detailDate.changeValue(
                `${format((dueDate), "dd MMMM, yyyy")}
                ${differenceInDays(dueDate, Date.now())} days left.`);
            _detailPriority.changeValue(todo['priority']);
            _detailList.changeValue(todo['list']);
            _detailNotes.changeValue(todo['notes']);
        }


        PubSub.subscribe('todo-selected', _renderDetails);
        // PubSub.subscribe('webpage-loaded', _addDetailsContainer);
        PubSub.subscribe('sidebar-item-selected', _removeDetailsContainer)
    }
)();

const popupFormController = (
    function () {
        const _form = document.querySelector('#popup > form')

        const _clearForm = function () {
            _form.reset();
        }

        const _createTodo = function () {
            //extract data from form and make it a FormData
            const formData = new FormData(_form);
            const todoData = Object.fromEntries(formData.entries());

            //add to inbox
            inboxManager.addTodo(todoData);
            const inbox = inboxManager.getInbox()

            _clearForm();
        }

        PubSub.subscribe('pressed-create-button', () => {
            _createTodo();
            _clearForm();
        })
    }
)();

//populates chosen selector with info about lists
//used by popup and todo details
const selectorPopulator = (
    function () {
        const populate = function(selector){
            //an option is the html element <option>
            //extract lists
            const lists = listManager.getAllLists();

            const existingOptions = Array.from(selector.children);
            //extract text from existingSelectors
            const optionsText = existingOptions.map((option) => {
                return option.innerText;
            })

            //append each one to selector
            for (const listName in lists) {
                if (!optionsText.includes(listName)) {
                    //create options to add
                    const newOption = document.createElement('option');
                    newOption.setAttribute('data', listName);
                    newOption.innerText = listName;
                    selector.append(newOption)
                }
            }
        }

    return {populate}
    }
)();

const popupDisplay = (
    function () {
        const _popup = document.querySelector('#popup');
        const _listsSelector = document.querySelector('#add-todo-list');
        const _buttonCreate = document.querySelector('#popup-button');
        const _buttonClose = document.querySelector('#close-pop-up');

        //hide or show popup
        const _toggle = function () {
            _popup.classList.toggle('invisible');
            PubSub.publish('popup-toggled');
        }

        const _populateListsSelector = function () {
            selectorPopulator.populate(_listsSelector);
        }


        _buttonCreate.addEventListener('click', (e) => {
            e.preventDefault();
            _toggle();
            PubSub.publish('pressed-create-button');
        });
        _buttonClose.addEventListener('click', _toggle)

        PubSub.subscribe('pressed-add-button', _toggle);
        PubSub.subscribe('pressed-add-button', _populateListsSelector)
    }
)();


import deleteIconUrl from './assets/delete-icon.png';
import './detailsDisplay.js'
import { listManager, inboxManager } from "./todos.js";
import {webpage} from './webpage.js'

console.log(webpage)


const sideBarController = (
    function () {
        const _sideBar = document.querySelector('#sidebar');
        const _listsArea = document.querySelector('#lists-area');
        const _buttonAddList = document.querySelector('#lists-area button');
        const _commonItems = document.querySelectorAll('#common-items-area li');


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

        PubSub.subscribe('webpage-loaded', _populateInitialLists);
    }
)();

const mainTodoListController = (
    function () {
        const _titleList = document.querySelector('#list-title');
        const _todoContainer = document.querySelector('#todos-container');
        const _todos = _todoContainer.children;
        const _buttonAddTodo = document.querySelector('#button-add-todo')


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
            if (todoWrapper){//prevents from trying when there are no more todos
            //remove selected from the rest of todos
            const currentTodos = Array.from(_todos)
            currentTodos.forEach((todo) => todo.classList.remove('selected'));
            todoWrapper.classList.add('selected');
            }
        }

        const _removeTodo = function (){//when pressing delete button on details
            const selectedTodo = document.querySelector('#todos-container .selected')
            selectedTodo.remove();

            _selectTodo(_todoContainer.firstChild)
            _renderList();
        }

        _buttonAddTodo.addEventListener('click', () => {
            PubSub.publish('pressed-add-button');
        })

        PubSub.subscribe('webpage-loaded', _renderList);
        PubSub.subscribe('sidebar-item-selected', _renderList);
        PubSub.subscribe('object-added-to-inbox', () => {
            _renderList()
        })
        PubSub.subscribe('pressed-delete-button', _removeTodo);
        PubSub.subscribe('object-updated', _renderList)
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
        const populateLists = function(selector){
            //an option is the html element <option>
            //extract lists
            const lists = listManager.getAllLists();

            _populate(selector, lists)
        }

        const populatePriorities = function(selector){
            //an option is the html element <option>
            //extract lists
            const priorities = {'High':'High', 
            'Normal':'Normal', 
            'Low': 'low'};
            _populate(selector, priorities)
        }

        const _populate = function(selector, array){
            const existingOptions = Array.from(selector.children);
            //extract text from existingSelectors
            const optionsText = existingOptions.map((option) => {
                return option.innerText;
            })

            //append each one to selector
            for (const element in array) {
                if (!optionsText.includes(element)) {
                    //create options to add
                    const newOption = document.createElement('option');
                    newOption.setAttribute('data', element);
                    newOption.innerText = element;
                    selector.append(newOption)
                }
            }
        }
    return {populateLists, populatePriorities}
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
            selectorPopulator.populateLists(_listsSelector);
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


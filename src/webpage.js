import PubSub from "pubsub-js";
import { todoManager, listManager, inboxManager} from "./todos.js";
import deleteIconUrl from './assets/delete-icon.png';

const webpage = (
    function () {
        const _visibleArea = document.querySelector('#visible-area');

        //when loaded, update lists on sidebar
        window.addEventListener('load', () => {
            PubSub.publish('webpage-loaded');
        })

        const _toggleVisibility = function(){
            _visibleArea.classList.toggle('invisible');
        }

        PubSub.subscribe('popup-toggled', _toggleVisibility)
    }
)();

const headerController = (
    function () {
        const _buttonOpenMenu = document.querySelector('#button-open-menu');
        const _buttonAdd = document.querySelector('#button-add-todo');

        _buttonOpenMenu.addEventListener('click', ()=> {
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

        const _removeTrashBins = function(){
            const trashBin = document.querySelector('.trash-bin');
            if (trashBin !=null){//if there's one
                trashBin.remove();
            }
        }

        const _removeSelectedClasses = function(){
            const selectedField = document.querySelector('.selected');
            if (selectedField !=null){//if there's one
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


        const _addList = function(name) {
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
             listField.addEventListener('click', ()=> {
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
            for (const property in existingLists){
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
        PubSub.subscribe('webpage-loaded',  _populateInitialLists);
    }
)();

const mainTodoListController = (
    function() {
        const _titleList = document.querySelector('#list-title');
        const _todoContainer = document.querySelector('#todos-container');
        const _todos = _todoContainer.children;
        
        const _cleanTodoContainer = function(){
            //remove everything inside containter
            while(_todoContainer.firstChild){
                _todoContainer.removeChild(_todoContainer.firstChild);
            }
        }

        //update left side div with items from list
        const _renderList = function(msg, listName='Inbox') {
            _cleanTodoContainer();
            let list 
            if (listName == 'Inbox'){
                list = inboxManager.getList()
            } else {
                list = listManager.getList(listName);
            }
            
            //update title
            _titleList.innerText = _.capitalize(list.getName());
            const listContent = list.getContent();

            //append all content to div
            for (const todo of listContent){
                _renderTodo(todo)
            }
            //select first element if list isn't empty
            if (list.getContent().length > 0) {
                _todoContainer.firstElementChild.classList.add('selected');
                PubSub.publish('todo-selected', listContent[0])
            }
        }

        const _renderTodo = function(todo){
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
            wrapper.addEventListener('click', () =>{
                _selectTodo(wrapper)
                PubSub.publish('todo-selected', todo);
            })
        };

        const _selectTodo = function(todoWrapper){
            //remove selected from the rest of todos
            const currentTodos = Array.from(_todos)
            currentTodos.forEach((todo) => todo.classList.remove('selected'));
            todoWrapper.classList.add('selected');
            
        }
        PubSub.subscribe('webpage-loaded', _renderList);
        PubSub.subscribe('sidebar-item-selected', _renderList)
    }

)();

const mainDetailsController = (
    function(){
        const _todoArea = document.querySelector('#todo-area')
        let _detailName;
        let _detailDate;
        let _detailPriority;
        let _detailList;
        let _detailNotes;

        const _removeDetailsContainer = function() {
            const previousDetailsContainer = document.querySelector('#details-container')
            if(previousDetailsContainer){
                previousDetailsContainer.remove()
            }
        }

        const _addDetailsContainer = function(){
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

            _detailName = document.createElement('h3');
            _detailName.setAttribute('id', 'detail-name');
            _detailName.innerText = 'Name';
            
            _detailDate = document.createElement('p');
            _detailDate.setAttribute('id', 'detail-date');
            _detailDate.innerText = 'Date';
            
            _detailPriority = document.createElement('p');
            _detailPriority.setAttribute('id', 'detail-priority');
            _detailPriority.innerText = 'Priority';
            
            _detailList = document.createElement('p');
            _detailList.setAttribute('id', 'detail-date');
            _detailList.innerText = 'List';
            
            _detailNotes = document.createElement('textarea');
            _detailNotes.setAttribute('readonly','')
            _detailNotes.setAttribute('id', 'detail-notes');
            _detailNotes.innerText = 'Notes';

            detailsDisplay.append(
                _detailName, 
                _detailDate, 
                _detailPriority, 
                _detailList, 
                _detailNotes)

            _todoArea.append(container)
        }

        const _renderDetails = function(msg, todo){
            _addDetailsContainer();
            _detailName.innerText = todo['name'];
            _detailPriority.innerText = todo['priority'];
            _detailList.innerText = todo['list'];
            _detailNotes.innerText = todo['notes'];
        }

        PubSub.subscribe('todo-selected', _renderDetails);
        PubSub.subscribe('webpage-loaded', _addDetailsContainer)
        PubSub.subscribe('sidebar-item-selected', _removeDetailsContainer)
    }
)();

const popupController = (
    function() {
        const _popup = document.querySelector('#popup');
        const _listsSelector = document.querySelector('#add-todo-list');
        const _buttonCreate = document.querySelector('#popup-button');
        const _buttonClose = document.querySelector('#close-pop-up');
        
        //hide or show popup
        const _toggle= function (){
            _popup.classList.toggle('invisible');
            PubSub.publish('popup-toggled');
        }

        const _populateListsSelector = function () {
            //an option is the html element <option>
            //extract lists
            const lists = listManager.getAllLists();

            const existingOptions = Array.from(_listsSelector.children);
            //extract text from exisingSelectors
            const optionsText = existingOptions.map((selector) => {
                return selector.innerText;
            })

            //append each one to selector
            for (const listName in lists){
                if (!optionsText.includes(listName)){
                    //create options to add
                    const newOption = document.createElement('option');
                    newOption.setAttribute('data', listName);
                    newOption.innerText = listName;
                    _listsSelector.append(newOption)
                    }
            }

        }

        //this function is ran when pressing the "create" button
        const _createTodo = function () {
            button.preventDefault();
            _toggle();
        }

        _buttonCreate.addEventListener('click', _createTodo);
        _buttonClose.addEventListener('click', _toggle)

        PubSub.subscribe('pressed-add-button', _toggle);
        PubSub.subscribe('pressed-add-button', _populateListsSelector)
    }
)();


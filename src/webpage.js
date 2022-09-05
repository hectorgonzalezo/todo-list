import PubSub from "pubsub-js";
import deleteIconUrl from './assets/delete-icon.png';
import { listManager, inboxManager } from "./todos.js";
import {isToday, isThisWeek, isPast, format, formatDistanceToNow, formatDistance} from 'date-fns';
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
            //if field exists
            // else go to inbox
            _removeTrashBins();
            _removeSelectedClasses();

            field.classList.add('selected')
            // PubSub.publish('list-clicked', name);

            //add delete icon to list field
            const deleteIcon = document.createElement('img');
            deleteIcon.src = deleteIconUrl;
            deleteIcon.classList.add('trash-bin');//so that it can be shaken
            field.append(deleteIcon);

            //delete list when pressing delete icon
            deleteIcon.addEventListener('click', _deleteSelectedList);
        }

        const _deleteSelectedList = function (e) {
            e.stopPropagation();
            const selectedList = document.querySelector('div.selected');
            selectedList.remove();
            PubSub.publish('pressed-delete-list', selectedList.id);
            const inboxField = document.querySelector('#inbox-field');
            inboxField.classList.add('selected');
        }

        const _addList = function (name) {
            //create List field, add name and id
            const listField = document.createElement('div');
            listField.classList.add('list-field');
            listField.setAttribute('id', name);
            listField.classList.add('sidebar-list');
            const listTitle = document.createElement('h2');
            listTitle.innerText = _.capitalize(name);
            listTitle.classList.add('list-title')
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

        PubSub.subscribe('inbox-initialized',_populateInitialLists);
        // PubSub.subscribe('inbox-updated', _updateLists)
    }
)();

const mainTodoListController = (
    function () {
        const _titleList = document.querySelector('#list-title');
        const _todoContainer = document.querySelector('#todos-container');
        const _todos = _todoContainer.children;
        const _buttonAddTodo = document.querySelector('#button-add-todo');
        let _currentListInView;
        let _nameOfSelected;


        //this function looks through the DOM list, and if it finds a
        //todo with a data attribute as the edited one, it keeps the selection
        //this allows to keep selections, even when changing the date
        const _keepSelection = function (previousName) {
            //otherwise, select item indicated by selected argument
            const containerItems = _todoContainer.children;
            const itemsArray = Array.from(containerItems);
            let selectedIndex;
            itemsArray.forEach((item, i) => {
                if(item.getAttribute('data') == previousName){
                    selectedIndex = i;
                }
            })
            containerItems.item(selectedIndex).classList.add('selected');
            }

        //update left side div with items from list
        const _renderList = function (msg, listName = 'Inbox', previousName) {
            webpage.cleanDiv(_todoContainer);
            let list
            if (listName == 'Inbox' || listName == undefined) {
                list = inboxManager.getInbox()
            } else if(listName=='Today'){
                list = inboxManager.getFilteredInbox(isToday, 'Today');
            } else if (listName == 'This week'){ 
                list = inboxManager.getFilteredInbox(isThisWeek, 'This Week');
            } else {
                list = listManager.getList(listName);
            }

            _currentListInView = list.getName();

            //update title
            _titleList.innerText = _.capitalize(_currentListInView);
            const listContent = list.getContent();

            //append all of the content to _todoContainer
            //name is sent to be added as a data attribute
            for (const todo of listContent){
                _renderTodo(todo, todo['name'])
            }
            //select first element if list isn't empty
            if (list.getContent().length > 0) {
                if (previousName == undefined){
                    //if none is selected, choose the first
                    _todoContainer.firstChild.classList.add('selected');
                    PubSub.publish('todo-selected', listContent[0])
                    _nameOfSelected = _currentListInView;
                } else {
                    //if there's one already selected
                    _keepSelection(previousName)
            }
        }
    }

        
        const _renderTodo = function (todo, dataAttribute) {
            const wrapper = document.createElement('div');
            wrapper.classList.add('todo');
            //this will be used to extract _currentIndexOfSelected
            //which in turn is used by _renderList to determine if there's
            //an item selected at the moment
            wrapper.setAttribute('data', dataAttribute)

            //create elements
            const checkBox = document.createElement('div');
            checkBox.classList.add('check-box');
            const todoName = document.createElement('h3');
            todoName.innerText = todo.getName();
            const todoList = document.createElement('p');
            todoList.innerText = todo.getList();

            wrapper.append(checkBox, todoName, todoList);
            _todoContainer.append(wrapper);
            
            //if its done, add the corresponding class to wrapper
            if(todo.done == true){
                wrapper.classList.add('done')
            } else if(isPast(todo.date)){//if it isn't done but dueDate is past
                wrapper.classList.add('past');
            }

            //add eventListener that selects wrapper
            wrapper.addEventListener('click', () => {
                _selectTodo(wrapper)
                PubSub.publish('todo-selected', todo);
                _nameOfSelected = wrapper.getAttribute('data')
            })


            //pressing on the checkbox updates the todo to be done
            //this should cross out the text and put the selected todo
            //at the bottom
            checkBox.addEventListener('click', () =>{
                todo.done = !todo.done;
                wrapper.classList.toggle('done');
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
            _renderList(_currentListInView);
        }

        _buttonAddTodo.addEventListener('click', () => {
            PubSub.publish('pressed-add-button');
        })

        PubSub.subscribe('inbox-initialized', _renderList);
        PubSub.subscribe('sidebar-item-selected', _renderList);
        PubSub.subscribe('pressed-delete-button', _removeTodo);
        PubSub.subscribe('list-removed', _renderList);
        //when a todo is edited, render the same list as currently selected
        PubSub.subscribe('todo-saved', (msg, previousName) => {
            _renderList('', _currentListInView, previousName)
        })
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
            todoData['date'] = new Date(todoData['date']);

            //add to inbox
            inboxManager.addTodo(todoData);

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
        const populateLists = function(selector, previousValue){
            //extract lists
            let lists = listManager.getAllLists();

            //add empty value
            lists[''] = inboxManager.getInbox();
            
            _populate(selector, lists, previousValue);
        }

        const populatePriorities = function(selector, previousValue){
            //priority lists
            const priorities = {'High':'High', 
            'Normal':'Normal', 
            'Low': 'low'};
            _populate(selector, priorities, previousValue)
        }

        const _populate = function(selector, array, previousValue){
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
                    
                    //select same value as todo
                    if (element == previousValue){
                        newOption.setAttribute('selected','')
                    }
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
        const _dateInput = document.querySelector('input#date');
        const _dateWarning = document.querySelector('#date-warning');
        const _form = document.querySelector('#popup > form');

        //hide or show popup
        const _toggle = function () {
            _popup.classList.toggle('invisible');
            PubSub.publish('popup-toggled');
        }

        const _populateListsSelector = function () {
            selectorPopulator.populateLists(_listsSelector);
        }

        //if the user chooses a date that passed, highlight the input
        _dateInput.addEventListener('change', () =>{
            const chosenDate = new Date(_dateInput.value); 
            if (isPast(chosenDate)){
                _dateInput.classList.add('invalid')
            } else {
                _dateWarning.classList.remove('visible');
                _dateInput.classList.remove('invalid')
            }
        })

        _buttonCreate.addEventListener('click', (e) => {
            const chosenDate = new Date(_dateInput.value);
            //if the user chooses a date that passed,  show warning
            
            if (isPast(chosenDate)){
                _dateWarning.classList.add('visible');
            } else if (_form.checkValidity()){

                e.preventDefault();  
                _dateWarning.classList.remove('visible');
                _toggle();
                PubSub.publish('pressed-create-button');
            }
        });
        _buttonClose.addEventListener('click', _toggle)

        PubSub.subscribe('pressed-add-button', _toggle);
        PubSub.subscribe('pressed-add-button', _populateListsSelector)
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
        this.changeValue(name);
        parent.append(title, info);
    }

    const getElement = function () {
        return info
    }

    const changeValue = function (value) {
        info.innerText = _.capitalize(value);
    }

    const getValue = function(){
        //for notes, return a different value
        if(type=='textarea'){
            return info.value
        } else {
        return info.innerText
        }
    }


    return { appendTo, getElement, changeValue, getValue}
}

//inherits from DetailElement
const DetailSelector = function(name, previousValue, priority){
    const title = document.createElement('h2');
    const {appendTo, getElement} = DetailElement(name, 'select');

    const changeValue = function(){
        if (priority == true){
            selectorPopulator.populatePriorities(this.getElement(), previousValue)
        } else {
        selectorPopulator.populateLists(this.getElement(), previousValue)
        }
    }

    const getValue = function(){
        return getElement().value
    }
    return {appendTo, getElement, changeValue, getValue}
}


const DetailDate = function(name){
    const title = document.createElement('h2');

    const {getElement} = DetailElement(name, 'input');

    const _element = getElement();

    //override inherited appendTo metod, so that value can be changed on demand.
    const appendTo = function (parent) {
        title.innerText = 'Date:'
        const info = getElement();
        info.setAttribute('id', `detail-date`);
        parent.append(title, info);
    }

    const changeValue = function(date){
        _element.setAttribute('type', 'date');
        _element.value = date;
    }


    const getValue = function(){
        return _element.value;
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

            //extract data from previous elements to fill in the fields
            const _previousName = _detailName.innerText;
            //match the correct date format using regex
            //and format function from date-fns
            let _previousDate = _detailDate.getValue();
            _previousDate = new Date(_previousDate.match(/\d+\s\w+\,\s\d+/)[0]);
            _previousDate = format(_previousDate, 'yyy-MM-dd');
            
            const _previousPriority = _detailPriority.getValue();
            const _previousList = _detailList.getValue();
            const _previousNotes = _detailNotes.getValue();
            
            webpage.cleanDiv(container);

            //add new text input and populate it with previous todo name
            _detailName = document.createElement('input');
            _detailName.setAttribute('type', 'text')
            _detailName.setAttribute('id', 'detail-name');
           
            _detailName.value = _previousName
            container.append(_detailName)

            _detailDate = new DetailDate('date');
            _detailDate.changeValue(_previousDate);
            _detailDate.appendTo(container);

            _detailPriority = new DetailSelector('priority', _previousPriority, true);
            _detailPriority.appendTo(container);

            _detailList = new DetailSelector('list', _previousList);
            _detailList.appendTo(container)
            

            _detailNotes = new DetailElement('notes', 'textarea');
            _detailNotes.appendTo(container);
            _detailNotes.changeValue(_previousNotes)
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
             //data attribute is used by edit button to extract the previous
            //name of the todo, and thus be able to edit it.
            buttonEdit.setAttribute('data', todoName);
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
            buttonSave.addEventListener('click', ()=>
            {
                _saveTodo(buttonSave.getAttribute('data'))
            })
        }

        //when pressing "edit todo" button, change the display and button
        const _editTodo = function (){
            _populateEditDetails();
            _changeEditButton();
        };

        //updates selected todo
        const _saveTodo = function (previousName) {
            const name = _detailName.value;
            const date = _detailDate.getValue();
            const priority = _detailPriority.getValue();
            const list = _detailList.getValue();
            const notes = _detailNotes.getValue();
            
            //give the data the format required by inboxManager
            const todoData = {name, date, priority, list, notes};
 
            //add to inbox
             inboxManager.updateTodo(previousName, todoData);
             PubSub.publish('todo-saved', previousName);
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
                ${formatDistance(dueDate, Date.now(), {addSuffix:true})}`);
            _detailPriority.changeValue(todo['priority']);
            _detailList.changeValue(todo['list']);
            _detailNotes.changeValue(todo['notes']);
        }


        PubSub.subscribe('todo-selected', _renderDetails);
        // PubSub.subscribe('webpage-loaded', _addDetailsContainer);
        PubSub.subscribe('sidebar-item-selected', _removeDetailsContainer)
    }
)();
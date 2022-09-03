import { format, compareAsc, differenceInDays, previousSaturday} from 'date-fns';
import deleteIconBlackUrl from './assets/delete-icon-black.png';
import './webpage.js'
import { listManager, inboxManager } from "./todos.js";

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
const DetailSelector = function(name, priority){
    const title = document.createElement('h2');
    const {appendTo, getElement} = DetailElement(name, 'select');

    const changeValue = function(){
        if (priority == true){
            selectorPopulator.populatePriorities(this.getElement())
        } else {
        selectorPopulator.populateLists(this.getElement())
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
        title.innerText = 'Date :'
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

            _detailPriority = new DetailSelector('priority', true);
            _detailPriority.appendTo(container);

            _detailList = new DetailSelector('list');
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
            const date = _detailDate.getValue()
            const priority = _detailPriority.getValue();
            const list = _detailList.getValue();
            const notes = _detailNotes.getValue();
            
            //give the data the format required by inboxManager
            const todoData = {name, date, priority, list, notes};
 
            //  //add to inbox
             inboxManager.updateTodo(todoData, previousName);
            //  const inbox = inboxManager.getInbox()

            // PubSub.publish('todo-edited', previousName)
            PubSub.publish('object-added-to-inbox', '')
 
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
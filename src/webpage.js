import PubSub from "pubsub-js";
import { todoManager, listManager } from "./todos.js";

const webpage = (
    function () {
        

        
    }
)();

const header = (
    function () {
        const _header = document.querySelector('header');
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

const sidebar = (
    function () {
        const _sideBar = document.querySelector('#sidebar');
        const _listsArea = document.querySelector('#lists-area');
        const _buttonAddList = document.querySelector('#lists-area button')
        
        //hide or show sidebar
        const _toggle = function () {
            _sideBar.classList.toggle('hidden');
        };


        const _addList = function(name) {
             //create List field, add name and id
             const listField = document.createElement('div');
             listField.classList.add('list-field');
             listField.setAttribute('id', name)
             const listTitle = document.createElement('h2');
             listTitle.innerText = name;
             listField.append(listTitle)

             _listsArea.append(listField)

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
        }

        //when pressing button to add lists
        _buttonAddList.addEventListener('click', _showListAdder)

        PubSub.subscribe('pressed-menu-button', _toggle);
    }
)();

const popup = (
    function() {
        const _popup = document.querySelector('#popup');
        const _listsSelector = document.querySelector('#add-todo-list');
        const _buttonCreate = document.querySelector('#popup-button');
        
        //hide or show popup
        const _toggle= function (){
            _popup.classList.toggle('invisible')
        }

        const _populateListsSelector = function () {
            listManager.getLists();
        }

        //this function is ran when pressing the "create" button
        const _createTodo = function (button) {
            button.preventDefault();
            _toggle();
        }

        _buttonCreate.addEventListener('click', _createTodo)

        PubSub.subscribe('pressed-add-button', _toggle);
        PubSub.subscribe('pressed-add-button', _populateListsSelector)
    }
)();
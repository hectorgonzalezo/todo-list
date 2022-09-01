import PubSub from "pubsub-js";

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
            console.log('pressed')
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
        const _listsArea = document.querySelector('#lists-area')
        
        //hide or show sidebar
        const _toggle = function () {
            _sideBar.classList.toggle('hidden');
        };

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

        }

        //this function is ran when pressing the "create" button
        const _createTodo = function (button) {
            button.preventDefault();
            _toggle();
        }

        _buttonCreate.addEventListener('click', _createTodo)

        PubSub.subscribe('pressed-add-button', _toggle)
    }
)();
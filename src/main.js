import './style.css';
import './webpage.js'


//todo factory function
const Todo = function(title, description, dueDate, priority, notes, list) {

    return {title, description, dueDate, priority, notes, list}
}

const List = function(name){
    let content = {};
    //start with empty content if not provided

    const length = function (){
        return Object.keys(content).length;
    };

    return {name, content, lenght}
}

const todoManager = (
    function () {
        let todos = {};

        function addTodo(data){

        }

        PubSub.subscribe('pressed-add-button', addTodo)
    }
)();

const listManager = (
    function () {
        let lists = {};

        function addList(data){

        }

        const getLists = function(){
            return lists
        }

        PubSub.subscribe('pressed-add-list', addList)
    }
)();



const newTodo = Todo('juan', 'as;dflajsd;fl', 12, 'top', 'nada', 'default');

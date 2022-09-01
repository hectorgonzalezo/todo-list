

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

    return {name, content, length}
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

        function addList(msg, listName){
            lists[listName] = List(listName);
            console.log(lists)
        }

        const getLists = function(){
            return [1, 2, 3]
        }

        PubSub.subscribe('pressed-add-list', addList);
    
        return {getLists}
    }
)();

console.log(listManager.getLists())
const newTodo = Todo('juan', 'as;dflajsd;fl', 12, 'top', 'nada', 'default');

export {todoManager, listManager}
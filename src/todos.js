

//todo class
class Todo {
    constructor(name, notes, dueDate, priority, list){
        this.name = name;
        this.notes = notes;
        this.dueDate = dueDate;
        this.priority = priority;
        this.list = list;
    }
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
        let lists = {'web':'web', 'asdf':'asdfa'};

        function addList(msg, listName){
            lists[listName] = List(listName);
            console.log(lists)
        }

        const getLists = function(){
            return lists
        }

        const _publishLists = function(){

        }

        PubSub.subscribe('pressed-add-list', addList);
        PubSub.subscribe('list')
    
        return {getLists}
    }
)();

const newTodo = new Todo('juan', 'as;dflajsd;fl', 12, 'top', 'nada', 'default');

export {todoManager, listManager}
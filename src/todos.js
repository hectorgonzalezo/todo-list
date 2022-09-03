import _ from 'lodash';
//todo class
class Todo {
    constructor(name, notes, date, priority, list =''){
        this.name = name;
        this.notes = notes;
        this.date = date;
        this.date = date;

        this.priority = priority;
        this.list = list;
    }
    
    getName(){
        return this.name
    };

    getList(){
        return this.list
    }
    
}

const List = function(name){
    //start with empty content if not provided
    let _content = [];

    const length = function (){
        return Object.keys(content).length; 
    };

    const getName = function(){
        return name
    }

    const getContent = function(){
        return _content
    }

    const add = function(todo){
        _content.push(todo);
    }

    const remove = function(name){
        _content = _content.filter((todo) =>{
            return todo['name'] != name
        } )
    }

    return {getName, getContent, length, add, remove}
}

//Inbox inherits from List
//empty name
const Inbox = function (){
    const {length, getName, getContent, add, remove, update} = List('Inbox');

    return {length, getName, getContent, add, remove, update}
}

const todoManager = (
    function () {
        let todos = {};

        function addTodo(msg, data){

            return newTodo(data);
        }
    }
)();


const listManager = (
    function () {
       
        let lists = {}


        const addList = function (msg, listName){
            lists[listName] = List(listName);
        }

        const getAllLists = function(){
            return lists
        }

        const getList = function(name){
            return lists[name]
        }

        const _publishLists = function(){
        }

        const _addToList = function(msg, todo){
            const todoListName = todo['list'];

            //if todo list exists, add it there
            if (lists.hasOwnProperty(todoListName)){
                lists[todoListName].add(todo)
            }

            console.log(getAllLists()['web'].getContent());
        }

        const _removeFromList = function (msg, todoName) {
            for (const listName in lists) {
                const list = lists[listName];
                list.remove(todoName)
            }
        }

        addList('', 'web');

        const _dummyObj = new Todo(
            'Terminar esta madre!',
            'Va a tardar mas',
            12,
            'high',
            'web'
        );

        const _anotherDummyObj = new Todo(
            'Algun otro',
            'La siguiente semana',
            10,
            'low',
            'web'
        );

        const web = new List('web');

        lists['web'].add(_dummyObj);
        lists['web'].add(_anotherDummyObj);

        PubSub.subscribe('pressed-add-list', addList);
        PubSub.subscribe('object-added-to-inbox', _addToList);
        PubSub.subscribe('object-removed-from-inbox', _removeFromList);
        // PubSub.subscribe('todo-edited', _removeFromList)
    
        return {addList, getAllLists, getList}
    }
)();

const inboxManager = (
    function() {
        const _dummyObj = new Todo(
            'Finish Project',
            'This should take no more than 5 days.',
            '2012/12/21',
            'high',
            'asfas'
        );

        const _anotherDummyObj = new Todo(
            'Otro Proyecto',
            'Va a tardar mas',
            10,
            'low'
        )

        const _inbox = new Inbox();

        _inbox.add(_dummyObj)
        _inbox.add(_anotherDummyObj)

        const getInbox = function(){
            return _inbox
        }

        const addTodo = function(data) {
            const newTodo = Object.assign(new Todo, data);
            _inbox.add(newTodo);
            PubSub.publish('object-added-to-inbox', newTodo);
        }

        const deleteTodo = function(todoName){
            _inbox.remove(todoName)
            PubSub.publish('object-removed-from-inbox', todoName)
        }

        const updateTodo = function(data, previousName){
            deleteTodo(previousName)
            addTodo(data);

            PubSub.publish('todo-selected', data);
        }

    return {getInbox, addTodo, deleteTodo, updateTodo}
    }
)();

const newTodo = new Todo('juan', 'as;dflajsd;fl', 12, 'top', 'nada', 'default');

export {todoManager, listManager, inboxManager}
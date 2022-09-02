
import _ from 'lodash'
//todo class
class Todo {
    constructor(name, notes, dueDate, priority, list =''){
        this.name = name;
        this.notes = notes;
        this.dueDate = dueDate;
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

    return {getName, getContent, length, add}
}

//Inbox inherits from List
//empty name
const Inbox = function (){
    const {length, getName, getContent, add} = List('Inbox');

    return {length, getName, getContent, add}
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
        PubSub.subscribe('list')
    
        return {getAllLists, getList}
    }
)();

const inboxManager = (
    function() {
        const _dummyObj = new Todo(
            'Finish Project',
            'This should take no more than 5 days.',
            12,
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

        const getList = function(){
            return _inbox
        }

    return {getList}
    }
)();

const newTodo = new Todo('juan', 'as;dflajsd;fl', 12, 'top', 'nada', 'default');

export {todoManager, listManager, inboxManager}
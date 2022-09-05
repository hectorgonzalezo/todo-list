import _ from 'lodash';
import {compareAsc} from 'date-fns'
//todo class
class Todo {
    constructor(name, notes, date, priority, list ='', done=false){
        this.name = name;
        this.notes = notes;
        this.date = date;
        this.priority = priority;
        this.list = list;
        this.done = done;
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

    const _filterContent = function(){
        _content = _content.sort((a, b) => {
            return compareAsc(a['date'], b['date'])
        });
        return _content
    }

    const length = function (){
        return Object.keys(_content).length; 
    };

    const getName = function(){
        return name
    }

    const getContent = function(){
        
        return _filterContent();
    }

    const add = function(todo){
        _content.push(todo);
    }

    const from = function(array){
        _content = array;
    }

    const remove = function(name){
        _content = _content.filter((todo) =>{
            return todo['name'] != name
        } )
    }

    const update = function(name, data){
        //find todo index and update information
        const indexOfTodoToUpdate = _content.findIndex((todo) => todo['name'] == name)
        //if it found one, update it
        if (indexOfTodoToUpdate >= 0){
        _content[indexOfTodoToUpdate] = data;
        }
    }

    return {getName, getContent, length, add, from, remove, update}
}

//Inbox inherits from List
//empty name
const Inbox = function (){
    const {length, getName, getContent, add, remove, update} = List('Inbox');

    return {length, getName, getContent, add, remove, update}
}


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
            if (lists.hasOwnProperty(name)){
            return lists[name]
            } else {
                return inboxManager.getInbox()
            }
        }

        const _deleteList = function(msg, name){
            delete lists[name]
        }

        const _addToList = function(msg, todo){
            const todoListName = todo['list'];

            //if todo list exists, add it there
            if (lists.hasOwnProperty(todoListName)){
                lists[todoListName].add(todo)
            }

        }

        const _removeFromList = function (msg, todoName) {
            for (const listName in lists) {
                const list = lists[listName];
                list.remove(todoName)
            }
        }

        const _updateList = function (msg, updatedTodo){
            for (const listName in lists) {
                const list = lists[listName];
                list.update(updatedTodo)
            } 
        }

        addList('', 'web');

        const _dummyObj = new Todo(
            'Terminar esta madre!',
            'Va a tardar mas',
            new Date('2022/09/17'),
            'high',
            'web'
        );

        const _anotherDummyObj = new Todo(
            'Algun otro',
            'La siguiente semana',
            new Date('2022/09/16'),
            'low',
            'web'
        );

        const web = new List('web');

        lists['web'].add(_dummyObj);
        lists['web'].add(_anotherDummyObj);

        PubSub.subscribe('pressed-add-list', addList);
        PubSub.subscribe('object-added-to-inbox', _addToList);
        PubSub.subscribe('object-removed-from-inbox', _removeFromList);
        PubSub.subscribe('pressed-delete-list', _deleteList)
        PubSub.subscribe('todo-updated', _updateList);
    
        return {addList, getAllLists, getList}
    }
)();

const inboxManager = (
    function() {
        const _dummyObj = new Todo(
            'Finish Project',
            'This should take no more than 5 days.',
            new Date('2022/09/03'),
            'high',
            'asfas',
            true
        );

        const _anotherDummyObj = new Todo(
            'Otro Proyecto',
            'Va a tardar mas',
            new Date('2022/09/04'),
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

        const updateTodo = function(previousName, data){
            const updatedTodo = Object.assign(new Todo, data); 
            _inbox.update(previousName, updatedTodo);
            PubSub.publish('todo-selected', data);
            PubSub.publish('todo-updated', updatedTodo)
        }

        const getFilteredInbox = function(comparerFunction){
            let inboxArray = _inbox.getContent();
            //filter array and only get today's results
            inboxArray = inboxArray.filter((todo) => {
                return comparerFunction(todo['date']);
            })

            //make new list and add array to it
            const filteredList = new List('Today');
            filteredList.from(inboxArray);

            return filteredList
        }

    return {getInbox, addTodo, deleteTodo, updateTodo, getFilteredInbox}
    }
)();

const newTodo = new Todo('juan', 'as;dflajsd;fl', 12, 'top', 'nada', 'default');

export {listManager, inboxManager}
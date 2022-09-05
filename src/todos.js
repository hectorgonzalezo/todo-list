import _ from 'lodash';
import {compareAsc, isToday} from 'date-fns';
import storage from './storage.js'
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

    const update = function(name, updatedTodo){
        //find todo index and update information
        const indexOfTodoToUpdate = _content.findIndex((todo) => todo['name'] == name)
        //if it found one, update it
        if (indexOfTodoToUpdate >= 0){
            //keep 'done' value
            updatedTodo['done'] = _content[indexOfTodoToUpdate]['done'];
            _content[indexOfTodoToUpdate] = updatedTodo;
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
       
        let _lists = {}


        const addList = function (msg, listName){
            _lists[listName] = List(listName);
        }

        const getAllLists = function(){
            return _lists
        }

        const getList = function(name){
            if (_lists.hasOwnProperty(name)){
            return _lists[name]
            } else {
                return inboxManager.getInbox()
            }
        }

        const _deleteList = function(msg, name){
            delete _lists[name]
        }

        const _addToList = function(msg, todo){
            const todoListName = todo['list'];

            //if todo list exists, add it there
            if (_lists.hasOwnProperty(todoListName)){
                _lists[todoListName].add(todo)
            }
        }

        const _removeFromList = function (msg, todoName) {
            for (const listName in _lists) {
                const list = _lists[listName];
                list.remove(todoName)
            }
        }

        const _updateList = function (msg, updatedTodo){
            for (const listName in _lists) {
                const list = _lists[listName];
                list.update(updatedTodo)
            } 
        }
        
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
        const _inbox = new Inbox();


        const getInbox = function(){
            return _inbox
        }

        const addTodo = function(data) {
            const newTodo = Object.assign(new Todo, _format(data));
            _inbox.add(newTodo);
            PubSub.publish('object-added-to-inbox', newTodo);

            //add to local storage
            storage.add(newTodo);
        }

        const deleteTodo = function(todoName){
            _inbox.remove(todoName)
            PubSub.publish('object-removed-from-inbox', todoName)

            //delete form local storage
            storage.delete(todoName)
        }

        const updateTodo = function(previousName, data){
            const updatedTodo = Object.assign(new Todo, data); 
            _inbox.update(previousName, updatedTodo);
            PubSub.publish('todo-selected', data);
            PubSub.publish('todo-updated', updatedTodo)

            //update local storage
            storage.update(previousName, updateTodo)
        }

        const getFilteredInbox = function(comparerFunction, title){
            let inboxArray = _inbox.getContent();
            //filter array and only get today's results
            inboxArray = inboxArray.filter((todo) => {
                return comparerFunction(todo['date']);
            })

            //make new list and add array to it
            const filteredList = new List(title);
            filteredList.from(inboxArray);

            return filteredList
        }

        const _updateFromStorage = function(msg, todosArray){
            todosArray.forEach((todo) => {

                addTodo(todo)
            });
            PubSub.publish('inbox-updated', _inbox.getContent())
        }
        
        //gives the correct format to date before passing it to add
        const _format = function(todoData){
            const newDate = new Date(todoData['date'])
            todoData['date'] = newDate
            return todoData
        }
            
        PubSub.subscribe('todos-fetched-from-storage', _updateFromStorage)

    return {getInbox, addTodo, deleteTodo, updateTodo, getFilteredInbox}
    }
)();


export {listManager, inboxManager}
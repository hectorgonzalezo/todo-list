//this function checks if there's storage available to implement persistence of todos.
const storage = (function () {

    const _storageAvailable = function (type) {
        let storage;
        try {
            storage = window[type];
            const x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        }
        catch (e) {
            return e instanceof DOMException && (
                // everything except Firefox
                e.code === 22 ||
                // Firefox
                e.code === 1014 ||
                // test name field too, because code might not be present
                // everything except Firefox
                e.name === 'QuotaExceededError' ||
                // Firefox
                e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
                // acknowledge QuotaExceededError only if there's something already stored
                (storage && storage.length !== 0);
        }
    }

    const _startStorage = function () {
        //if there's local storage available, store any todos made by user
        if (_storageAvailable('localStorage')) {
            //if there's previous data on storage, display it
            if (!localStorage.getItem('inbox')) {
                displayDummyTodos();
            } else {
                console.log(getAll())

            }

        }
    }


    const displayDummyTodos = function () {

    }

    const add = function (todo){
        //convert object to string and save it in local storage
        localStorage.setItem(todo['name'], JSON.stringify(todo))
    }

    const remove = function (todoName){
        localStorage.removeItem(todoName)
    }

    const update = function (previousName, updatedTodo){
        remove(previousName)
        add(updatedTodo)
    }

    const getAll = function(){
        return {...localStorage}
    }

    PubSub.subscribe('webpage-loaded', _startStorage);


    return {getAll,add, remove, update}
}
)();

export default storage

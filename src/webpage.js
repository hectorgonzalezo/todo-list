const webpage = (
    function () {
        const _buttonOpenMenu = document.querySelector('#button-open-menu');
        const _sideBar = document.querySelector('#sidebar');

        _buttonOpenMenu.addEventListener('click', ()=> {
            _sideBar.classList.toggle('hidden')
        })
    }
)();
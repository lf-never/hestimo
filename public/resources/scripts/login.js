import * as RequestUtil from './common-request.js'
const UserRequest = RequestUtil.UserRequest();

$(() => {
    clearAllCookie();
    $('.btn-login').on('click', () => {
        loginHandler();
    })
})

const loginHandler = function () {
    let loginParams = { username: 'KIPA', password: '1234' };
    UserRequest.loginRequest(loginParams).then(() => {
        // customToast(`User ${loginParams.username}`);
        console.log(`User ${ loginParams.username }`)
        window.location = './'
    })
}

const clearAllCookie = function () {
    const keys = document.cookie.match(/[^ =;]+(?=\=)/g);
    if (keys) {
        for(let i = keys.length; i--; )
        document.cookie = keys[i] + '=0;expires=' + new Date(0).toUTCString()
    }
}
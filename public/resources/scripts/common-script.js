import * as MapUtil from './common-map.js'
import * as WindowUtil from './common-window.js'


$(function () {
    if ($('#map').length) {
        console.log('Init Map ...')
        MapUtil.initMapServerHandler();
    }

    

});

export const __CONSOLE_GREEN = 'color: #43bb88;font-size: 16px;font-weight: bold';

export function getUrlParam (name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]); return null;
}

export function storeInBrowser (key, val) {
    localStorage.setItem(key, JSON.stringify(val));
}
export function getFromBrowser (key) {
    let value = localStorage.getItem(key);
    if (value === 'undefined') return null;
    return JSON.parse(value);
}
export function deleteFromBrowser (key) {
    localStorage.removeItem(key);
}

export function initAxiosHandler () {
    axios.interceptors.request.use(config => {
        return config;
    }, error => {
        return Promise.reject(error);
    })
    axios.interceptors.response.use(response => {
        if (response.data.respCode === -100) {
            WindowUtil.simpleWarn(`Current login is invalid, please login again.`, () => {
                window.parent ? window.parent.location = './login' : window.location = './login'
            })
            console.log(`Current login is invalid, please login again.`)
        } else {
            return response.data;
        }
    }, error => {
        return Promise.reject(error);
    });
    window.axios = axios;
}


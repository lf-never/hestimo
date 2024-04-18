const moment = require('moment');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const jwtConf = require('../conf/jwt');
const path = require('path');

module.exports.responseError = function (msg, code = null) {
    return {
        "code": code || 0,
        "msg": msg,
        "data": ""
    };
}

module.exports.responseSuccess = function (data, recordsTotal = null) {
    let success = {
        "code": 1,
        "msg": 'success',
        "data": data
    };
    /**
     * recordsTotal: total entries
     * recordsFiltered: filtered from _MAX_ total entries
     */
    if (recordsTotal != null) {
        success.recordsTotal = recordsTotal;
        success.recordsFiltered = recordsTotal;
    }
    return success;
}

module.exports.wait = function (ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

module.exports.generateDateTime = function (time) {
    if (time) {
        return moment(time).format('YYYY-MM-DD HH:mm:ss')
    }
    return moment().format('YYYY-MM-DD HH:mm:ss')
}

module.exports.generateUniqueKey = function () {
    let str = moment().valueOf().toString();
    str += '' + Math.floor(Math.random() * 1000).toString();
    return Number.parseInt(str).toString(36).toUpperCase();
}

module.exports.generateTokenKey = function (object) {
    // https://www.npmjs.com/package/jsonwebtoken
    return jwt.sign({
        data: object
    }, jwtConf.Secret, { algorithm: jwtConf.Header.algorithm.toUpperCase(), expiresIn: jwtConf.Header.expire });
}

module.exports.expiresDate = function () {
    let expiresDate = new Date();
    expiresDate.setTime(expiresDate.getTime() + jwtConf.Header.expire * 1000);
    return expiresDate;
}

module.exports.sortBy = function (result) {
    // sortBy default is ASC
    result.list = _.sortBy(result.list, function (o) {
        // If need compare with different event
        // let _tempTime = _.sortBy([ o.speeding.occTime, o.hardBraking.occTime, o.rapidAcc.occTime ]).reverse()[0]
        // return _tempTime

        // If only compare with speeding event
        return o.speeding.occTime;
    }).reverse();
    return result
}

module.exports.getDateLength = function (date1, date2) {
    let tempDate1 = moment(date1).format('YYYY-MM-DD')
    let tempDate2 = moment(date2).format('YYYY-MM-DD')
    let dateLength = moment(tempDate2).diff(moment(tempDate1), 'd') + 1;
    return Math.abs(dateLength)
}


const getSafePath = function (p) {
    p = p.replace(/%2e/ig, '.')
    p = p.replace(/%2f/ig, '/')
    p = p.replace(/%5c/ig, '\\')
    p = p.replace(/^[\/\\]?/, '/')
    p = p.replace(/[\/\\]\.\.[\/\\]/, '/')
    p = path.normalize(p).replace(/\\/g, '/').slice(1)
    return p
}
module.exports.getSafePath = getSafePath
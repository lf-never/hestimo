const express = require('express');
const router = express.Router();

const log = require('../winston/logger').logger('Body Interceptor');

router.use((req, res, next) => {
    let ipAddress = req.ip ||
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : '');
    log.info('HTTP Request IP     : ', ipAddress);
    log.info('HTTP Request URL    : ', req.url);
    log.info('HTTP Request Method : ', req.method);
    log.info('HTTP Request Body   : ', JSON.stringify(req.body, null, 4));
    log.info('HTTP Request Cookies : ', JSON.stringify(req.cookies, null, 4));
    log.info('HTTP Request Session: ', JSON.stringify(req.session, null, 4));

    next();
})
module.exports = router;
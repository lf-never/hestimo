const express = require('express');
const router = express.Router();

const log = require('../winston/logger').logger('Url Interceptor');

router.use((req, res, next) => {
    // TODO: All page need check if exist token
    if (req.method.toLowerCase() == 'get') {
        if (!req.session.token) {
            if (!req.url.includes('/login')) {
                log.warn(`There is no token, redirect to login page!`)
                return res.redirect('/login')
            }
        }
    }

    // TODO: POST request from web/mobile
    if (req.method.toLowerCase() == 'post') {
        if (req.url.includes('/mobile')) {
            // TODO: Mobile
            if (!req.header('Authorization')) {
                if (!req.url.includes('/login')) {
                    log.warn(`There is no token!`)
                    return res.json(utils.response(-100, 'There is no token !'));
                }
            }
        } else {
            // TODO: Web
            if (!req.session.token) {
                if (!req.url.includes('/login')) {
                    log.warn(`There is no token!`)
                    return res.json(utils.response(-100, 'There is no token !'));
                }
            }
        }
    }

    next();
})
module.exports = router;
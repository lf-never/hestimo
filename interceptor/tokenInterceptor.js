const express = require('express');
const moment = require('moment');
const router = express.Router();
const jwt = require('jsonwebtoken');
const jwtConf = require('../conf/jwt');

const utils = require('../util/utils');
const log = require('../winston/logger').logger('Token Interceptor');

router.use(async (req, res, next) => {
    if (req.url.includes('/login')) {
        next();
    } else {
        let token = req.session.token ? req.session.token : req.header('Authorization');
        // https://www.npmjs.com/package/jsonwebtoken
        jwt.verify(token, jwtConf.Secret, { algorithms: jwtConf.Header.algorithm.toUpperCase() }, function (err) {
            if (err) {
                if (err.expiredAt) {
                    // TODO: while token is out of time, update it directly
                    log.warn('(Token Interceptor): Token is expired at ', moment(err.expiredAt).format('YYYY-MM-DD HH:mm:ss'));

                    // TODO: generate new token
                    let result = jwt.decode(token, jwtConf.Secret);
                    req.session.token = utils.generateTokenKey({ userId: result.data.userId })

                    log.warn('(Token Interceptor): Token is updated now ! ');
                    log.warn('(Token Interceptor): New Token is : ', req.session.token);
                    next();
                } else {
                    log.warn('(Token Interceptor): Token is invalid !');
                    return res.json(utils.response(-100, 'Token is invalid !'));
                }
            } else {
                log.info('(Token Interceptor): Token is correct !');
                next();
            }
        });
    }
});
module.exports = router;
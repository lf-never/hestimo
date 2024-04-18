const express = require('express');
const session = require('express-session');
const path = require('path');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const ejs = require('ejs');
// const cors = require('cors');
const bodyParserErrorHandler = require('express-body-parser-error-handler')
require('express-async-errors');
const helmet = require('helmet');
const crypto = require('crypto');
const utils = require('./util/utils.js');
const log = require('./winston/logger').logger('APP');
const conf = require('./conf/conf');

const app = express();
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
	windowMs: 1 * 1000,
	max: 10000,
	message: "Too many requests from this client, please try again later.",
})

app.use(limiter)

app.set('views', path.join(__dirname, 'views'));
app.engine('.html', ejs.__express);
app.set('view engine', 'html');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(bodyParserErrorHandler());
app.use(cookieParser());
// app.use(cors());

app.use((req, res, next) => {
	res.locals.cspNonce = crypto.randomBytes(32).toString("hex");
	next();
});
app.use(helmet({
	contentSecurityPolicy: {
		useDefaults: false,
		directives: {
			// "default-src": ["'self' 'unsafe-inline' 'unsafe-eval'"],
			"default-src": ["'self'"],
			// "script-src": ["'self' 'unsafe-inline' 'unsafe-eval'"],
			"script-src": ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
			// "script-src-attr": ["'self' 'unsafe-inline' 'unsafe-eval'"],
			"script-src-attr": ["'self' 'unsafe-inline'"],
			"style-src": ["'self' 'unsafe-inline'"],
			// "style-src": ["'self' 'unsafe-inline' 'unsafe-eval'"],
			"connect-src": ["'self'"],
			"img-src": ["'self' data: https://gac-geo.googlecnapps.cn"],
			"form-action": ["'self'"],
			"frame-ancestors": ["'self'"],
			// 'upgrade-insecure-requests': [],
		},
		// reportOnly: true,
	},
}));
app.use(session({
	secret: process.env.SESSION_SECRET || conf.sessionSecret,
	resave: false,
	saveUninitialized: false,
	cookie: {
		sameSite: "Strict",
		secure: true
	},
}));

const options = {
	maxAge: 30 * 24 * 3600 * 1000,
}
app.use(express.static(path.join(__dirname, 'node_modules'), options));
app.use(express.static(path.join(__dirname, 'public', 'resources')));
app.use(express.static(path.join(__dirname, 'public', 'statics'), options));

const bodyInterceptor = require('./interceptor/bodyInterceptor');
// const permissionInterceptor = require('./interceptor/permissionInterceptor');
// const tokenInterceptor = require('./interceptor/tokenInterceptor');
app.use(bodyInterceptor);
// app.use(permissionInterceptor);
// app.use(tokenInterceptor);

// const scheduleService = require('./services/scheduleService');
// scheduleService.calcSchedule()
// scheduleService.calcSchedule()
// scheduleService.calcSchedule()
// scheduleService.calcSchedule()
// scheduleService.calcSchedule()
// scheduleService.calcSchedule()
// scheduleService.calcSchedule()

app.use(function (req, res, next) {
	res.setTimeout(2 * 60 * 1000, function () {
		log.info('*************************');
		log.info('Request has timed out. ');
		log.info('HTTP Request URL: ', req.url);
		log.info('HTTP Request Body: ', JSON.stringify(req.body));
		log.info('*************************');
		res.json(utils.responseSuccess(0, 'Request has timed out.'));
	});
	next();
});

const index = require('./routes/index');
app.use('/', index);

process.on('uncaughtException', function (e) {
	log.error(`uncaughtException`)
	log.error(e.message)
});
process.on('unhandledRejection', function (err, promise) {
	log.error(`unhandledRejection`);
	log.error(err.message);
})

app.use(function (req, res, next) {
	const err = new Error('Not Found');
	err.status = 404;
	next(err);
});



app.use(function (err, req, res, next) {
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};
	log.error(`${req.method} - ${req.originalUrl}`);
	log.error(err);
	res.status(err.status || 500);
	if (err.status == 404) {
		res.render('404');
	} else if (err.errorCode == 403) {
		res.render('403');
	} else {
		res.json(utils.responseSuccess(0, err.message ?? err));
	}
});

/**
 * Need init these modules after system start!
 */
require('./db/dbHelper')

module.exports = app;

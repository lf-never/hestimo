const log = require('../winston/logger').logger('DB Helper');
const { Activity } = require('../model/activity');
const { DataHistory } = require('../model/dataHistory');
const { DeviceSelection } = require('../model/deviceSelection');
const { User } = require('../model/user');

try {
    log.info('Start Init DB!');
    // ...
    log.info('Finish Init DB!');

    // Activity.sync({ alter: true });
    // DataHistory.sync({ alter: true });
    // DeviceSelection.sync({ alter: true });
    // User.sync({ alter: true });
} catch (error) {
    log.error(error);
}



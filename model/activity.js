const { DataTypes } = require('sequelize');
const dbConf = require('../db/dbConf');
const conf = require('../conf/setting');

module.exports.Activity = dbConf.sequelizeObj.define('activity', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    activityName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        primaryKey: true,
    },
    location: {
        type: DataTypes.STRING(150),
    },
    startTime: {
        type: DataTypes.DATE,
    },
    remarks: {
        type: DataTypes.STRING(255),
    },
    endTime: {
        type: DataTypes.DATE,
    },
    tcRedThreshold: {
        type: DataTypes.DECIMAL(5, 2),
    },
    tcAmberThreshold: {
        type: DataTypes.DECIMAL(5, 2),
    },
    psiRedThreshold: {
        type: DataTypes.DECIMAL(5, 2),
    },
    psiAmberThreshold: {
        type: DataTypes.DECIMAL(5, 2),
    },
    algorithm: {
        type: DataTypes.STRING(100),
    },
    alarmStatus: {
        type: DataTypes.TINYINT(1),
    },
    psiEnable: {
        type: DataTypes.TINYINT(1),
    },
    activityStatus: {
        type: DataTypes.VIRTUAL
    },
    deviceSelections: {
        type: DataTypes.VIRTUAL
    },
    algorithmName: {
        type: DataTypes.VIRTUAL,
        get() {
            const value = this.getDataValue('algorithm')
            return conf.thresholdSettings.algorithm[value]
        }
    },
}, {
    timestamps: true,
});
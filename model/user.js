const { DataTypes } = require('sequelize');
const dbConf = require('../db/dbConf');

module.exports.User = dbConf.sequelizeObj.define('user', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    setNo: {
        type: DataTypes.STRING(100),
    },
    ipAddress: {
        type: DataTypes.STRING(20),
    },
    name: {
        type: DataTypes.STRING(255),
    },
    semId: {
        type: DataTypes.STRING(45),
    },
    deviceStatus: {
        type: DataTypes.STRING(255),
    },
    semStatus: {
        type: DataTypes.STRING(255),
    },
    activityId: {
        type: DataTypes.BIGINT,
    },
    lat: {
        type: DataTypes.STRING(45),
    },
    lng:{
        type: DataTypes.STRING(45),
    },
    psi: {
        type: DataTypes.DECIMAL(5, 2),
    },
    tc: {
        type: DataTypes.DECIMAL(5, 2),
    },
    ts: {
        type: DataTypes.DECIMAL(5, 2),
    },
    hr: {
        type: DataTypes.DECIMAL(5, 1),
    },
    br: {
        type: DataTypes.DECIMAL(5, 1),
    },
    thresholdAlert: {
        type: DataTypes.STRING(45),
    },
    hrConfidence: {
        type: DataTypes.STRING(25),
    },
    isRecovered: {
        type: DataTypes.BOOLEAN,
    },
    warningTime: {
        type: DataTypes.DATE,
    },
    coreTempConfidence: {
        type: DataTypes.STRING(25),
    },
    mobileTime: {
        type: DataTypes.DATE,
    },
    status: {
        type: DataTypes.VIRTUAL
    },
    order: {
        type: DataTypes.VIRTUAL
    }
}, {
    timestamps: true,
});
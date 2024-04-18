const { DataTypes } = require('sequelize');
const dbConf = require('../db/dbConf');

module.exports.DataHistory = dbConf.sequelizeObj.define('data_history', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    activityId: {
        type: DataTypes.BIGINT,
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
    lat:{
        type: DataTypes.STRING(45),
    },
    lng:{
        type: DataTypes.STRING(45),
    },
    deviceStatus: {
        type: DataTypes.STRING(255),
    },
    semStatus: {
        type: DataTypes.STRING(255),
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
    isRecovered: {
        type: DataTypes.BOOLEAN,
    },
    hrConfidence: {
        type: DataTypes.STRING(25),
    },
    coreTempConfidence: {
        type: DataTypes.STRING(25),
    },
    mobileTime: {
        type: DataTypes.DATE
    },
}, {
    timestamps: true,
    updatedAt: false,
});
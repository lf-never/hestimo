const { DataTypes } = require('sequelize');
const dbConf = require('../db/dbConf');

module.exports.DeviceSelection = dbConf.sequelizeObj.define('device_selection', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    activityId: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    setNo: {
        type: DataTypes.STRING(100),
    },
    name: {
        type: DataTypes.STRING(255),
    },
    ipAddress: {
        type: DataTypes.STRING(20),
    },
    semId: {
        type: DataTypes.STRING(45),
    },
    question1: {
        type: DataTypes.STRING(255),
    },
    question2: {
        type: DataTypes.STRING(255),
    },
    endTime: {
        type: DataTypes.DATE
    }
}, {
    timestamps: true,
});
const utils = require('../util/utils');
const log = require('../winston/logger').logger('Index Service');
const { User } = require('../model/user')
const { Activity } = require('../model/activity')
const { DeviceSelection } = require('../model/deviceSelection')
const { DataHistory } = require('../model/dataHistory')
const { Op, QueryTypes } = require("sequelize");
const { sequelizeObj } = require('../db/dbConf')
const conf = require('../conf/setting');

const moment = require('moment')
const _ = require('lodash')

const ACTIVITY_STATUS = {
    START: "Start",
    END: "End"
}

const SemStatusOK = 'true'
const DisconnectedTime = 30

const isPhoneDisconnected = function (now, lastConnectionTime) {
    if (lastConnectionTime) {
        return moment(now).diff(moment(lastConnectionTime), 's') >= DisconnectedTime
    }
    return true
}

module.exports = {
    GetDeviceSelection: async function (req, res) {
        let start = Number(req.body.start)
        let length =  Number(req.body.page)
        let users = await User.findAll({ offset: Number(start), limit: Number(length) })
        let now = new Date()
        for (let user of users) {
            if (isPhoneDisconnected(now, user.mobileTime)) {
                user.status = "White"
                user.deviceStatus = "Phone Disconnected"
                continue
            }
            if (!user.semStatus || user.semStatus && user.semStatus.toLowerCase() != SemStatusOK) {
                user.status = "White"
                continue
            }
            if (user.deviceStatus) {
                user.status = "Amber"
            } else {
                user.status = "Green"
            }
        }
        let count = await User.count()
        return res.json(utils.responseSuccess(users, count))
    },
    GetDeviceSelectionAll: async function (req, res) {
        let users = await User.findAll()
        let now = new Date()
        for (let user of users) {
            if (isPhoneDisconnected(now, user.mobileTime)) {
                user.status = "White"
                user.deviceStatus = "Phone Disconnected"
                continue
            }
            if (!user.semStatus || user.semStatus && user.semStatus.toLowerCase() != SemStatusOK) {
                user.status = "White"
                continue
            }
            if (user.deviceStatus) {
                user.status = "Amber"
            } else {
                user.status = "Green"
            }
        }
        return res.json(utils.responseSuccess(users, users.length))
    },
    CreateActivity: async function (req, res) {
        let { activityName, location, startTime, remarks } = req.body
        let deviceSelections = [...req.body.deviceSelections]
        let { tcRedThreshold, tcAmberThreshold, psiRedThreshold, psiAmberThreshold, algorithmSelection, alarmStatus, psiEnable } = req.body.threshold

        let isActivityEnd = await Activity.findOne({
            where: {
                endTime: {
                    [Op.is]: null,
                }
            }
        })
        if (isActivityEnd) {
            return res.json(utils.responseError(`${isActivityEnd.activityName} is ${ACTIVITY_STATUS.START.toLowerCase()}, cannot new activity!`))
        }

        let activityObj = await Activity.findOne({ where: { activityName: activityName } })
        if (activityObj != null) {
            return res.json(utils.responseError('Activity Name is exist!'))
        }

        let ipAddressArr = deviceSelections.map(o => o.ipAddress)
        let deviceSelectionArr = deviceSelections.map(o => {
            return {
                setNo: o.setNo,
                ipAddress: o.ipAddress,
                semId: o.semId,
                name: o.name,
            }
        })
        let activityModel = {
            activityName: activityName,
            location: location,
            startTime: startTime,
            remarks: remarks,
            tcRedThreshold: tcRedThreshold,
            tcAmberThreshold: tcAmberThreshold,
            psiRedThreshold: psiRedThreshold,
            psiAmberThreshold: psiAmberThreshold,
            algorithm: algorithmSelection,
            alarmStatus: alarmStatus,
            psiEnable: psiEnable,
        }

        await sequelizeObj.transaction(async t1 => {
            let activity = await Activity.create(activityModel)
            let activityId = activity.id
            await User.update({
                activityId: activityId,
                isRecovered: null,
            }, {
                where: {
                    ipAddress: {
                        [Op.in]: ipAddressArr
                    }
                }
            })

            deviceSelectionArr.forEach((val, index) => {
                val.activityId = activityId
            })
            await DeviceSelection.bulkCreate(deviceSelectionArr)
        })
        return res.json(utils.responseSuccess('Success'))
    },
    EditActivity: async function (req, res) {
        let { activityName, location, startTime, remarks } = req.body
        let deviceSelections = [...req.body.deviceSelections]

        let { tcRedThreshold, tcAmberThreshold, psiRedThreshold, psiAmberThreshold, algorithmSelection, alarmStatus, psiEnable } = req.body.threshold

        let activityObj = await Activity.findOne({ where: { activityName: activityName } })
        let activityId = activityObj.id

        let oldDeviceSelections = await DeviceSelection.findAll({
            where: {
                activityId: activityId
            }
        })
        let oldIPAddressArr = oldDeviceSelections.map(o => o.ipAddress)
        let ipAddressArr = deviceSelections.map(o => o.ipAddress)

        let deleteIPAdressArr = _.difference(oldIPAddressArr, ipAddressArr);
        let addIPAdressArr = _.difference(ipAddressArr, oldIPAddressArr);
        let now = moment()
        let activityModel = {
            location: location,
            startTime: startTime,
            remarks: remarks,
            tcRedThreshold: tcRedThreshold,
            tcAmberThreshold: tcAmberThreshold,
            psiRedThreshold: psiRedThreshold,
            psiAmberThreshold: psiAmberThreshold,
            algorithm: algorithmSelection,
            alarmStatus: alarmStatus,
            psiEnable: psiEnable,
            // createdAt: now,
        }

        let deviceSelectionArr = []
        if (addIPAdressArr.length > 0) {
            deviceSelectionArr = deviceSelections.filter(o => addIPAdressArr.indexOf(o.ipAddress) != -1)
                .map(o => {
                    return {
                        setNo: o.setNo,
                        ipAddress: o.ipAddress,
                        semId: o.semId,
                        name: o.name,
                        activityId: activityId
                    }
                })
        }

        await sequelizeObj.transaction(async t1 => {
            await Activity.update(activityModel, {
                where: {
                    id: activityId
                }
            })

            await User.update({
                activityId: activityId,
            }, {
                where: {
                    ipAddress: {
                        [Op.in]: ipAddressArr
                    }
                }
            })

            await DeviceSelection.update({ endTime: null }, {
                where: {
                    activityId: activityId,
                    ipAddress: {
                        [Op.in]: ipAddressArr
                    }
                }
            })

            if (deleteIPAdressArr.length > 0) {
                await User.update({
                    activityId: null,
                }, {
                    where: {
                        ipAddress: {
                            [Op.in]: deleteIPAdressArr
                        }
                    }
                })
                await DeviceSelection.update({ endTime: now }, {
                    where: {
                        activityId: activityId,
                        ipAddress: {
                            [Op.in]: deleteIPAdressArr
                        }
                    }
                })
            }

            if (addIPAdressArr.length > 0) {
                await User.update({
                    activityId: activityId,
                }, {
                    where: {
                        ipAddress: {
                            [Op.in]: addIPAdressArr
                        }
                    }
                })
                await DeviceSelection.bulkCreate(deviceSelectionArr)
            }
        })
        return res.json(utils.responseSuccess('Success'))
    },
    GetCurrentActivity: async function (req, res) {
        let activityObj = await Activity.findOne({
            where: {
                endTime: {
                    [Op.is]: null,
                }
            }
        })
        if (!activityObj) {
            return res.json(utils.responseSuccess(null))
        }
        activityObj.activityStatus = ACTIVITY_STATUS.START
        let deviceSelections = await DeviceSelection.findAll({
            where: {
                activityId: activityObj.id,
                endTime: null,
            }
        })
        let ipAddressArr = deviceSelections.map(o => o.ipAddress)
        let users = await User.findAll({
            where: {
                ipAddress: {
                    [Op.in]: ipAddressArr
                }
            }
        })
        let now = new Date()
        for (let user of users) {
            if (isPhoneDisconnected(now, user.mobileTime) || !user.semStatus || user.semStatus && user.semStatus.toLowerCase() != SemStatusOK || user.coreTempConfidence && user.coreTempConfidence.toLowerCase() == "low") {
                user.status = "White"
                continue
            }
            if (user.deviceStatus) {
                user.status = "Amber"
            } else {
                user.status = "Green"
            }
        }
        activityObj.deviceSelections = users
        return res.json(utils.responseSuccess(activityObj))
    },
    GetTrainees: async function (req, res) {
        let { currentActivityId } = req.body

        let users = await User.findAll({
            where: {
                activityId: currentActivityId
            }
        })
        let now = new Date()
        for (let user of users) {
            if (isPhoneDisconnected(now, user.mobileTime)) {
                user.status = 2
                user.deviceStatus = "Phone Disconnected"
                continue
            }
            if (!user.semStatus || user.semStatus && user.semStatus.toLowerCase() != SemStatusOK || user.coreTempConfidence && user.coreTempConfidence.toLowerCase() == "low") {
                user.status = 2
            } else {
                if (user.thresholdAlert == "Green") {
                    user.status = 1
                } else if (user.thresholdAlert == "Red") {
                    user.status = 4
                } else if (user.thresholdAlert == "Yellow") {
                    user.status = 3
                } else {
                    user.status = 1
                }
            }
        }

        // users = _.sortBy(users, function (o) { return -o.status })
        users = _.orderBy(users, ['status', 'tc'], ['desc', 'desc']);
        let total = users.length
        let n = 5
        users.forEach((item, index) => {
            let number = total - index
            let order = Number(item.status + "" + (new Array(n).join('0') + number).slice(-n))
            item.order = -order
        })

        let redNumber = _.filter(users, function (o) { return o.status == 4 }).length
        let amberNumber = _.filter(users, function (o) { return o.status == 3 }).length
        let greenNumber = _.filter(users, function (o) { return o.status == 1 }).length
        let whiteNumber = _.filter(users, function (o) { return o.status == 2 }).length
        let traineeNumber = {
            redNumber, amberNumber, greenNumber, whiteNumber, total
        }
        return res.json(utils.responseSuccess({ users, traineeNumber }))
    },
    EndActivity: async function (req, res) {
        let { currentActivityId } = req.body

        let activity = await Activity.findByPk(currentActivityId)
        if (activity && activity.endTime) {
            return res.json(utils.responseError('No Activity can end!'))
        }

        let endTime = moment()

        await sequelizeObj.transaction(async t1 => {
            await Activity.update({
                endTime: endTime
            }, {
                where: {
                    id: currentActivityId
                }
            })
            await User.update({
                activityId: null
            }, {
                where: {
                    activityId: currentActivityId
                }
            })
            await DeviceSelection.update({ endTime: endTime }, {
                where: {
                    activityId: currentActivityId,
                    endTime: null
                }
            })
        })
        return res.json(utils.responseSuccess(true))
    },
    GetPastAvtivitySelectForm: async function (req, res) {
        let activitys = await Activity.findAll({
            attributes: ['id', 'activityName'],
            where: {
                endTime: {
                    [Op.not]: null,
                }
            },
            order: [
                ['createdAt', 'desc']
            ]
        })
        return res.json(utils.responseSuccess(activitys))
    },
    GetPastActivityBySelectActivityId: async function (req, res) {
        let { selectActivityId } = req.body
        let start = Number(req.body.start)
        let length =  Number(req.body.page)

        if (selectActivityId == 0) {
            return res.json(utils.responseSuccess([], 0))
        }

        let activity = await Activity.findByPk(selectActivityId)
        if (!activity) {
            return res.json(utils.responseSuccess([], 0))
        }
        let { createdAt, endTime, tcRedThreshold, tcAmberThreshold, psiRedThreshold, psiAmberThreshold } = activity

        let deviceSelectionList = await DeviceSelection.findAll({
            attributes: ["ipAddress", "setNo"],
            where: {
                activityId: selectActivityId
            },
            offset: Number(start),
            limit: Number(length)
        })
        let ipAddressList = deviceSelectionList.map(o => { return { ipAddress: o.ipAddress, setNo: o.setNo } })

        const queryData = async function (row, selectActivityId, createdAt, endTime) {
            let datas = await sequelizeObj.query(
                `SELECT
                    CONCAT_WS(
                        '|',
                        ROUND(avg(tc), 2),
                        ROUND(max(tc), 2),
                        ROUND(min(tc), 2),
                        ROUND(avg(psi), 2),
                        ROUND(max(psi), 2),
                        ROUND(min(psi), 2),
                        ROUND(avg(hr),1),
                        ROUND(max(hr),1),
                        ROUND(min(hr),1),
                        ROUND(avg(br),1),
                        ROUND(max(br),1),
                        ROUND(min(br),1)
                    ) as result
                FROM
                    data_history
                WHERE
                    coreTempConfidence != 'Low' AND tc > 0 AND psi > 0
                AND ipAddress = ?
                AND mobileTime BETWEEN ? AND ?
                AND activityId = ? `,
                {
                    replacements: [row.ipAddress, createdAt, endTime, selectActivityId],
                    type: QueryTypes.SELECT
                }
            )
            if (datas[0].result != "") {
                let data = datas[0].result.split('|')
                row.avgTc = data[0]
                row.maxTc = data[1]
                row.minTc = data[2]
                row.avgPSI = data[3]
                row.maxPSI = data[4]
                row.minPSI = data[5]

                row.avgHr = data[6]
                row.maxHr = data[7]
                row.minHr = data[8]
                row.avgBr = data[9]
                row.maxBr = data[10]
                row.minBr = data[11]
            }
            // console.log(row)
            return row
        }

        let datas = await Promise.all(ipAddressList.map(item => {
            return new Promise((resolve, reject) => {
                let row = {
                    ipAddress: item.ipAddress,
                    setNo: item.setNo,
                    activityId: selectActivityId,
                    avgTc: 0,
                    maxTc: 0,
                    minTc: 0,
                    avgPSI: 0,
                    maxPSI: 0,
                    minPSI: 0,
                    avgHr: 0,
                    maxHr: 0,
                    minHr: 0,
                    avgBr: 0,
                    maxBr: 0,
                    minBr: 0,
                    tcRedThreshold, tcAmberThreshold, psiRedThreshold, psiAmberThreshold
                }
                try {
                    resolve(queryData(row, selectActivityId, createdAt, endTime))
                } catch (ex) {
                    console.log(ex)
                    reject(row)
                }
            })
        }))

        let total = await DeviceSelection.count({
            where: {
                activityId: selectActivityId
            },
        })
        return res.json(utils.responseSuccess(datas, total))
    },
    GetPastActivityStatusData: async function (req, res) {
        let { selectActivityId } = req.body
        let activity = await Activity.findByPk(selectActivityId)
        let { createdAt, endTime, tcRedThreshold, tcAmberThreshold, psiRedThreshold, psiAmberThreshold } = activity
        tcRedThreshold = Number(tcRedThreshold)
        tcAmberThreshold = Number(tcAmberThreshold)
        psiRedThreshold = Number(psiRedThreshold)
        psiAmberThreshold = Number(psiAmberThreshold)

        let deviceSelectionsAll = await DeviceSelection.findAll({
            attributes: ['ipAddress'],
            where: {
                activityId: selectActivityId
            },
        })
        let ipAddressAll = deviceSelectionsAll.map(o => o.ipAddress)

        const GetHighestAndAvgData = function () {
            return new Promise(async (resolve, reject) => {
                let highestTc = 0, avgTc = 0, highestPSI = 0, avgPSI = 0
                try {
                    let dataHistorys = await sequelizeObj.query(
                        `SELECT
                            max(psi) as highestPSI, max(tc) as highestTc, avg(psi) as avgPSI, avg(tc) as avgTc
                        FROM
                            data_history
                        WHERE
                            coreTempConfidence != 'Low' AND tc > 0 AND psi > 0
                        AND activityId = ? AND mobileTime BETWEEN ? AND ?`,
                        {
                            replacements: [selectActivityId, createdAt, endTime],
                            type: QueryTypes.SELECT
                        }
                    );
                    if (dataHistorys.length > 0) {
                        let data = dataHistorys[0]
                        highestTc = data.highestTc ? data.highestTc : 0
                        avgTc = _.round(data.avgTc, 2)
                        highestPSI = data.highestPSI ? data.highestPSI : 0
                        avgPSI = _.round(data.avgPSI, 2)
                    }
                    resolve({ highestTc, avgTc, highestPSI, avgPSI })
                } catch (ex) {
                    console.log(ex)
                    reject({ highestTc, avgTc, highestPSI, avgPSI })
                }
            })
        }

        const GetHeatStrainAndPSIStatus = function () {
            return new Promise(async (resolve, reject) => {
                let tcGreen = 0, tcAmber = 0, tcRed = 0, psiGreen = 0, psiAmber = 0, psiRed = 0
                try {
                    let dataHistorys = await sequelizeObj.query(
                        `SELECT
                            ipAddress, 
                            sum(case when psi >= ? then 1 else 0 end) as psiRedTotal,
                            sum(case when psi > ? AND psi < ? then 1 else 0 end) as psiAmberTotal,
                            sum(case when tc >= ? then 1 else 0 end) as tcRedTotal,
                            sum(case when tc > ? AND tc < ? then 1 else 0 end) as tcAmberTotal
                        FROM
                            data_history
                        WHERE
                            coreTempConfidence != 'Low' AND tc > 0 AND psi > 0
                            AND activityId = ? AND mobileTime BETWEEN ? AND ?
                            GROUP BY  ipAddress`,
                        {
                            replacements: [
                                psiRedThreshold, psiAmberThreshold, psiRedThreshold,
                                tcRedThreshold, tcAmberThreshold, tcRedThreshold,
                                selectActivityId, createdAt, endTime],
                            type: QueryTypes.SELECT
                        }
                    );
                    if (dataHistorys.length > 0) {
                        psiRed = dataHistorys.filter(o => o.psiRedTotal > 0).length
                        psiAmber = dataHistorys.filter(o => o.psiRedTotal == 0 && o.psiAmberTotal > 0).length
                        psiGreen = dataHistorys.filter(o => o.psiRedTotal == 0 && o.psiAmberTotal == 0).length

                        tcRed = dataHistorys.filter(o => o.tcRedTotal > 0).length
                        tcAmber = dataHistorys.filter(o => o.tcRedTotal == 0 && o.tcRedTotal > 0).length
                        tcGreen = dataHistorys.filter(o => o.tcRedTotal == 0 && o.tcRedTotal == 0).length
                    }
                    resolve({ tcGreen, tcAmber, tcRed, psiGreen, psiAmber, psiRed })
                } catch (ex) {
                    console.log(ex)
                    reject({ tcGreen, tcAmber, tcRed, psiGreen, psiAmber, psiRed })
                }
            })
        }

        let datas = await Promise.all([GetHighestAndAvgData(), GetHeatStrainAndPSIStatus()])
        let { highestTc, avgTc, highestPSI, avgPSI } = datas[0]
        let { tcGreen, tcAmber, tcRed, psiGreen, psiAmber, psiRed } = datas[1]
        let total = ipAddressAll.length
        let date = moment(createdAt).format("DD-MM-YY")
        return res.json(utils.responseSuccess({
            highestTc,
            highestPSI,
            avgTc,
            avgPSI,
            tcGreen,
            tcAmber,
            tcRed,
            psiGreen,
            psiAmber,
            psiRed,
            total,
            date,
        }))
    },
    GetPastActivityChartData: async function (req, res) {
        let { selectActivityId, ipAddress,
            maxTc, minTc,
            maxPSI, minPSI,
            maxHr, minHr,
            maxBr, minBr } = req.body

        let activity = await Activity.findByPk(selectActivityId)
        let { createdAt, endTime } = activity

        let dataHistorys = await sequelizeObj.query(
            `SELECT
                psi, tc, hr, br, mobileTime
            FROM
                data_history
            WHERE
            coreTempConfidence != 'Low' AND tc > 0 AND psi > 0
            AND activityId = ? AND mobileTime BETWEEN ? AND ?
            AND ipAddress = ?
                order by mobileTime asc`,
            {
                replacements: [selectActivityId, createdAt, endTime, ipAddress],
                type: QueryTypes.SELECT
            }
        );
        console.time("GetPastActivityChartData")
        let psiArr = dataHistorys.map(o => Number(o.psi))
        let tcArr = dataHistorys.map(o => Number(o.tc))
        let hrArr = dataHistorys.map(o => Number(o.hr))
        let brArr = dataHistorys.map(o => Number(o.br))
        let categories = dataHistorys.map(o => moment(o.mobileTime).diff(moment(createdAt), 'millisecond'))

        let seriesPsi = []
        let seriesTc = []
        let seriesHr = []
        let seriesBr = []
        let scatterPsi = []
        let scatterTc = []
        let scatterHr = []
        let scatterBr = []
        categories.forEach((value, i) => {
            let psi = psiArr[i]
            let tc = tcArr[i]
            let hr = hrArr[i]
            let br = brArr[i]
            seriesPsi.push([value, psi])
            seriesTc.push([value, tc])
            seriesHr.push([value, hr])
            seriesBr.push([value, br])
            if (psi == maxPSI || psi == minPSI) {
                scatterPsi.push([value, psi])
            }
            if (tc == maxTc || tc == minTc) {
                scatterTc.push([value, tc])
            }
            if (hr == maxHr || hr == minHr) {
                scatterHr.push([value, hr])
            }
            if (br == maxBr || br == minBr) {
                scatterBr.push([value, br])
            }
        })
        console.timeEnd("GetPastActivityChartData")
        return res.json(utils.responseSuccess({
            seriesPsi,
            seriesTc,
            seriesHr,
            seriesBr,
            scatterPsi,
            scatterTc,
            scatterHr,
            scatterBr,
        }))
    },
    GetActivityByIPAddress: async function (req, res) {
        let { ipAddress } = req.body
        let user = await User.findOne({
            where: {
                ipAddress: ipAddress
            }
        })

        let deviceSelection = await DeviceSelection.findOne({
            where: {
                ipAddress: ipAddress
            },
            order: [
                ['createdAt', 'desc']
            ]
        })

        if (!deviceSelection || deviceSelection.endTime) {
            let result = {
                activityName: "-",
                semId: user ? user.semId : "-",
                setNo: user ? user.setNo : "-",
            }
            return res.json(utils.responseSuccess(result))
        }

        let activity = await Activity.findByPk(deviceSelection.activityId)
        let { activityName, location, tcRedThreshold, tcAmberThreshold, psiRedThreshold, psiAmberThreshold, algorithm, alarmStatus, psiEnable, createdAt, endTime } = activity
        let activityStatus = ACTIVITY_STATUS.START
        if (endTime) {
            activityStatus = ACTIVITY_STATUS.END
        }
        let result = {
            activityId: activity.id,
            activityName: activityName,
            location: location,
            tcRedThreshold: tcRedThreshold,
            tcAmberThreshold: tcAmberThreshold,
            psiRedThreshold: psiRedThreshold,
            psiAmberThreshold: psiAmberThreshold,
            algorithm: algorithm,
            alarmStatus: alarmStatus == 1 ? 'Y' : 'N',
            psiEnable: psiEnable == 1 ? 'Y' : 'N',
            datetime: createdAt,
            activityStatus: activityStatus,
            semId: user.semId,
            setNo: user.setNo,
            name: user.name,
        }
        return res.json(utils.responseSuccess(result))
    },
    MobileConnection: async function (req, res) {
        let { ipAddress, semStatus, deviceStatus, datetime, semId, hrConfidence, coreTempConfidence } = req.body

        let user = await User.findOne({
            where: {
                ipAddress: ipAddress
            }
        })
        if (user.mobileTime == null || moment(datetime).isAfter(moment(user.mobileTime))) {
            let updateObj = {
                semStatus: semStatus,
                deviceStatus: deviceStatus,
                mobileTime: datetime,
                semId: semId,
                hrConfidence: hrConfidence,
                coreTempConfidence: coreTempConfidence
            }
            if (!user.deviceStatus && deviceStatus) {
                updateObj.warningTime = datetime
            }
            else if (!deviceStatus) {
                updateObj.warningTime = null
            }
            await User.update(updateObj, {
                where: {
                    ipAddress: ipAddress
                }
            })
        }
        return res.json(utils.responseSuccess(true))
    },
    UploadMobileData: async function (req, res) {
        try {
            let { ipAddress, semId, semStatus, sTemp, cTemp, psi, hr, br, lat, lng, thresholdAlert, deviceStatus, activityId, hrConfidence, coreTempConfidence } = req.body
            let datetime = new String(req.body.datetime)

            let yyyy = datetime.split(' ')[0].split('/')[2]
            let mm = datetime.split(' ')[0].split('/')[1]
            let dd = datetime.split(' ')[0].split('/')[0]
            let hhmmss = datetime.split(' ')[1].substr(1, 8)
            let createdAt = `${yyyy}-${mm}-${dd} ${hhmmss}`

            let user = await User.findOne({ where: { ipAddress: ipAddress } })
            if (!user) {
                return res.json(utils.responseError("User does not exist!"))
            }

            let activity = await Activity.findByPk(activityId)
            if (!activity) {
                return res.json({
                    respCode: -1,
                    respMessage: "Activity does not exist!"
                })
            }

            thresholdAlert = getThresholdAlert(cTemp, psi, activity)

            if (activity.endTime || user.activityId == null) {
                activity.activityStatus = ACTIVITY_STATUS.END
            } else {
                activity.activityStatus = ACTIVITY_STATUS.START
            }

            let isRecovered = false
            if (!user.isRecovered && user.thresholdAlert == "Red") {
                isRecovered = true
            }

            await sequelizeObj.transaction(async (t1) => {
                await DataHistory.create({
                    setNo: user.setNo,
                    name: user.name,
                    ipAddress: ipAddress,
                    semId: semId,
                    lat: lat,
                    lng: lng,
                    semStatus: semStatus,
                    deviceStatus: deviceStatus,
                    psi: psi,
                    tc: cTemp,
                    ts: sTemp,
                    hr: hr,
                    br: br,
                    thresholdAlert: thresholdAlert,
                    isRecovered: isRecovered,
                    mobileTime: createdAt,
                    activityId: activityId,
                    hrConfidence: hrConfidence,
                    coreTempConfidence: coreTempConfidence,
                })
                if (user.mobileTime == null || moment(createdAt).isAfter(moment(user.mobileTime))) {
                    let userUpdateObj = {
                        semStatus: semStatus,
                        deviceStatus: deviceStatus,
                        lat: lat,
                        lng: lng,
                        psi: psi,
                        tc: cTemp,
                        hr: hr,
                        br: br,
                        thresholdAlert: thresholdAlert,
                        mobileTime: createdAt,
                        ts: sTemp,
                        hrConfidence: hrConfidence,
                        coreTempConfidence: coreTempConfidence,
                    }
                    if (isRecovered) {
                        userUpdateObj.isRecovered = isRecovered
                    }
                    if (!user.deviceStatus && deviceStatus) {
                        userUpdateObj.warningTime = createdAt
                    }
                    else if (!deviceStatus) {
                        userUpdateObj.warningTime = null
                    }
                    await User.update(userUpdateObj, {
                        where: {
                            ipAddress: ipAddress
                        }
                    })
                }
            })
            return res.json({
                respCode: 1,
                respMessage: {
                    activityInfo: {
                        activityName: activity.activityName,
                        activityId: activity.id,
                        setNo: user.setNo,
                        tcRedThreshold: activity.tcRedThreshold,
                        tcAmberThreshold: activity.tcAmberThreshold,
                        psiRedThreshold: activity.psiRedThreshold,
                        psiAmberThreshold: activity.psiAmberThreshold,
                        alarmStatus: activity.alarmStatus == 1 ? 'Y' : 'N',
                        psiEnable: activity.psiEnable == 1 ? 'Y' : 'N',
                        name: user.name,
                    },
                    activityStatus: activity.activityStatus,
                }
            })
        } catch (ex) {
            console.log(ex)
            return res.json({
                respCode: 0,
                respMessage: "Upload faild"
            })
        }
    },
    SubmitSurvey: async function (req, res) {
        try {
            let { question1, question2, activityId, ipAddress } = req.body

            let deviceSelection = await DeviceSelection.findOne({
                where: {
                    activityId: activityId,
                    ipAddress: ipAddress,
                }
            })

            if (!deviceSelection) {
                return res.json(utils.responseError("Submit failed! IP Address cannot found!"))
            }
            if (question1) {
                deviceSelection.question1 = JSON.stringify(question1)
            }
            if (question2) {
                deviceSelection.question2 = JSON.stringify(question2)
            }
            await deviceSelection.save()

            return res.json(utils.responseSuccess(true))
        } catch (ex) {
            log.error(ex)
            return res.json(utils.responseError("Submit failed!"))
        }
    },
    DeleteActivityById: async function (req, res) {
        try {
            let { activityId } = req.body
            await sequelizeObj.transaction(async (t1) => {
                await Activity.destroy({ where: { id: activityId } })
                await DeviceSelection.destroy({ where: { activityId: activityId } })
                await DataHistory.destroy({ where: { activityId: activityId } })
            })
            return res.json(utils.responseSuccess(true))
        } catch (ex) {
            log.error(ex)
            return res.json(utils.responseError("Submit failed!"))
        }
    },
    ChangeNameById: async function (req, res) {
        try {
            let { id, name } = req.body
            let user = await User.findByPk(id)
            let activityId = user.activityId
            let ipAddress = user.ipAddress
            await sequelizeObj.transaction(async (t1) => {
                await User.update({
                    name: name
                }, {
                    where: {
                        id: id
                    }
                })
                if (activityId) {
                    await DeviceSelection.update({
                        name: name
                    }, {
                        where: {
                            activityId: activityId,
                            ipAddress: ipAddress
                        }
                    })
                }
            })
            return res.json(utils.responseSuccess(true))
        } catch (ex) {
            log.error(ex)
            return res.json(utils.responseError("Submit failed!"))
        }
    },
    UpdateActivityThresholdSettings: async function (req, res) {
        try {
            let { tcRedThreshold, tcAmberThreshold, psiRedThreshold, psiAmberThreshold, algorithmSelection, alarmStatus, psiEnable, activityId } = req.body
            await Activity.update({
                tcRedThreshold: tcRedThreshold,
                tcAmberThreshold: tcAmberThreshold,
                psiRedThreshold: psiRedThreshold,
                psiAmberThreshold: psiAmberThreshold,
                algorithm: algorithmSelection,
                alarmStatus: alarmStatus,
                psiEnable: psiEnable,
            }, {
                where: {
                    id: activityId
                }
            })
            return res.json(utils.responseSuccess(true))
        } catch (ex) {
            log.error(ex)
            return res.json(utils.responseError("Submit failed!"))
        }
    },
    GetThresholdSettings: async function (req, res) {
        try {
            return res.json(utils.responseSuccess(conf.thresholdSettings))
        } catch (ex) {
            log.error(ex)
            return res.json(utils.responseError("No setting password and algorithm."))
        }
    }
}

const getThresholdAlert = function (tc, psi, activity) {
    tc = Number(parseFloat(tc).toFixed(2))
    psi = Number(parseFloat(psi).toFixed(2))
    let { psiEnable, tcRedThreshold, tcAmberThreshold, psiRedThreshold, psiAmberThreshold } = activity
    if (psiEnable) {
        if (tc >= tcRedThreshold || psi >= psiRedThreshold) {
            return "Red"
        } else if (tc < tcAmberThreshold && psi < psiAmberThreshold) {
            return "Green"
        } else {
            return "Yellow"
        }
    } else {
        if (tc >= tcRedThreshold) {
            return "Red"
        } else if (tc < tcAmberThreshold) {
            return "Green"
        } else {
            return "Yellow"
        }
    }
}
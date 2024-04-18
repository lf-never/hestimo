const schedule = require('node-schedule');
const { User } = require('../model/user')
const { Activity } = require('../model/activity')
const { DataHistory } = require('../model/dataHistory')
const { sequelizeObj } = require('../db/dbConf')
const _ = require('lodash')


// *    *    *    *    *    *
// ┬    ┬    ┬    ┬    ┬    ┬
// │    │    │    │    │    │
// │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
// │    │    │    │    └───── month (1 - 12)
// │    │    │    └────────── day of month (1 - 31)
// │    │    └─────────────── hour (0 - 23)
// │    └──────────────────── minute (0 - 59)
// └───────────────────────── second (0 - 59, OPTIONAL)
//

module.exports.calcSchedule = function () {
    schedule.scheduleJob(`*/1 * * * * *`, async () => {
        let users = await User.findAll()
        let dataHistoryArr = []
        let userArr = []
        for (let user of users) {
            let lat = _.random(1.12603, 1.50152, true)
            let lng = _.random(103.45, 104.1495668, true)
            let semStatus = 'true'
            let deviceStatus = ''
            let psi = _.random(3, 10, true)
            let tc = _.random(36.0, 42.5, true)
            let hr = _.random(30, 60)
            let br = _.random(90, 150)

            let { setNo, ipAddress, semId, id } = user

            let thresholdAlert = 'Green'
            let isRecovered = false

            let activityId = user.activityId
            if (activityId) {
                let activity = await Activity.findByPk(activityId)
                if (!activity) {
                    return res.json(utils.responseError("Activity not exist!"))
                }

                let { tcRedThreshold, tcAmberThreshold, psiRedThreshold, psiAmberThreshold } = activity

                if (Number(psi) >= Number(psiRedThreshold) || Number(tc) >= Number(tcRedThreshold)) {
                    thresholdAlert = 'Red'
                } else if (Number(psi) < Number(psiRedThreshold) && Number(psi) >= Number(psiAmberThreshold)
                    || Number(tc) < Number(tcRedThreshold) && Number(tc) >= Number(tcAmberThreshold)) {
                    thresholdAlert = 'Yellow'
                } else {
                    thresholdAlert = 'Green'
                }

                if (user?.thresholdAlert == 'Red' && ['Yellow', 'Green'].indexOf(thresholdAlert) != -1) {
                    isRecovered = true
                }
            }

            dataHistoryArr.push({
                setNo: setNo,
                ipAddress: ipAddress,
                semId: semId,
                lat: lat,
                lng: lng,
                semStatus: semStatus,
                deviceStatus: deviceStatus,
                psi: psi,
                tc: tc,
                hr: hr,
                br: br,
                thresholdAlert: thresholdAlert,
                isRecovered: isRecovered,
                activityId: activityId,
            })
            userArr.push({
                semStatus: semStatus,
                deviceStatus: deviceStatus,
                lat: lat,
                lng: lng,
                psi: psi,
                tc: tc,
                hr: hr,
                br: br,
                thresholdAlert: thresholdAlert,
                isRecovered: isRecovered,
                ipAddress: ipAddress,
                id: id
            })
        }
        await sequelizeObj.transaction(async (t1) => {
            await DataHistory.bulkCreate(dataHistoryArr)
            await User.bulkCreate(userArr, {
                updateOnDuplicate: ['semStatus', 'deviceStatus',
                    'lat', 'lng', 'psi', 'tc', 'hr', 'br',
                    'isRecovered', 'thresholdAlert', 'ipAddress']
            })
        })
    })
}
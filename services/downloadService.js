const log = require('../winston/logger').logger('Download Service');
const utils = require('../util/utils');
const { QueryTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx-js-style');
const _xlsx = require('xlsx');
const { User } = require('../model/user');
const formidable = require('formidable');
const { sequelizeObj } = require('../db/dbConf')
const { Activity } = require('../model/activity')
const { DeviceSelection } = require('../model/deviceSelection')
const moment = require('moment');
const admZip = require('adm-zip');

let downloadFolder = './public/download/'
let uploadFolder = './public/upload/'

module.exports.ExportDataToExcel = async function (req, res) {
    let { filename } = req.query
    let datas = await GetUserData()

    if (!filename) {
        return res.json(utils.responseError(`Filename cannot be empty.`))
    }

    if (!fs.existsSync(downloadFolder)) {
        fs.mkdir(path.resolve(downloadFolder), { recursive: true }, (err) => {
            if (err) {
                log.error(err)
                return res.json(utils.responseError(`${uploadFolder} does not exist.`))
            }
        });
    }

    filename = `${filename}.xlsx`
    filename = utils.getSafePath(filename)
    let filepath = path.join(downloadFolder, filename)
    WriteDataIntoExcel1(datas, filepath)

    res.set({
        'content-type': 'application/octet-stream',
        'content-disposition': 'attachment;filename=' + encodeURI(filename)
    })

    fs.createReadStream(filepath).pipe(res)
}

const GetUserData = async function () {

    let users = await User.findAll()
    let excelJson = []
    let title = ["S/N", "Set", "IP Address", "Name", "SEM ID", "Status", "Equipment Status"]
    excelJson.push(title)
    users.forEach((r, i) => {
        let status = "Warning"
        if (!r.semStatus || r.semStatus && r.semStatus.toLowerCase() != 'true') {
            status = "Disconnected"
        } else if (!r.deviceStatus) {
            status = "All Good"
        }

        excelJson.push([
            i + 1,
            r.setNo,
            r.ipAddress,
            r.name,
            r.semId,
            status,
            r.deviceStatus,
        ])
    })
    return excelJson
}

const WriteDataIntoExcel = function (datas, path) {
    // let buffer = _xlsx.build([
    //     {
    //         name: 'sheet1',
    //         data: datas
    //     }
    // ]);
    // path = utils.getSafePath(path)

    // fs.writeFileSync(path, buffer, { 'flag': 'w' });

    const wb = _xlsx.utils.book_new();

    const ws = _xlsx.utils.aoa_to_sheet(datas);

    _xlsx.utils.book_append_sheet(wb, ws, "Sheet1");

    _xlsx.writeFile(wb, path);
}

const WriteDataIntoExcel1 = function (data, path) {
    const wb = xlsx.utils.book_new();

    const ws = xlsx.utils.aoa_to_sheet(data);

    let columnStyle = {
        fill: {
            fgColor: { rgb: "FFFF00" }
        },
    }

    for (let i = 2; i <= data.length; i++) {
        ws['D' + i].s = columnStyle
    }

    xlsx.utils.book_append_sheet(wb, ws, "Sheet1");

    xlsx.writeFile(wb, path);
}

module.exports.UploadDevice = async function (req, res) {
    let form = formidable({
        encoding: 'utf-8',
        uploadDir: uploadFolder,
        keepExtensions: true,
        maxFileSize: 1024 * 1024 * 1024,
    });

    if (!fs.existsSync(uploadFolder)) {
        fs.mkdir(path.resolve(uploadFolder), { recursive: true }, (err) => {
            if (err) {
                log.error(err)
                return res.json(utils.responseError(`${uploadFolder} does not exist.`))
            }
        });
    }

    form.parse(req, async (err, fields, files) => {
        try {
            let filename = fields.filename;
            let extension = filename.substring(filename.lastIndexOf('.') + 1);
            if (extension !== 'xlsx') {
                return res.json(utils.responseError('The file type must be xlsx.'))
            }
            let oldPath = path.join(process.cwd(), files.file.path);
            let newPath = path.join(process.cwd(), uploadFolder, filename);
            fs.renameSync(oldPath, newPath);

            // var datas = []
            // var obj = _xlsx.parse(newPath);
            // let title = obj[0].data[0]
            // let setColumn = 0
            // let ipAddressColumn = 0
            // let nameColumn = 0

            // title.forEach((val, index) => {
            //     if (val.trim() == "Set") {
            //         setColumn = index
            //     } else if (val.trim() == "IP Address") {
            //         ipAddressColumn = index
            //     } else if (val.trim() == "Name") {
            //         nameColumn = index
            //     }
            // })

            // let data = obj[0].data.slice(1)
            // data = data.filter(o => o.length > 0)
            // if (data.length > 0) {
            //     datas.push(data)
            // }
            // let mergedDatas = [].concat.apply([], datas);

            // let records = []
            // for (let row of mergedDatas) {
            //     let setNo = row[setColumn]
            //     let ipAddress = row[ipAddressColumn]
            //     let name = row[nameColumn]
            //     // let user = await User.findOne({ where: { ipAddress: ipAddress } })
            //     let data = {
            //         setNo: setNo,
            //         ipAddress: ipAddress,
            //         name: name,
            //         id: null
            //     }
            //     // if (user) {
            //     //     data.id = user.id
            //     // }
            //     records.push(data)
            // }
            const workbook = _xlsx.readFile(newPath);

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            const obj = _xlsx.utils.sheet_to_json(worksheet);

            let records = []
            for (let row of obj) {
                let data = {
                    setNo: row['Set'] || row['Set '],
                    ipAddress: row['IP Address'],
                    name: row['Name'],
                    id: null
                }
                records.push(data)
            }
            await sequelizeObj.transaction(async (t1) => {
                await User.destroy({
                    truncate: true
                })
                // await User.bulkCreate(records, {
                //     updateOnDuplicate: ['setNo', 'ipAddress', 'name'],
                // })
                await User.bulkCreate(records)
            })
            return res.json(utils.responseSuccess(true))
        } catch (err) {
            log.error(err);
            return res.json(utils.responseError(err.message))
        }
    });

    form.on('error', function (err) {
        log.error(err);
        return res.json(utils.responseError(err.message))
    });
}


/**
 * download activity data
 */
module.exports.DownloadActivityToExcel = async function (req, res) {
    try {
        let { activityId } = req.query
        let activity = await Activity.findByPk(activityId)
        let { createdAt, endTime, activityName } = activity

        let folderPath = path.join(downloadFolder, activityName);
        if (!fs.existsSync(folderPath)) {
            fs.mkdir(path.resolve(folderPath), { recursive: true }, (err) => {
                if (err) {
                    log.error(err)
                    return res.json(utils.responseError(`${downloadFolder} does not exist.`))
                }
            });
        }
        let deviceSelectionList = await DeviceSelection.findAll({
            where: {
                activityId: activityId
            }
        })

        let promiseWorks = []
        for (let deviceSelection of deviceSelectionList) {
            let { ipAddress, name } = deviceSelection
            promiseWorks.push(WriteParticipantData(activityId, createdAt, endTime, ipAddress, name, folderPath))
        }

        promiseWorks.push(WriteActivityData(activity, folderPath))
        promiseWorks.push(WriteSurveyData(deviceSelectionList, folderPath))

        let allResult = await Promise.all(promiseWorks)
        console.log(allResult)
        allResult.forEach((r, i) => {
            if (r.result == 0) {
                return res.json(utils.responseError("Download error!"))
            }
        })

        let zipName = `${activityName}.zip`
        let destZip = path.join(downloadFolder, zipName)
        destZip = utils.getSafePath(destZip)
        zipFolder(folderPath, destZip)
        res.set({
            'content-type': 'application/octet-stream',
            'content-disposition': 'attachment;filename=' + encodeURI(zipName)
        })
        deleteFolderRecursive(folderPath)
        fs.createReadStream(destZip).pipe(res)
    } catch (err) {
        log.error(err);
        return res.json(utils.responseError(err.message))
    }
}

const WriteParticipantData = function (activityId, createdAt, endTime, ipAddress, setName, folderPath) {
    return new Promise(async (resolve, reject) => {
        try {
            let datas = await sequelizeObj.query(
                `SELECT
                    mobileTime, tc, ts, hr, br, psi, lat, lng, deviceStatus
                FROM
                    data_history
                WHERE
                    activityId = ? 
                AND createdAt BETWEEN ? AND ?
                AND ipAddress = ? order by mobileTime asc`,
                {
                    replacements: [activityId, createdAt, endTime, ipAddress],
                    type: QueryTypes.SELECT
                }
            )
            let excelJson = []
            let title = ["Date", "Time", "Tc", "Ts", "HR", "BR", "PSI", "Lat", "Lon", "Equipment Status"]
            excelJson.push(title)
            datas.forEach((r, i) => {
                excelJson.push([
                    moment(r.mobileTime).format("DD/MM/YYYY"),
                    moment(r.mobileTime).format("HH:mm:ss"),
                    r.tc,
                    r.ts,
                    r.hr,
                    r.br,
                    r.psi,
                    r.lat,
                    r.lng,
                    r.deviceStatus
                ])
            })

            let filename = `${setName}.csv`
            let filepath = path.join(folderPath, filename)
            WriteDataIntoExcel(excelJson, filepath)
            resolve({ "result": 1 })
        } catch (ex) {
            log.error(ex)
            reject({ "result": 0 })
        }
    })
}

const WriteActivityData = function (activity, folderPath) {
    let startTime = moment(activity.startTime).format("YYYY-MM-DD HH:mm:ss")
    let endTime = moment(activity.endTime).format("YYYY-MM-DD HH:mm:ss")
    return new Promise(async (resolve, reject) => {
        try {
            let excelJson = [
                ["Activity Name:", activity.activityName],
                ["Location:", activity.location],
                ["Start Date and Time:", startTime],
                ["End Time:", endTime],
                ["Remarks:", activity.remarks],
                ["Core Temperature Threshold (Red):", activity.tcRedThreshold],
                ["Core Temperature Threshold (Amber):", activity.tcAmberThreshold],
                ["PSI Threshold (Red):", activity.psiRedThreshold],
                ["PSI Threshold (Amber):", activity.psiAmberThreshold],
                ["Algorithm Selection:", activity.algorithm],
            ]
            let filename = `Activity Details.csv`
            let filepath = path.join(folderPath, filename)
            WriteDataIntoExcel(excelJson, filepath)

            resolve({ "result": 1 })
        } catch (ex) {
            log.error(ex)
            reject({ "result": 0 })
        }
    })
}

const WriteSurveyData = function (deviceSelectionList, folderPath) {
    return new Promise(async (resolve, reject) => {
        try {
            let excelJson = [
                ["Name", "Borg RPE Scale", "ASHRAE 7 Scale"]
            ]
            deviceSelectionList.forEach((r, i) => {
                excelJson.push([
                    r.name,
                    r.question1 ? JSON.parse(r.question1).scoring : "",
                    r.question2 ? JSON.parse(r.question2).value : "",
                ])
            })
            let filename = `Survey Results.csv`
            let filepath = path.join(folderPath, filename)
            WriteDataIntoExcel(excelJson, filepath)

            resolve({ "result": 1 })
        } catch (ex) {
            log.error(ex)
            reject({ "result": 0 })
        }
    })
}

const zipFolder = function (sourceFolder, destZip) {
    var zip = new admZip();

    zip.addLocalFolder(sourceFolder);
    zip.writeZip(destZip);
}

function deleteFolderRecursive(folderPath) {
    folderPath = utils.getSafePath(folderPath)
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file) => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath);
    }
}
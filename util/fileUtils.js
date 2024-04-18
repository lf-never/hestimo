const log = require('../log/winston').logger('FileUtils');

const { openSync, closeSync, appendFileSync } = require('fs');
const fs = require('fs');

module.exports.checkFilePath = function (filePath) {
    if (!fs.existsSync(filePath)) fs.mkdirSync(filePath);
}
module.exports.checkFileExist = function (file) {
    return fs.existsSync(file);
}

module.exports.commonDeleteFiles = function (files) {
    try {
        for (let file of files) {
            fs.access(file, async function (err) {
                if (!err) {
                    fs.unlink(file, function () { })
                }
            })
        }
    } catch (error) {
        log.error(error)
        throw error
    }
}

module.exports.commonConvertBase642File = function (base64Data, filePath, fileName) {
    let fullPath = path.join(filePath, fileName);
    return fs.writeFileSync(fullPath, base64Data);
}

module.exports.commonConvertFile2Base64 = function (filePath, fileName) {
    let fullPath = path.join(filePath, fileName);
    return fs.readFileSync(fullPath, 'base64');
};

module.exports.commonAppendFile = function (filePath, fileName, dataList) {
    try {
        fd = openSync(filePath + '/' + fileName, 'a');
        for (let data of dataList) {
            appendFileSync(fd, JSON.stringify(data) + '\n', 'utf8');
        }
    } catch (error) {
        log.error(error)
        throw error
    } finally {
        if (fd !== undefined)
            closeSync(fd);
    }
};

module.exports.commonReadFile = function (filePath, fileName) {
    return new Promise((resolve, reject) => {
        try {
            let rl = readline.createInterface({
                input: fs.createReadStream(filePath + '/' + fileName)
            })
            let result = [];
            rl.on('line', line => {
                let data = JSON.parse(line);
                result.push(data)


            })
            rl.on('close', () => {
                log.warn(`End read deviceId: ${deviceId}, vehicleNo: ${vehicleNo}, count(${result.length}) (${moment().format('YYYY-MM-DD HH:mm:ss')})`)
                resolve(result);
            })
        } catch (error) {
            log.error(error)
            reject([])
        }
    })

};
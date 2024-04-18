const express = require('express');
const router = express.Router();
require('express-async-errors');

const indexService = require('../services/indexService');
const downloadService = require('../services/downloadService');
const utils = require('../util/utils.js');

router.get('/', utils.apiLimiter, (req, res) => {
    res.render('index');
});


router.post('/getDeviceSelection', indexService.GetDeviceSelection);
router.post('/getDeviceSelectionAll', indexService.GetDeviceSelectionAll);
router.post('/createActivity', indexService.CreateActivity);
router.post('/editActivity', indexService.EditActivity);
router.post('/getCurrentActivity', indexService.GetCurrentActivity);
router.post('/getTrainees', indexService.GetTrainees);
router.post('/endActivity', indexService.EndActivity);
router.post('/getPastAvtivitySelectForm', indexService.GetPastAvtivitySelectForm);
router.post('/getPastActivityBySelectActivityId', indexService.GetPastActivityBySelectActivityId);
router.post('/getPastActivityStatusData', indexService.GetPastActivityStatusData);
router.post('/getPastActivityChartData', indexService.GetPastActivityChartData);
router.post('/upload/device', downloadService.UploadDevice);
router.post('/submitSurvey', indexService.SubmitSurvey);
router.post('/deleteActivityById', indexService.DeleteActivityById);
router.post('/changeNameById', indexService.ChangeNameById);
router.post('/updateActivityThresholdSettings', indexService.UpdateActivityThresholdSettings);
router.post('/getThresholdSettings', indexService.GetThresholdSettings);

router.get('/download/deviceStatus', utils.apiLimiter, downloadService.ExportDataToExcel);
router.get('/download/activity', utils.apiLimiter, downloadService.DownloadActivityToExcel);

// Mobile
router.post('/uploadMobileData', indexService.UploadMobileData);
router.post('/getActivityByIPAddress', indexService.GetActivityByIPAddress)
router.post('/mobileConnection', indexService.MobileConnection)

module.exports = router;
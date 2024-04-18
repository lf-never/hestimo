const express = require('express');
const router = express.Router();
require('express-async-errors');

const indexService = require('../services/indexService');
const downloadService = require('../services/downloadService');
const utils = require('../util/utils.js');
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
	windowMs: 1 * 1000,
	max: 10000,
	message: "Too many requests from this client, please try again later.",
})
router.use(limiter)

router.get('/', (req, res) => {
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

router.get('/download/deviceStatus', downloadService.ExportDataToExcel);
router.get('/download/activity', downloadService.DownloadActivityToExcel);

// Mobile
router.post('/uploadMobileData', indexService.UploadMobileData);
router.post('/getActivityByIPAddress', indexService.GetActivityByIPAddress)
router.post('/mobileConnection', indexService.MobileConnection)

module.exports = router;

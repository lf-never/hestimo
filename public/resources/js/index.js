import * as MapUtil from '../scripts/common-map.js'
import * as MainUtil from './main.js'

var currentActivityId = null;
var frequency = 5000;
var trainees = []
var focusMarkerList = []
var nofocusMarkerList = []
var lastSelectMarker = null
var activeIpAddress = null
var nofocusMarkers = []

var thresholdSettingDefault = {
    cTempRedThreshold: 40.00,
    cTempAmberThreshold: 38.00,
    psiRedThreshold: 9.00,
    psiAmberThreshold: 7.00,
    // algorithm: 'Algorithm 1',
    alarmStatus: "1",
    psiEnable: "1",
    // password: '123456'
}
var chart;


$(function () {
    
    GetThresholdSettings()
    GetCurrentActivity()
    GetPastActivitySelectForm()
    $("#enablePSI").on('click', function () {
        let psiRedThresholdVal = $("#psiRedThresholdVal").text();
        let psiAmberThresholdVal = $("#psiAmberThresholdVal").text();
        if ($(this).prop("checked")) {
            InitPSISlider(psiRedThresholdVal, psiAmberThresholdVal, false)

        } else {
            InitPSISlider(psiRedThresholdVal, psiAmberThresholdVal, true)

        }
    })

    $('#btn-new-activity').on("click", function () {

        $('#newActivityToggle').modal("show");
        // console.log(currentActivity)
        if (currentActivity != null) {
            $('#activity-title').text(`Edit Activity (${currentActivity.activityName})`)
            $('#activityName').val(currentActivity.activityName)
            $('#activityName').attr('readonly', 'readonly')
            $('#location').val(currentActivity.location)
            $('#activityStartTime').val(moment(currentActivity.startTime).format('HH:mm'))
            $('#dateConducted').val(moment(currentActivity.startTime).format('YYYY-MM-DD'))
            $('#remarks').val(currentActivity.remarks)

            let rows = []
            currentActivity.deviceSelections.forEach((o, i) => {
                rows.push({
                    "index": i + 1, "setNo": o.setNo, "semId": o.semId ? o.semId : "-", "status": o.status, "ipAddress": o.ipAddress, "deviceStatus": o.deviceStatus, "name": o.name
                })
            })
            MainUtil.deviceTable.rows().remove().draw();
            MainUtil.deviceTable.rows.add(rows).draw();
        }
    });

    $("#btn-end-activity").on("click", function () {
        if (currentActivityId == null) {
            simplyAlert('No activity can end!', 'red')
            return
        }
        $('#endActivityToggle').modal("show");
    });

    $('#submit-device-selection').on('click', function () {
        let devices = []
        // $("#device-select-table input[name='checkbox']:checked").each(function () {
        //     let row = MainUtil.deviceSelectTable.row($(this).data("row")).data();
        //     devices.push(row)
        // })
        let deviceSelectTable = MainUtil.deviceSelectTable
        deviceSelectTable.rows().iterator('row', function (context, index) {
            let selectRow = deviceSelectTable.row(index).data();
            if (selectRow.checked) {
                devices.push(selectRow)
            }
        });
        // console.log(devices)
        if (devices.length > 0) {
            let rows = []
            devices.forEach((o, i) => {
                rows.push({
                    "index": i + 1, "setNo": o.setNo, "semId": o.semId, "status": o.status, "ipAddress": o.ipAddress, "deviceStatus": o.deviceStatus, "name": o.name
                })
            })
            MainUtil.deviceTable.rows().remove().draw();
            MainUtil.deviceTable.rows.add(rows).draw();
            $("#deviceSelectionToggle").modal("hide");
            $("#device-table .device-status-warning-hover").mouseenter(function () {
                $(this).next().show()
            });
            $("#device-table .device-status-warning-hover").mouseleave(function () {
                $(this).next().hide()
            });
        }
    })
    $('#btn-threshold-settings').on("click", function () {
        $('#newActivityToggle').modal("show");
        $('#thresholdSettingsToggle').modal("show");
        initActivitySettings()
    });
    $('#btn-submit-threshold').on("click", function () {
        let tcRedThreshold = $("#tcRedThresholdVal").text();
        let tcAmberThreshold = $("#tcAmberThresholdVal").text();
        let psiRedThreshold = $("#psiRedThresholdVal").text();
        let psiAmberThreshold = $("#psiAmberThresholdVal").text();
        if (Number(tcRedThreshold) <= Number(tcAmberThreshold) || Number(psiRedThreshold) <= Number(psiAmberThreshold)) {
            simplyAlert("Amber Threshold higher than Red Threshold. Please ensure Amber Threshold is lower than Red Threshold", 'red')
            return false
        }
        let algorithmSelection = $("#algorithmSelection").val()
        let alarmStatus = $("#alarmStatus").val()
        let psiEnable = $("#enablePSI").prop("checked") ? "1" : "0"

        if (currentActivity != null) {
            if (currentActivity.tcRedThreshold != tcRedThreshold
                || currentActivity.tcAmberThreshold != tcAmberThreshold
                || currentActivity.psiRedThreshold != psiRedThreshold
                || currentActivity.psiAmberThreshold != psiAmberThreshold
                || currentActivity.algorithm != algorithmSelection
                || currentActivity.alarmStatus != alarmStatus
                || currentActivity.psiEnable != psiEnable) {
                $('#passwordToggle').modal("show");
                return
            }
        } else {
            if (thresholdSettingDefault.cTempRedThreshold != tcRedThreshold
                || thresholdSettingDefault.cTempAmberThreshold != tcAmberThreshold
                || thresholdSettingDefault.psiRedThreshold != psiRedThreshold
                || thresholdSettingDefault.psiAmberThreshold != psiAmberThreshold
                || thresholdSettingDefault.algorithm != algorithmSelection
                || thresholdSettingDefault.alarmStatus != alarmStatus
                || thresholdSettingDefault.psiEnable != psiEnable) {
                $('#passwordToggle').modal("show");
                return
            }
        }

        $('#newActivityToggle').modal("show");
        $('#thresholdSettingsToggle').modal("hide");
    });

    $("#btn-pwd-cancel").on("click", function () {
        $('#passwordToggle').modal("hide");
        initActivitySettings()
    });
    $("#btn-pwd-confirm").on("click", function () {
        if ($("#password").val() != thresholdSettingDefault.password) {
            $("#pwdError").removeClass('hide')
        } else {
            ChangeThresholdSettings(function () {
                $('#passwordToggle').modal("hide");
                $('#newActivityToggle').modal("show");
                $('#thresholdSettingsToggle').modal("hide");
            })
        }
    });
    $("#submit-activity").on('click', function () {
        let activityName = $("#activityName").val()
        let location = $("#location").val()
        let activityStartTime = $("#activityStartTime").val()
        let dateConducted = $("#dateConducted").val()
        let remarks = $("#remarks").val()
        let deviceSelections = []

        let data = {
            activityName, location, activityStartTime, dateConducted, remarks
        }
        let errorLabel = {
            activityName: 'Activity Name', location: 'Location', activityStartTime: 'Activity Start Time', dateConducted: 'Date Conducted', remarks: 'Remarks'
        }
        for (let key in data) {
            if (key == 'remarks') {
                continue
            }
            if (data[key] == "") {
                simplyAlert(errorLabel[key] + " is required.", 'red')
                return false
            }
        }

        if (MainUtil.deviceTable.data().length == 0) {
            simplyAlert("Please choose participant!", 'red')
            return false
        }
        let tableData = MainUtil.deviceTable.data()
        for (let i = 0; i < MainUtil.deviceTable.data().length; i++) {
            deviceSelections.push(tableData[i])
        }
        // console.log(deviceSelections)

        let tcRedThreshold = $("#tcRedThresholdVal").text();
        let tcAmberThreshold = $("#tcAmberThresholdVal").text();
        let psiRedThreshold = $("#psiRedThresholdVal").text();
        let psiAmberThreshold = $("#psiAmberThresholdVal").text();

        let algorithmSelection = $("#algorithmSelection").val()
        let alarmStatus = $("#alarmStatus").val()
        let psiEnable = $("#enablePSI").prop("checked") ? "1" : "0"
        let threshold = { tcRedThreshold, tcAmberThreshold, psiRedThreshold, psiAmberThreshold, algorithmSelection, alarmStatus, psiEnable }
        console.log(threshold)
        for (let key in threshold) {
            if (threshold[key] == "") {
                simplyAlert("Threshold Settings is required.", 'red')
                return false
            }
        }
        if (Number(tcRedThreshold) <= Number(tcAmberThreshold) || Number(psiRedThreshold) <= Number(psiAmberThreshold)) {
            simplyAlert("Amber Threshold higher than Red Threshold. Please ensure Amber Threshold is lower than Red Threshold", 'red')
            return false
        }
        data.deviceSelections = deviceSelections
        data.threshold = threshold
        data.startTime = dateConducted + " " + activityStartTime
        console.log(data)
        if (currentActivity == null) {
            axios.post('/createActivity', data).then(result => {
                if (result.data.code == 0) {
                    simplyAlert(result.data.msg, 'red')
                    return
                } else {
                    simplyConfirm("Activity start success.", function () {
                        window.location.reload()
                    })
                }
            });
        }
        else {
            axios.post('/editActivity', data).then(result => {
                if (result.data.code == 0) {
                    simplyAlert(result.data.msg, 'red')
                    return
                } else {
                    simplyConfirm("Activity start success.", function () {
                        window.location.reload()
                    })
                }
            });
        }
    })

    $("#submit-end-activity").on('click', function () {
        if (currentActivityId != null) {
            axios.post('/endActivity', { currentActivityId }).then(result => {
                if (result.data.code == 0) {
                    simplyAlert(result.data.msg, 'red')
                    return
                } else {
                    simplyConfirm("Activity end success.", function () {
                        window.location.reload()
                    })
                }
            });
        }
    })

    $("#showAll").on('click', function () {
        if ($(this).prop("checked")) {
            $(".map-custom-control").each(function (e) {
                $(this).addClass("active")
            })
        } else {
            $(".map-custom-control").each(function (e) {
                $(this).removeClass("active")
            })
        }
        showIconOnMap(trainees)
    })
    $(".map-custom-control").on('click', function () {
        $(this).toggleClass("active")
        let checkAll = true
        $(".map-custom-control").each(function (e) {
            if (!$(this).hasClass("active")) {
                checkAll = false
            }
        })
        $("#showAll").prop("checked", checkAll)

        showIconOnMap(trainees)
    })

    $("#btn-upload").on('click', function () {
        if (currentActivity != null) {
            simplyAlert("Activity start cannot upload device.", "red");
            return
        }
        $('#upload-device-input').val('')
        $('#upload-device-input').trigger('click')
    })
    $('#upload-device-input').on('change', async function () {
        const file = $(this)[0].files[0];
        const filename = file.name
        var extStart = filename.lastIndexOf(".");
        var ext = filename.substring(extStart, filename.length);
        if (ext != ".xlsx") {
            simplyAlert("Only supports uploading xlsx.", "red");
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('filename', filename);

        const response = await fetch('upload/device', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json()
            if (data.code == 1) {
                MainUtil.deviceStatusTable.ajax.reload(null, true)
                simplyAlert("Upload success");
            } else {
                simplyAlert(data.msg, "red");
            }
            return
        }
        simplyAlert("Upload failed", "red");
    })

    $("#btn-download-activity").on("click", function () {
        let selectActivityId = $('#selectActivity').attr("data-id")
        if (selectActivityId == 0) {
            return
        }
        let text = $("#selectActivity option[selected]").text();
        simplyDialog(`Are you sure to download activity ${text}?`, function () {
            axios.get('/download/activity', { params: { activityId: selectActivityId }, responseType: 'blob' }).then(async result => {
                if (result.data.code == 0) {
                    simplyAlert("Download failed", "red");
                    return
                }
                downloadFile(result)
            })
        })
    });

    $("#btn-delete-activity").on("click", function () {
        let selectActivityId = $('#selectActivity').attr("data-id")
        if (selectActivityId == 0) {
            return
        }
        let text = $("#selectActivity option[selected]").text();
        simplyDialog(`Are you sure to delete activity ${text}?`, function () {
            axios.post('/deleteActivityById', { activityId: selectActivityId }).then(async result => {
                if (result.data.code == 0) {
                    simplyAlert("Delete failed", "red");
                    return
                }
                GetPastActivitySelectForm()
                $("#highestTc, #avgTc, #highestPSI, #avgPSI").text("0")
                $("#tcStatusGreen").text("0/0")
                $("#tcStatusAmber").text("0/0")
                $("#tcStatusRed").text("0/0")
                $("#psiStatusGreen").text("0/0")
                $("#psiStatusAmber").text("0/0")
                $("#psiStatusRed").text("0/0")
                $('#past-activity-table').DataTable().clear().draw();
            })
        })
    });
});

function simplyAlert(content, type) {
    $.alert({
        title: 'Alert',
        content: content,
        type: type ? type : 'green',
    });
}

function simplyConfirm(content, callback) {
    $.confirm({
        title: 'Confirm',
        content: content,
        type: 'green',
        buttons: {
            ok: {
                action: function () {
                    return callback()
                },
            },
        },
    });
}

function simplyDialog(content, callback) {
    $.confirm({
        title: 'Confirm',
        content: content,
        type: 'green',
        buttons: {
            cancel: {
                btnClass: 'text-capitalize btn-secondary',
                action: function () {

                }
            },
            confirm: {
                btnClass: 'text-capitalize btn-success',
                action: function () {
                    return callback()
                },
            },
        },
    });
}

function initActivitySettings() {
    if (currentActivity != null) {
        $("#algorithmSelection").val(currentActivity.algorithm)
        $("#alarmStatus").val(currentActivity.alarmStatus)

        let isEnable = currentActivity.psiEnable == 1
        $("#enablePSI").prop("checked", isEnable);

        InitTcSlider(currentActivity.tcRedThreshold, currentActivity.tcAmberThreshold)
        InitPSISlider(currentActivity.psiRedThreshold, currentActivity.psiAmberThreshold, !isEnable)
        $("#tcRedThresholdVal").text(currentActivity.tcRedThreshold);
        $("#tcAmberThresholdVal").text(currentActivity.tcAmberThreshold);
        $("#psiRedThresholdVal").text(currentActivity.psiRedThreshold);
        $("#psiAmberThresholdVal").text(currentActivity.psiAmberThreshold);
    } else {
        $("#algorithmSelection").val(thresholdSettingDefault.algorithm)
        $("#alarmStatus").val(thresholdSettingDefault.alarmStatus)

        InitTcSlider(thresholdSettingDefault.cTempRedThreshold, thresholdSettingDefault.cTempAmberThreshold)
        InitPSISlider(thresholdSettingDefault.psiRedThreshold, thresholdSettingDefault.psiAmberThreshold, false)

        $("#tcRedThresholdVal").text(thresholdSettingDefault.cTempRedThreshold);
        $("#tcAmberThresholdVal").text(thresholdSettingDefault.cTempAmberThreshold);
        $("#psiRedThresholdVal").text(thresholdSettingDefault.psiRedThreshold);
        $("#psiAmberThresholdVal").text(thresholdSettingDefault.psiAmberThreshold);
    }
}

const GetThresholdSettings = function () {
    axios.post('/getThresholdSettings').then(async result => {
        if (result.data.code == 0) {
            simplyAlert(result.data.msg, "red");
            return
        }
        let data = result.data.data
        thresholdSettingDefault.password = data.password
        let jsonObj = data.algorithm
        let defaultAlgorithm = Object.keys(jsonObj)[0]
        let html = ""
        for (let key in jsonObj) {
            html += `<option value="${key}">${jsonObj[key]}</option>`
        }
        $("#algorithmSelection").html(DOMPurify.sanitize(html))
        thresholdSettingDefault.algorithm = defaultAlgorithm
    });
}

const GetCurrentActivity = function () {
    axios.post('/getCurrentActivity').then(async result => {
        let data = result.data.data
        if (!data) {
            return
        }
        currentActivity = data
        initActivitySettings()
        if (data.activityStatus == "Start") {
            $("#btn-new-activity").text('Edit Activity')
            let createdAt = data.createdAt
            currentActivityId = data.id
            $("#currentActivityName").text(data.activityName)
            $("#currentAlgorithm").text(data.algorithmName)
            setInterval(function () {
                let now = moment()
                let h = moment(now).diff(moment(createdAt), 'hours')
                let subNow = moment(now).subtract(h, 'h')
                let m = moment(subNow).diff(moment(createdAt), 'minute')
                $("#currentHour").text(h)
                $("#currentMin").text(m)
            }, 1000)
            setInterval(function () {
                refreshTrainees()
            }, frequency)
            await GetTrainees(false, false, [4, 3, 2, 1])
        }
    });
}



const panToMap = function (e, lat, lng, ipAddress) {
    if (lat && lng) {
        let focusMarker = focusMarkerList.find(a => a.id == ipAddress)
        if (lastSelectMarker) {
            let nofocusMarker = nofocusMarkerList.find(a => a.id == lastSelectMarker.id)
            MapUtil.updateDrawCircle(nofocusMarker)
        }
        if (focusMarker) {
            MapUtil.panTo(lat, lng, 17)
            lastSelectMarker = focusMarker
            MapUtil.updateDrawCircle(focusMarker)
        }
        activeIpAddress = ipAddress
        $('.trainee-card').removeClass('active')
        if (lastSelectMarker) {
            $(e).find('.trainee-card').toggleClass('active')
        }
    }
}

const lockMarker = function () {
    if (lastSelectMarker) {
        MapUtil.panTo(lastSelectMarker.lat, lastSelectMarker.lng)
        MapUtil.updateDrawCircle(lastSelectMarker)
    }
}

const unlockMarker = function () {
    if (lastSelectMarker) {
        let nofocusMarker = nofocusMarkerList.find(a => a.id == lastSelectMarker.id)
        MapUtil.updateDrawCircle(nofocusMarker)
        activeIpAddress = null
        lastSelectMarker = null
        $('.trainee-card').removeClass('active')
    }
}

const tempWariningIcon = `<img class="icon-wh warning-icon" src="../images/warning.svg">`;
const tempWariningBlackIcon = `<img class="icon-wh warning-icon" src="../images/warning black.svg">`;

const tempWariningDiv = `<div class="warning-hover">
<div class="row h-100 align-items-center" style="overflow-y: auto;">
    <div class="col-auto ms-2 mb-1">
        <img class="icon-wh" src="../images/warning.svg">
    </div>
    <div class="col ms-2">
        <div>
            <span class="text-danger">{{msg}}</span>
        </div>
    </div>
    <div class="col-12 pe-2">
        <div class="float-end">
            <span class="text-dark">{{time}}</span>
        </div>
    </div>
</div>
</div>`;

const temp = `<div class="col trainee-container" data-status="{{bg}}" data-id="{{id}}" data-tc="{{tc1}}" {{style}} data-lat="{{lat}}" data-lng="{{lng}}" data-ip="{{ipAddress}}">
                <div class="trainee-card {{active}} {{recovered}}">
                    <div class="trainee-card-top background-{{bg}}">
                        <span data-ip="{{ipAddress}}">{{Trainee}}</span>
                        {{warningIcon}}
                    </div>
                    <div class="trainee-card-content content-1 {{contentClass1}}">
                        <div class="row h-100 align-items-center text-center">
                            <div class="col-5 align-self-center">
                                <div class="d-inline-flex">
                                    <img class="icon-wh me-2 mt-1" src="../images/Core Temperature.svg">
                                    <span class="ft-24">{{tc}}</span>
                                </div>
                            </div>
                            <div class="col-2">
                                <div class="vr"></div>
                            </div>
                            <div class="col-5">
                                <div class="d-inline-flex">
                                    <img class="icon-wh me-2 mt-1" src="../images/psi.svg">
                                    <span class="ft-24">{{psi}}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="trainee-card-content content-2 {{contentClass2}}" style="height: 130px;">
                        <div class="row h-100 align-items-center text-center">
                            <div class="col-6">
                                <div><img class="icon-wh my-1 {{hr-low}}" src="../images/Heart Rate.svg"></div>
                                <div><span class="ft-24">{{hr}}</span></div>
                            </div>
                            <div class="col-6">
                                <div><img class="icon-wh my-1" src="../images/Breathing Rate.svg"></div>
                                <div><span class="ft-24">{{br}}</span></div>
                            </div>
                            <div class="col-6">
                                <div><img class="icon-wh my-1" src="../images/Core Temperature.svg"></div>
                                <div><span class="ft-24">{{tc}}</span></div>
                            </div>
                            <div class="col-6">
                                <div><img class="icon-wh my-1" src="../images/psi.svg"></div>
                                <div><span class="ft-24">{{psi}}</span></div>
                            </div>
                        </div>
                    </div>
                    {{warningDiv}}
                </div>
            </div>`;

const GetTrainees = async function (isRefresh, more, activeStatus) {
    await axios.post('/getTrainees', { currentActivityId }).then(result => {
        let data = result.data.data
        trainees = data.users
        if (trainees.length == 0) {
            return
        }

        let { redNumber, amberNumber, greenNumber, whiteNumber, total } = data.traineeNumber
        $("#red").text(redNumber)
        $("#amber").text(amberNumber)
        $("#green").text(greenNumber)
        $("#white").text(whiteNumber)
        $(".total").text(total)
        $("#online").text((total - whiteNumber) + "/" + total)

        $("#green-number").text(greenNumber + "/" + total)
        $("#yellow-number").text(amberNumber + "/" + total)
        $("#red-number").text(redNumber + "/" + total)
        $("#white-number").text(whiteNumber + "/" + total)

        for (let item of trainees) {
            let { id, name, psi, tc, hr, br, deviceStatus, status, lat, lng, ipAddress, updatedAt, isRecovered, hrConfidence, thresholdAlert, warningTime, order } = item
            let icon = ""
            let warningMsg = ""
            if (status == 2 && deviceStatus == "Phone Disconnected") {
                icon = tempWariningIcon
                warningMsg = tempWariningDiv.replace("{{msg}}", deviceStatus)
                    .replace("{{time}}", moment(updatedAt).format("HH:mm"))
            } else if (deviceStatus) {
                icon = tempWariningIcon
                let msg = deviceStatus
                if (deviceStatus.indexOf(",") != -1) {
                    msg = deviceStatus.replaceAll(",", "<br>")
                }
                warningMsg = tempWariningDiv.replace("{{msg}}", msg)
                    .replace("{{time}}", moment(warningTime).format("HH:mm"))
            }
            if (icon != "" && thresholdAlert == "Red") {
                icon = tempWariningBlackIcon
            }
            let traineeHtml = temp.replaceAll("{{Trainee}}", name)
                .replaceAll("{{tc}}", tc ? tc : "-")
                .replaceAll("{{psi}}", psi ? psi : "-")
                .replaceAll("{{hr}}", hr ? hr : "-")
                .replaceAll("{{br}}", br ? br : "-")
                .replaceAll("{{warningIcon}}", icon)
                .replaceAll("{{warningDiv}}", warningMsg)
                .replaceAll("{{bg}}", status)
                .replaceAll("{{lat}}", lat)
                .replaceAll("{{lng}}", lng)
                .replaceAll("{{ipAddress}}", ipAddress)
                .replaceAll("{{id}}", id)
                .replaceAll("{{tc1}}", tc ? tc : "0")
            if (more) {
                traineeHtml = traineeHtml.replaceAll("{{contentClass1}}", "content-more")
                    .replaceAll("{{contentClass2}}", "content-less")
            } else {
                traineeHtml = traineeHtml.replaceAll("{{contentClass1}}", "content-less")
                    .replaceAll("{{contentClass2}}", "content-more")
            }

            if (activeStatus.length > 0 && activeStatus.indexOf(status) == -1) {
                traineeHtml = traineeHtml.replaceAll("{{style}}", `style='display: none; order: ${order}'`)
            } else {
                traineeHtml = traineeHtml.replaceAll("{{style}}", `style='order: ${order}'`)
            }

            if (activeIpAddress == ipAddress) {
                traineeHtml = traineeHtml.replaceAll("{{active}}", "active")
            }

            if (isRecovered) {
                traineeHtml = traineeHtml.replaceAll("{{recovered}}", "recovered")
            } else {
                traineeHtml = traineeHtml.replaceAll("{{recovered}}", "")
            }

            if (hrConfidence && hrConfidence.toLowerCase() == "low") {
                traineeHtml = traineeHtml.replaceAll("{{hr-low}}", "hr-low")
            } else {
                traineeHtml = traineeHtml.replaceAll("{{hr-low}}", "")
            }

            if (!isRefresh) {
                $("#trainee-detail").append(DOMPurify.sanitize(traineeHtml))
            } else {
                $("#trainee-detail").find(".trainee-card-top").each(function (i, e) {
                    let ip = $(e).find("span").attr("data-ip")
                    // let text = $(e).find("span").text()
                    if (ip == ipAddress) {
                        $(e).closest('.col').replaceWith(DOMPurify.sanitize(traineeHtml))
                    }
                })
            }

            $(".trainee-container").off('click').on('click', function(){
                let lat = $(this).attr('data-lat')
                let lng = $(this).attr('data-lng')
                let ipAddress = $(this).attr('data-ip')
                panToMap(this, lat, lng, ipAddress)
            })
        }

        // sortList()
        $(".warning-icon").mouseenter(function () {
            $(this).parent().parent().find('.warning-hover').show()
        })
        $(".warning-icon").mouseleave(function () {
            // $(this).parent().parent().find('.warning-hover').hide()
        })
        showIconOnMap(trainees)
        lockMarker()
    });
}

const refreshTrainees = async function () {
    let more = true
    if ($("#btn-view-less").hasClass('link-success')) {
        more = false
    }

    let activeStatus = []
    $("#nav-card-list").find(".nav-card.active").each(function (i, e) {
        let status = $(e).attr("data-status")
        activeStatus.push(Number((status)))
    })
    await GetTrainees(true, more, activeStatus)
}



const GetPastActivitySelectForm = function () {
    $('#selectActivity').attr("data-id", "")
    $("#selectActivity").val("")

    axios.post('/getPastAvtivitySelectForm').then(result => {
        $("#dropdown-activity").empty()
        let data = result.data.data
        if (data.length == 0) {
            return
        }
        let html = data.map(o => {
            return `<li><a class="dropdown-item" href="#" data-id="${o.id}">${o.activityName}</a></li>`
        }).join('')
        $("#dropdown-activity").html(DOMPurify.sanitize(html))

        $("#dropdown-activity li").off('click').on('click', function () {
            let text = $(this).find('a').text()
            let id = $(this).find('a').attr("data-id")
            $("#selectActivity").val(text)
            $("#selectActivity").attr("data-id", id)

            MainUtil.reloadPastActivityTable()
            GetPastActivityStatusData()
            if (chart && chart.series.length > 0) {
                chart.series[0].remove();
                chart.series[0].remove();
            }
        })
    });
}

const GetPastActivityStatusData = function () {
    axios.post('/getPastActivityStatusData', { selectActivityId: $('#selectActivity').attr("data-id") }).then(result => {
        let data = result.data.data
        let total = data.total
        $("#highestTc").text(data.highestTc)
        $("#avgTc").text(data.avgTc)
        $("#highestPSI").text(data.highestPSI)
        $("#avgPSI").text(data.avgPSI)
        $("#tcStatusGreen").text(data.tcGreen + "/" + total)
        $("#tcStatusAmber").text(data.tcAmber + "/" + total)
        $("#tcStatusRed").text(data.tcRed + "/" + total)
        $("#psiStatusGreen").text(data.psiGreen + "/" + total)
        $("#psiStatusAmber").text(data.psiAmber + "/" + total)
        $("#psiStatusRed").text(data.psiRed + "/" + total)
        $("#selectActivityDate").text(data.date)
    })
}

export const InitChart = function (name, data, aver, highest, lowest, scatterData, redThreshold, amberThreshold) {
    console.time("InitChart")
    let plotLines = [{
        width: 1,
        value: highest,
        dashStyle: 'Dash',
        label: {
            text: 'Highest',
            style: {
                color: '#fff'
            }
        }
    }, {
        width: 1,
        value: aver,
        dashStyle: 'Dash',
        label: {
            text: 'Aver',
            style: {
                color: '#fff'
            }
        }
    }, {
        width: 1,
        value: lowest,
        dashStyle: 'Dash',
        label: {
            text: 'Lowest',
            style: {
                color: '#fff'
            }
        }
    }]
    if (redThreshold) {
        plotLines.push({
            width: 1,
            value: redThreshold,
            dashStyle: 'Dash',
            label: {
                text: '',
                style: {
                    color: '#FC545D'
                }
            }
        })
    }
    if (amberThreshold) {
        plotLines.push({
            width: 1,
            value: amberThreshold,
            dashStyle: 'Dash',
            label: {
                text: '',
                style: {
                    color: '#FDD83C'
                }
            }
        })
    }
    let config = {
        chart: {
            //styledMode: true,
            type: 'line',
        },
        boost: {
            useGPUTranslations: true
        },
        credits: {
            enabled: false
        },
        title: {
            text: ''
        },
        subtitle: {
            text: ''
        },
        legend: {
            enabled: false
        },
        xAxis: {
            className: "highcharts-color-1",
            title: {
                text: 'Time Elapsed (Min)'
            },
            type: 'datetime',
            dateTimeLabelFormats: {
                millisecond: '%H:%M',
                second: '%H:%M',
                minute: '%H:%M',
                hour: '%H:%M',
                day: '%H:%M',
                week: '%H:%M',
                month: '%H:%M',
                year: '%H:%M'
            },
            tickInterval: 5 * 60 * 1000,
        },
        yAxis: {
            // className: "highcharts-color-0",
            title: {
                text: name
            },
            gridLineWidth: 0,
            plotLines: plotLines
        },
        tooltip: {
            pointFormat: `${name}: {point.y}`,
            shared: true,
            dateTimeLabelFormats: {
                millisecond: '%H:%M:%S',
                second: '%H:%M:%S',
                minute: '%H:%M:%S',
                hour: '%H:%M:%S',
                day: '%H:%M:%S',
                week: '%H:%M:%S',
                month: '%H:%M:%S',
                year: '%H:%M:%S'
            },
            style: {
                fontSize: '16px',
                fontWeight: 'bold'
            }
        },
        plotOptions: {
            line: {
                lineWidth: 4,
                dataLabels: {
                    enabled: false
                },
                enableMouseTracking: true
            }
        },
        series: [
            {
                name: name,
                data: data,
                lineColor: '#2B69A6',
                color: Highcharts.getOptions().colors[2],
                marker: {
                    enabled: false
                },
            },
            {
                name: name,
                type: 'scatter',
                data: scatterData,
                marker: {
                    radius: 6,
                }
            }
        ]
    }
    chart = Highcharts.chart('container', config);
    console.timeEnd("InitChart")
}

const showIconOnMap = function (datas) {
    let statusArr = []
    $(".map-custom-control.active").each(function (e) {
        statusArr.push(Number($(this).attr("data-status")))
    })
    if (statusArr.length > 0) {
        datas = datas.filter(a => statusArr.indexOf(a.status) != -1)
    } else {
        datas = []
    }
    var markerList = []
    var focusMarkers = []
    nofocusMarkers = []
    for (let row of datas) {
        let iconColor = "#78DE32"
        if (row.status == 4) {
            iconColor = "#FC545D"
        } else if (row.status == 3) {
            iconColor = "#FDD83C"
        } else if (row.status == 2) {
            iconColor = "#fff"
        }
        if (row.lat && row.lng) {
            let marker = GetMarker(row, '#000', iconColor)
            let focusMarker = GetMarker(row, '#0070C0', iconColor)
            if (lastSelectMarker && lastSelectMarker.id == row.ipAddress) {
                markerList.push(focusMarker)
                lastSelectMarker = focusMarker
            } else {
                markerList.push(marker)
            }
            focusMarkers.push(focusMarker)
            nofocusMarkers.push(marker)
        }
    }
    focusMarkerList = focusMarkers
    nofocusMarkerList = nofocusMarkers
    MapUtil.addLayerGroup(markerList)
}

const GetMarker = function (row, color, iconColor) {
    let marker = MapUtil.drawCircle({ lat: row.lat, lng: row.lng }, color, iconColor)
    marker.id = row.ipAddress
    marker.lat = row.lat
    marker.lng = row.lng
    marker.status = row.status
    let popupHtml = `<b>${row.name}</b><br>`
    if (row.deviceStatus) {
        popupHtml += row.deviceStatus
    }
    MapUtil.bindPopup(marker, popupHtml)
    return marker
}

export var currentActivity
export const unlockMarkerUtil = unlockMarker

const InitTcSlider = function (tcRedThresholdVal, tcAmberThresholdVal) {
    tcRedThresholdVal = tcRedThresholdVal * 10
    tcAmberThresholdVal = tcAmberThresholdVal * 10

    layui.use('slider', function () {
        var $ = layui.$, slider = layui.slider;
        slider.render({
            min: 370,
            max: 420,
            tips: false,
            elem: '#tcRedThreshold',
            theme: '#FC545D',
            value: tcRedThresholdVal,
            change: function (vals) {
                $("#tcRedThresholdVal").text(vals / 10);
            }
        });

        slider.render({
            min: 370,
            max: 420,
            tips: false,
            elem: '#tcAmberThreshold',
            theme: '#FDD83C',
            value: tcAmberThresholdVal,
            change: function (vals) {
                $("#tcAmberThresholdVal").text(vals / 10);
            }
        });
    })
}

const InitPSISlider = function (psiRedThresholdVal, psiAmberThresholdVal, disabled) {
    psiRedThresholdVal = psiRedThresholdVal * 10
    psiAmberThresholdVal = psiAmberThresholdVal * 10

    layui.use('slider', function () {
        var $ = layui.$, slider = layui.slider;
        slider.render({
            min: 0,
            max: 100,
            tips: false,
            elem: '#psiRedThreshold',
            theme: '#FC545D',
            value: psiRedThresholdVal,
            disabled: disabled,
            change: function (vals) {
                $("#psiRedThresholdVal").text(vals / 10);
            }
        });

        slider.render({
            min: 0,
            max: 100,
            tips: false,
            elem: '#psiAmberThreshold',
            theme: '#FDD83C',
            value: psiAmberThresholdVal,
            disabled: disabled,
            change: function (vals) {
                $("#psiAmberThresholdVal").text(vals / 10);
            }
        });

    })
}

const ChangeThresholdSettings = function (callback) {
    let tcRedThreshold = $("#tcRedThresholdVal").text();
    let tcAmberThreshold = $("#tcAmberThresholdVal").text();
    let psiRedThreshold = $("#psiRedThresholdVal").text();
    let psiAmberThreshold = $("#psiAmberThresholdVal").text();

    let algorithmSelection = $("#algorithmSelection").val()
    let alarmStatus = $("#alarmStatus").val()
    let psiEnable = $("#enablePSI").prop("checked") ? "1" : "0"
    let threshold = { tcRedThreshold, tcAmberThreshold, psiRedThreshold, psiAmberThreshold, algorithmSelection, alarmStatus, psiEnable }

    thresholdSettingDefault.cTempRedThreshold = tcRedThreshold
    thresholdSettingDefault.cTempAmberThreshold = tcAmberThreshold
    thresholdSettingDefault.psiRedThreshold = psiRedThreshold
    thresholdSettingDefault.psiAmberThreshold = psiAmberThreshold
    thresholdSettingDefault.algorithm = algorithmSelection
    thresholdSettingDefault.alarmStatus = alarmStatus
    thresholdSettingDefault.psiEnable = psiEnable
    if (currentActivity) {
        threshold.activityId = currentActivity.id
        axios.post('/updateActivityThresholdSettings', threshold).then(result => {
            if (result.data.code == 0) {
                simplyAlert(result.data.msg, 'red')
                return
            } else {
                axios.post('/getCurrentActivity').then(async result => {
                    currentActivity = result.data.data
                    initActivitySettings()
                });
                return callback()
            }
        });
    }
    return callback()
}
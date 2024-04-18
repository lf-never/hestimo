import * as MapUtil from '../scripts/common-map.js'
import * as IndexUtil from './index.js'
var newActivityToggle = document.getElementById('newActivityToggle')

var deviceSelectionToggle = document.getElementById('deviceSelectionToggle')

var deviceStatusToggle = document.getElementById('deviceStatusToggle')

var viewPastActivityToggle = document.getElementById('viewPastActivityToggle')

var passwordToggle = document.getElementById('passwordToggle')

var chartData;
var changeId;
var deviceStatusInterval;
var deviceTableInterval;
var deviceStatusFrequency = 5000;

$(function () {
    $("#btn-legend").on('click', function () {
        $(".map-legend").toggleClass("legend-expand")
    })

    $(".warning-icon").mouseenter(function () {
        $(this).parent().parent().find('.warning-hover').show()
    })
    $(".warning-icon").mouseleave(function () {
        $(this).parent().parent().find('.warning-hover').hide()
    })

    $("#btn-view-less").on('click', function () {
        if ($(this).hasClass('link-success')) {
            $(this).removeClass('link-success')
            $(this).addClass('link-secondary')

            $(".content-1").removeClass('content-less')
            $(".content-1").addClass('content-more')
            $(".content-2").removeClass('content-more')
            $(".content-2").addClass('content-less')

        } else {
            $(this).removeClass('link-secondary')
            $(this).addClass('link-success')

            $(".content-1").addClass('content-less')
            $(".content-1").removeClass('content-more')
            $(".content-2").addClass('content-more')
            $(".content-2").removeClass('content-less')
        }
    })
    $(".map-expand").on('click', function () {
        $(this).toggleClass('active')
        $("#map-container").toggleClass('w-100')
        MapUtil.resize();
    })
    $("#expand-list").on('click', function () {
        $(this).toggleClass('active')
        $("#list-container").toggleClass('expand-list-container')
        if ($("#list-container").hasClass('expand-list-container')) {
            $("#trainee-detail").removeClass('row-cols-xxl-3 row-cols-xl-2 row-cols-sm-1')
            $("#trainee-detail").addClass('row-cols-xxl-6 row-cols-xl-5 row-cols-lg-4 row-cols-md-3 row-cols-sm-2')
        } else {
            $("#trainee-detail").addClass('row-cols-xxl-3 row-cols-xl-2 row-cols-sm-1')
            $("#trainee-detail").removeClass('row-cols-xxl-6 row-cols-xl-5 row-cols-lg-4 row-cols-md-3 row-cols-sm-2')
        }
    })
    $(".nav-card").on('click', function () {
        if (!$(this).hasClass('active')) {
            $(this).addClass('active')
        } else {
            $(this).removeClass('active')
        }
        let activeStatus = []
        $("#nav-card-list").find(".nav-card.active").each(function (i, e) {
            let status = $(e).attr("data-status")
            activeStatus.push(status)
        })

        $("#trainee-detail").find(".trainee-card").parent().each(function (i, e) {
            let status = $(e).attr("data-status")
            if (activeStatus.indexOf(status) != -1 || activeStatus.length == 0) {
                $(e).show()
            } else {
                $(e).hide()
            }
        })
    })

    newActivityToggle.addEventListener('hidden.bs.modal', function (event) {
        deviceTable.rows().remove().draw();
        clearInterval(deviceTableInterval)
        $("#newActivityToggle").modal("dispose");
    })
    newActivityToggle.addEventListener('show.bs.modal', function (event) {
        let time = moment().format("HH:mm")
        let date = moment().format("YYYY-MM-DD")
        $("#activityStartTime").val(time)
        $("#dateConducted").val(date)
        deviceTable = $('#device-table').DataTable({
            "ordering": false,
            "searching": false,
            "paging": true,
            "autoWidth": false,
            "processing": true,
            "serverSide": false,
            "destroy": true,
            "language": PageHelper.language(),
            "lengthMenu": PageHelper.lengthMenu(),
            "dom": PageHelper.dom(),
            "pageLength": PageHelper.pageLength(),
            "columnDefs": [
                {
                    "targets": [1, 2, 3],
                    "createdCell": function (td, cellData, rowData, row, col) {
                        if (!cellData) {
                            $(td).html('-');
                        }
                    }
                },
            ],
            "drawCallback": function (settings, json) {
                $("#device-table .device-status-warning-hover").mouseenter(function () {
                    $(this).next().show()
                });
                $("#device-table .device-status-warning-hover").mouseleave(function () {
                    $(this).next().hide()
                });
            },
            "columns": [
                {
                    "data": "index", "title": "S/N"
                },
                {
                    "data": "setNo", "title": "Set No."
                },
                {
                    "data": "ipAddress", "title": "IP Address"
                },
                {
                    "data": "semId", "title": "SEM ID",
                },
                {
                    // "width": "90px",
                    "className": "text-start",
                    "data": "status", "title": "Status",
                    "render": function (data, type, full, meta) {
                        if (data == "Green") {
                            return `<div class="div-status"><div class="div-green"></div></div>`
                        } else if (data == "White") {
                            return `<div class="div-status"><div class="div-white"></div>
                            <img class="icon-wh device-status-warning-hover" role="button" src="../images/warning.svg" style="margin-left: 5px;">
                                        <div class="device-status-warning-div">
                                            <span>${full.deviceStatus}</span>
                                        </div>
                                        </div>`
                        } else {
                            return `<div class="div-status"><div class="div-amber"></div>
                                <img class="icon-wh device-status-warning-hover" role="button" src="../images/warning.svg" style="margin-left: 15px;">
                                <div class="device-status-warning-div">
                                    <span>${full.deviceStatus}</span>
                                </div>
                            </div>`
                        }
                    }
                },
            ]
        });
        
        deviceTableInterval = setInterval(async function () {
            const response = await fetch('getDeviceSelectionAll', {
                method: 'POST',
            });

            if (response.ok) {
                const data = await response.json()
                if (data.code == 1) {
                    let result = data.data
                    if (result) {
                        let i = 0
                        deviceTable.rows().iterator('row', function (context, index) {
                            let rowData = deviceTable.row(index).data();
                            let o = result.find(o => o.ipAddress == rowData.ipAddress)
                            if (o) {
                                let row = { "index": ++i, "setNo": o.setNo, "semId": o.semId ? o.semId : "-", "status": o.status, "ipAddress": o.ipAddress, "deviceStatus": o.deviceStatus, "name": o.name }
                                deviceTable.row(index).data(row).draw(false);
                            }
                        });
                    }
                }
            }
        }, deviceStatusFrequency)
    });

    deviceStatusToggle.addEventListener('hidden.bs.modal', function (event) {
        clearInterval(deviceStatusInterval)
        $("#deviceStatusToggle").modal("dispose");
    })
    deviceStatusToggle.addEventListener('show.bs.modal', function (event) {
        deviceStatusTable = $('#device-status-table').DataTable({
            "ordering": false,
            "searching": false,
            "paging": true,
            "autoWidth": false,
            "processing": true,
            "serverSide": true,
            "destroy": true,
            "language": PageHelper.language(),
            "lengthMenu": PageHelper.lengthMenu(),
            "dom": PageHelper.dom(),
            "pageLength": PageHelper.pageLength(),
            "ajax": {
                url: "/getDeviceSelection",
                type: "POST",
                data: function (d) {
                    return d
                },
            },
            "drawCallback": function (settings, json) {
                $("#device-status-table .device-status-warning-hover").mouseenter(function () {
                    $(this).next().show()
                });
                $("#device-status-table .device-status-warning-hover").mouseleave(function () {
                    $(this).next().hide()
                });
            },
            "columnDefs": [
                {
                    "targets": [1, 2, 3, 4],
                    "createdCell": function (td, cellData, rowData, row, col) {
                        if (!cellData) {
                            $(td).html('-');
                        }
                    }
                },
            ],
            // "fnRowCallback": function (nRow, aData, iDisplayIndex) {
            //     $("td:first", nRow).html(iDisplayIndex + 1);
            //     return nRow;
            // },
            "columns": [
                {
                    "data": null, "title": "S/N",
                    "render": function (data, type, full, meta) {
                        return meta.row + 1 + meta.settings._iDisplayStart
                    }
                },
                {
                    "data": "setNo", "title": "Set No."
                },
                {
                    "data": "ipAddress", "title": "IP Address"
                },
                {
                    "data": "name", "title": "Name", "render": function (data, type, full, meta) {
                        if (data) {
                            return `<button type="button" class="btn btn-link" onclick="changeNameDialog(${full.id})">${data}</button>`
                        }
                        return data
                    }
                },
                {
                    "data": "semId", "title": "SEM ID",
                },
                {
                    // "width": "90px",
                    "className": "text-start",
                    "data": "status", "title": "Status",
                    "render": function (data, type, full, meta) {
                        if (data == "Green") {
                            return `<div class="div-status"><div class="div-green"></div></div>`
                        } else if (data == "White") {
                            return `<div class="div-status"><div class="div-white"></div>
                                <img class="icon-wh device-status-warning-hover" role="button" src="../images/warning.svg" style="margin-left: 5px;">
                                <div class="device-status-warning-div">
                                    <span>${full.deviceStatus}</span>
                                </div>
                            </div>`
                        } else {
                            return `<div class="div-status"><div class="div-amber"></div>
                                        <img class="icon-wh device-status-warning-hover" role="button" src="../images/warning.svg" style="margin-left: 5px;">
                                        <div class="device-status-warning-div">
                                            <span>${full.deviceStatus}</span>
                                        </div>
                                </div>`
                        }
                    }
                },
            ]
        });
        deviceStatusTable.off("click");
        deviceStatusInterval = setInterval(function () {
            deviceStatusTable.ajax.reload(null, false)
        }, deviceStatusFrequency)
    });

    // device selection
    deviceSelectionToggle.addEventListener('hidden.bs.modal', function (event) {
        let $checkAll = $('#device-select-table').find("thead").find("input[type='checkbox']")
        $checkAll.prop('checked', false)
        $("#deviceSelectionNum").text(0)
        $("#deviceSelectionToggle").modal("dispose");
    })
    deviceSelectionToggle.addEventListener('show.bs.modal', async function (event) {
        deviceSelectTable = $('#device-select-table').DataTable({
            "ordering": false,
            "searching": false,
            "paging": true,
            "autoWidth": false,
            "processing": true,
            "serverSide": false,
            "destroy": true,
            "language": PageHelper.language(),
            "lengthMenu": PageHelper.lengthMenu(),
            "dom": PageHelper.dom(),
            "pageLength": PageHelper.pageLength(),
            // "ajax": {
            //     url: "/getDeviceSelection",
            //     type: "POST",
            //     data: function (d) {
            //         return d
            //     },
            // },
            "drawCallback": function (settings, json) {
                $("#device-select-table .device-status-warning-hover").mouseenter(function () {
                    $(this).next().show()
                });
                $("#device-select-table .device-status-warning-hover").mouseleave(function () {
                    $(this).next().hide()
                });
            },
            "columnDefs": [
                {
                    "targets": [1, 2, 3, 4],
                    "createdCell": function (td, cellData, rowData, row, col) {
                        if (!cellData) {
                            $(td).html('-');
                        }
                    }
                },
            ],
            "columns": [
                {
                    "data": "checked", "title": `<div class="form-check">
                            <input class="form-check-input" type="checkbox" onclick="CheckAll(this)">
                        </div>`,
                    "render": function (data, type, full, meta) {
                        if (data) {
                            return `<div class="form-check">
                            <input class="form-check-input" type="checkbox" name="checkbox" onclick="CheckOne(this)" data-row="${meta.row}" checked>
                        </div>`
                        }
                        return `<div class="form-check">
                                <input class="form-check-input" type="checkbox" name="checkbox" onclick="CheckOne(this)" data-row="${meta.row}">
                            </div>`
                    }
                },
                {
                    "data": null, "title": "S/N",
                    // "render": function (data, type, full, meta) {
                    //     return meta.row + 1
                    // }
                },
                {
                    "data": "setNo", "title": "Set No."
                },
                {
                    "data": "ipAddress", "title": "IP Address"
                },
                {
                    "data": "semId", "title": "SEM ID",
                },
                {
                    // "width": "90px",
                    "className": "text-start",
                    "data": "status", "title": "Status",
                    "render": function (data, type, full, meta) {
                        if (data == "Green") {
                            return `<div class="div-status"><div class="div-green"></div></div>`
                        } else if (data == "White") {
                            return `<div class="div-status"><div class="div-white"></div>
                            <img class="icon-wh device-status-warning-hover" role="button" src="../images/warning.svg" style="margin-left: 5px;">
                                        <div class="device-status-warning-div">
                                            <span>${full.deviceStatus}</span>
                                        </div>
                                        </div>`
                        } else {
                            return `<div class="div-status"><div class="div-amber"></div>
                                        <img class="icon-wh device-status-warning-hover" role="button" src="../images/warning.svg" style="margin-left: 5px;">
                                        <div class="device-status-warning-div">
                                            <span>${full.deviceStatus}</span>
                                        </div>
                                </div>`
                        }
                    }
                },
            ]
        });
        deviceSelectTable.on('draw.dt', function () {
            var PageInfo = $('#device-select-table').DataTable().page.info();
            deviceSelectTable.column(1, { page: 'current' }).nodes().each(function (cell, i) {
                cell.innerHTML = i + 1 + PageInfo.start;
            });
        });

        deviceSelectTable.rows().remove().draw();
        const response = await fetch('getDeviceSelectionAll', {
            method: 'POST',
        });

        if (response.ok) {
            const data = await response.json()
            if (data.code == 1) {
                let result = data.data

                let total = result.length
                deviceTable.rows().iterator('row', function (context, index) {
                    let rowData = deviceTable.row(index).data();
                    let checkedRow = result.find(o => o.ipAddress == rowData.ipAddress)
                    if (checkedRow) {
                        checkedRow.checked = true
                    }
                });
                let checkedLen = result.filter(o => o.checked == true).length

                let $checkAll = $('#device-select-table').find("thead").find("input[type='checkbox']")
                $checkAll.prop('checked', checkedLen == total)
                $("#deviceSelectionNum").text(checkedLen)

                deviceSelectTable.rows.add(result).draw(true);
            }
        }
    });
    passwordToggle.addEventListener('hidden.bs.modal', function (event) {
        $("#pwdError").addClass('hide')
        $("#password").val("")
        $("#passwordToggle").modal("dispose");
    })
    passwordToggle.addEventListener('show.bs.modal', async function (event) {
        $("#pwdError").addClass('hide')
        $("#password").val("")
    })

    viewPastActivityToggle.addEventListener('hidden.bs.modal', function (event) {
        $("#viewPastActivityToggle").modal("dispose");
    })
    pastActivityTable = $('#past-activity-table').DataTable({
        "ordering": false,
        "searching": false,
        "paging": true,
        "autoWidth": false,
        "processing": true,
        "serverSide": true,
        "destroy": true,
        "language": PageHelper.language(),
        "lengthMenu": PageHelper.lengthMenu(),
        "dom": PageHelper.dom(),
        "pageLength": PageHelper.pageLength(),
        "ajax": {
            url: "/getPastActivityBySelectActivityId",
            type: "POST",
            data: function (d) {
                d.selectActivityId = $('#selectActivity').attr("data-id")
                return d
            },
        },
        "initComplete": function (settings, json) {

        },
        "columnDefs": [
            {
                "targets": [2, 3, 4, 5, 6, 7],
                "createdCell": function (td, cellData, rowData, row, col) {
                    if (!cellData) {
                        $(td).html('-');
                    }
                }
            },
        ],
        "columns": [
            {
                "data": null, "title": "S/N",
                // "render": function (data, type, full, meta) {
                //     return meta.row + 1 + meta.settings._iDisplayStart
                // }
            },
            {
                "data": "setNo", "title": "Set No."
            },
            {
                "data": "avgTc", "title": "Aver Tc(&#8451)",
            },
            {
                "data": "maxTc", "title": "Highest Tc(&#8451)",
            },
            {
                "data": "minTc", "title": "Lowest Tc(&#8451)",
            },
            {
                "data": "avgPSI", "title": "Aver PSI",
            },
            {
                "data": "maxPSI", "title": "Highest PSI",
            },
            {
                "data": "minPSI", "title": "Lowest PSI",
            },
        ]
    });
    pastActivityTable.on('draw.dt', function () {
        var PageInfo = $('#past-activity-table').DataTable().page.info();
        pastActivityTable.column(0, { page: 'current' }).nodes().each(function (cell, i) {
            cell.innerHTML = i + 1 + PageInfo.start;
        });
    });

    $('#btn-devices-status').on("click", function () {
        $('#deviceStatusToggle').modal("show");
    })
    $('#btn-add-deviceSelection').on("click", function () {
        $('#newActivityToggle').modal("show");
        $('#deviceSelectionToggle').modal("show");
    });

    $("#btn-view-past-activity").on("click", function () {
        $('#viewPastActivityToggle').modal("show");
    });
    $(".btn-outline-primary").on("click", function () {
        let type = $(this).attr("data-type")
        changeChart(type)
    });

    $('#past-activity-table tbody').on('click', 'tr', async function () {
        $('#past-activity-table tbody tr').removeClass('selected')
        $(this).toggleClass('selected');

        let data = pastActivityTable.rows('.selected').data()[0]
        // console.log(data)
        let { activityId, ipAddress,
            maxTc, minTc,
            maxPSI, minPSI,
            maxHr, minHr,
            maxBr, minBr } = data
        axios.post('/getPastActivityChartData', {
            selectActivityId: activityId,
            ipAddress,
            maxTc, minTc,
            maxPSI, minPSI,
            maxHr, minHr,
            maxBr, minBr
        }).then(result => {
            chartData = result.data.data
            $("#psi-radio-btn").trigger('click')
        })
    });
    $("#btn-switch-map").on("click", function () {
        $(this).toggleClass('active')
        MapUtil.switchMap($(this).hasClass('active'))
    })

    $("#btn-name-cancel").on("click", function () {
        $('#changeNameToggle').modal("hide");
    });
    $("#btn-name-confirm").on("click", function () {
        let name = $("#changeNameInput").val()
        if (!name) {
            return
        }
        axios.post('/changeNameById', { id: changeId, name: name }).then(async result => {
            if (result.data.code == 0) {
                simplyAlert(result.data.msg, "red");
                return
            }
            deviceStatusTable.ajax.reload(null, false)
            $("#changeNameToggle").modal("hide");
        })
    });

    $("#btn-device-status-download").on('click', function () {
        $("#filename").val("DeviceStatus" + moment().format("DDMMYYHHmm"))
        $('#fileNameToggle').modal("show");
    })
    $("#btn-filename-cancel").on("click", function () {
        $("#filename").val("")
        $('#fileNameToggle').modal("hide");
    });
    $("#btn-filename-confirm").on("click", function () {
        let filename = $("#filename").val()
        if (!filename) {
            return
        }
        axios.get('/download/deviceStatus', { params: { filename: filename }, responseType: 'blob' }).then(async result => {
            if (result.data.code == 0) {
                simplyAlert(result.data.msg, "red");
                return
            }
            $("#fileNameToggle").modal("hide");
            downloadFile(result)
        })
    });
})

export function reloadPastActivityTable() {
    pastActivityTable.ajax.reload(null, true);
}

const changeChart = function (type) {
    let data = pastActivityTable.rows('.selected').data()[0]
    if (!data) {
        return
    }
    let {
        avgPSI, maxPSI, minPSI,
        avgTc, maxTc, minTc,
        avgBr, maxBr, minBr,
        avgHr, maxHr, minHr, tcRedThreshold, tcAmberThreshold, psiRedThreshold, psiAmberThreshold
    } = data
    if (type == 1) { //psi
        IndexUtil.InitChart('PSI', chartData.seriesPsi, avgPSI, maxPSI, minPSI, chartData.scatterPsi, psiRedThreshold, psiAmberThreshold)
    } else if (type == 2) { //tc
        IndexUtil.InitChart('Tc', chartData.seriesTc, avgTc, maxTc, minTc, chartData.scatterTc, tcRedThreshold, tcAmberThreshold)
    } else if (type == 3) { //hr
        IndexUtil.InitChart('Hr', chartData.seriesHr, avgHr, maxHr, minHr, chartData.scatterHr, null, null)
    } else if (type == 4) { //br
        IndexUtil.InitChart('Br', chartData.seriesBr, avgBr, maxBr, minBr, chartData.scatterBr, null, null)
    }
}

window.CheckAll = function (e) {
    // let checkboxTrips = $(e).closest("table").find("input[name='checkbox']")
    // checkboxTrips.prop('checked', $(e).prop('checked'))
    // let checkedLength = $(e).closest("table").find("tbody").find("input[type='checkbox']:checked").length

    // for(let data of datas){
    //     data.checked = !data.checked
    // }
    let isChecked = $(e).prop('checked')
    deviceSelectTable.rows().iterator('row', function (context, index) {
        let selectRow = deviceSelectTable.row(index).data();
        selectRow.checked = isChecked
    });
    $(':checkbox', deviceSelectTable.rows().nodes()).prop('checked', isChecked);

    let datas = deviceSelectTable.rows().data()
    let checkedLen = datas.filter(o => o.checked == true).length

    $("#deviceSelectionNum").text(checkedLen)
}

window.CheckOne = function (e) {
    let selectRow = deviceSelectTable.row($(e).data("row")).data();
    selectRow.checked = !selectRow.checked
    let datas = deviceSelectTable.rows().data()
    let checkedLen = datas.filter(o => o.checked == true).length
    let $checkAll = $(e).closest("table").find("thead").find("input[type='checkbox']")
    // let checkedLength = $(e).closest("table").find("tbody").find("input[type='checkbox']:checked").length
    // let trLength = $(e).closest("table").find("tbody").find("tr").length
    // $checkAll.prop('checked', checkedLength == trLength)
    $checkAll.prop('checked', checkedLen == datas.length)
    $("#deviceSelectionNum").text(checkedLen)
}

window.CheckOnInput = function (e) {
    e.value = e.value
        .replace(/^0[0-9]+/, val => val[1])
        .replace(/^(\.)+/, '')
        .replace(/[^\d.]/g, '')
        .replace(/\.+/, '.')
        .replace(/^(\-)*(\d+)\.(\d\d).*$/, '$1$2.$3');
}

window.changeNameDialog = function (id) {
    changeId = id
    $("#changeNameInput").val("")
    $("#changeNameToggle").modal("show");
}

export var deviceTable
export var deviceSelectTable
export var deviceStatusTable
export var pastActivityTable
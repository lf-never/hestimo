$(function () {
    layui.use(['laydate'], function () {
        laydate = layui.laydate;
        laydate.render({
            elem: "#activityStartTime",
            lang: 'en',
            type: 'time',
            trigger: 'click',
            format: 'HH:mm',
            btns: ['clear', 'confirm'],
        });
    });
    layui.use(['laydate'], function () {
        laydate = layui.laydate;
        laydate.render({
            elem: "#dateConducted",
            lang: 'en',
            type: 'date',
            trigger: 'click',
            format: 'yyyy-MM-dd',
            btns: ['clear', 'confirm'],
            //min: moment().format('YYYY-MM-DD'),
        });
    });
})

const downloadFile = function (result) {
        const { data, headers } = result
        const fileName = headers['content-disposition'].replace(/\w+;filename=(.*)/, '$1')
        const blob = new Blob([data], { type: headers['content-type'] })
        let dom = document.createElement('a')
        let url = window.URL.createObjectURL(blob)
        dom.href = url
        dom.download = decodeURI(fileName)
        dom.style.display = 'none'
        document.body.appendChild(dom)
        dom.click()
        dom.parentNode.removeChild(dom)
        window.URL.revokeObjectURL(url)
    }
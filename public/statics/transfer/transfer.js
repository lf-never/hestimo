(function($, window, document) {
    var transfer = function(el, options) {
        this.option = options;
        this.$el = $(el);
        this.selectData = [];
        this.unselectData = [];
        this.init();
    };
    transfer.DEFAULTS = {
        titles: ['Left', 'Right'],
        search: true, 
        showRefresh: false, 
        clickToSelect: true,
        pagination: false, 
        autoHeight: false,
        url: '',
        type: 'get',
        queryParams: {},
        contentType: 'application/json',
        paginationDetail: false,
        maxSelect: undefined,
        uniqueId: '', 
        dataSource: [], 
        selectdataSource: undefined,
        diffKey: 'flag',
        selectColumns: [],
        unselectColumns: []
 
    };
    transfer.prototype = {
        init: function() {
            this.initoption();
            this.initContainer();
            this.initBothTable();
            if (this.option.url) {
                this.initServer();
            } else {
                this.classifyData();
            }
            this.initEvent();
        },
        initContainer: function() {
            var _this = this;
            var containerHtml = ['<div class="col-sm-5 transferBox">',
                '<h3 class="unselectTitle" style="margin: 0;padding: 5px 0 10px 0;">' + this.unselectTitle + '<span style="margin-left: 5px;">(<span id="checkedNum1"></span><span id="unselectTotalNum"></span>)</span></h3>',
                '<table id="transferUnselectTable"></table>',
                '</div>',
                '<div class="col-sm-2 transferBtn" style="height: 100%">',
                '<div class="btnList">',
                '<span class="btn btn-default  forwardBtn" ><i class="glyphicon glyphicon-forward"></i></span>',
                '<span class="btn btn-default  backwardBtn" ><i class="glyphicon glyphicon-backward"></i></span>',
                '</div>',
                '</div>',
                '<div class="col-sm-5 transferBox">',
                '<h3 class="selectTitle" style="margin: 0;padding: 5px 0 10px 0;">' + this.selectTitle + '<span style="margin-left: 5px;">(<span id="checkedNum2"></span><span id="selectTotalNum"></span>)</span></h3>',
                '<table id="transferSelectTable"></table>',
                '</div>'
            ].join('');
            this.$el.html(containerHtml);
            this.$unselectTable = this.$el.find('#transferUnselectTable'); 
            this.$unselectTotalNum = this.$el.find('#unselectTotalNum'); 
            this.$checkedNum1 = this.$el.find('#checkedNum1'); 
            this.$forwardBtn = this.$el.find('.forwardBtn'); 
 
            this.$selectTable = this.$el.find('#transferSelectTable'); 
            this.$selectTotalNum = this.$el.find('#selectTotalNum'); 
            this.$checkedNum2 = this.$el.find('#checkedNum2'); 
            this.$backwardBtn = this.$el.find('.backwardBtn'); 
            this.option.height = this.$el.outerHeight() - this.$el.find('h3.unselectTitle').outerHeight() - 8;
        },
        initoption: function() {
            if (typeof this.option.titles == 'string' || (this.option.titles instanceof Array && this.option.titles.length == 1)) {
                this.selectTitle = this.unselectTitle = this.option.titles + '';
            } else if (this.option.titles instanceof Array && this.option.titles.length > 1) {
                this.unselectTitle = this.option.titles[0];
                this.selectTitle = this.option.titles[1];
            }
            if (this.option.selectColumns instanceof Array && this.option.unselectColumns instanceof Array && (!this.option.selectColumns.length && this.option.unselectColumns.length)) {
                this.option.selectColumns = JSON.parse(JSON.stringify(this.option.unselectColumns));
            } else if (this.option.selectColumns instanceof Array && this.option.unselectColumns instanceof Array && (this.option.selectColumns.length && !this.option.unselectColumns.length)) {
                this.option.unselectColumns = JSON.parse(JSON.stringify(this.option.selectColumns));
            } else if (!this.option.selectColumns instanceof Array || !this.option.unselectColumns instanceof Array) {
                console.error('selectColumns and unselectColumns must be Array');
                return false;
            }
            this.option.selectColumns[0].field = this.option.diffKey + 's';
            this.option.unselectColumns[0].field = this.option.diffKey;
        },
        classifyData: function() {
            if (!this.option.dataSource) { console.error('dataSource is empty'); return false; }
            if (this.option.selectdataSource) {
                this.selectData = this.option.selectdataSource;
                this.unselectData = this.option.dataSource;
            } else {
                for (var i = 0; i < this.option.dataSource.length; i++) {
                    if (this.option.dataSource[i][this.option.diffKey]) {
                        this.selectData.push(this.option.dataSource[i]);
                    } else {
                        this.unselectData.push(this.option.dataSource[i]);
                    }
                }
            }
            this.refreshTable();
            this.showTotalNum();
        },
        refreshTable: function() {
            this.$unselectTable.bootstrapTable("load", this.unselectData);
            this.$selectTable.bootstrapTable("load", this.selectData);
        },
        showTotalNum: function() {
            this.$unselectTotalNum.html(this.unselectData.length);
            this.$selectTotalNum.html(this.selectData.length);
        },
        initBothTable: function() {
            var _this = this;
            this.$unselectBootstrapTable = this.$unselectTable.bootstrapTable({
                search: _this.option.search,
                showRefresh: _this.option.showRefresh,
                showToggle: false,
                showColumns: false,
                paginationDetail: _this.option.paginationDetail,
                clickToSelect: _this.option.clickToSelect,
                pagination: _this.option.pagination,
                sidePagination: 'client',
                autoHeight: false,
                height: _this.option.height,
                data: [],
                sortName: "createTime",
                sortOrder: "desc",
                uniqueId: _this.option.uniqueId,
                columns: _this.option.unselectColumns
            });
            this.$selectBootstrapTable = this.$selectTable.bootstrapTable({
                search: _this.option.search,
                showRefresh: _this.option.showRefresh,
                showToggle: false,
                paginationDetail: _this.option.paginationDetail,
                showColumns: false,
                clickToSelect: _this.option.clickToSelect,
                pagination: _this.option.pagination,
                autoHeight: false,
                height: _this.option.height,
                data: [],
                sortName: "createTime",
                sortOrder: "desc",
                uniqueId: _this.option.uniqueId,
                columns: _this.option.selectColumns
            });
            this.$selectBootstrapTable.on('check.bs.table check-all.bs.table uncheck.bs.table uncheck-all.bs.table', function(e, rows) {
                var num = _this.$selectTable.find('tr input[name="btSelectItem"]:checked').length;
                if (num) {
                    _this.$backwardBtn.removeClass('btn-default').addClass('btn-info');
                    _this.$checkedNum2.html(num + '/');
                } else {
                    _this.$backwardBtn.removeClass('btn-info').addClass('btn-default');
                    _this.$checkedNum2.html('');
                }
            });
            this.$unselectBootstrapTable.on('check.bs.table check-all.bs.table uncheck.bs.table uncheck-all.bs.table', function(e, rows) {
                var num = _this.$unselectTable.find('tr input[name="btSelectItem"]:checked').length;
                if (num) {
                    _this.$forwardBtn.removeClass('btn-default').addClass('btn-info');
                    _this.$checkedNum1.html(num + '/');
                } else {
                    _this.$forwardBtn.removeClass('btn-info').addClass('btn-default');
                    _this.$checkedNum1.html('');
                }
            });
        },
        initServer: function() {
            var _this = this;
            if (this.option.url) {
                $.ajax({
                    url: _this.option.url,
                    type: _this.option.type,
                    contentType: _this.option.contentType,
                    data: _this.option.contentType === 'application/json' && _this.option.type === 'post' ?
                        JSON.stringify(_this.option.queryParams) : _this.option.queryParams,
                    success: function(res) {
                        if (res.success) {
                            _this.option.dataSource = res.data;
                            _this.selectData = [];
                            _this.unselectData = [];
                            _this.classifyData();
                        }
                    },
                    error: function(result) {
                        console.log(11);
                    }
                });
 
            }
        },
        initEvent: function() {
            var _this = this;
            this.$forwardBtn.click(function() {
                _this.transferData($(this), 1);
            });
            this.$backwardBtn.click(function() {
                _this.transferData($(this), 0);
            });
        },
        getSelect: function($tr) {
            return $.map($tr, function(ele, index) {
                if ($(ele).find('input[name="btSelectItem"]').is(':checked')) {
                    return $(ele).attr("data-uniqueid");
                }
            });
        },
        transferData: function($dom, type) {
            var _this = this;
            if (!$dom.hasClass('btn-info')) {
                return false;
            }
            if (type) {
                var selectList = this.getSelect(this.$unselectTable.find('tbody tr'));
                if ((this.option.maxSelect - 0) && typeof(this.option.maxSelect - 0) == "number") {
                    var currenNum = selectList.length + this.selectData.length;
                    if (currenNum > this.option.maxSelect) {
                        alert(this.selectTitle + ' is bigger than ' + this.option.maxSelect + '!');
                        return false;
                    }
                }
                for (var i = 0; i < this.unselectData.length; i++) {
                    if (selectList.indexOf(this.unselectData[i][this.option.uniqueId]) >= 0) {
                        this.unselectData[i][this.option.selectColumns[0].field] = false;
                        this.selectData.push(this.unselectData[i]);
                        this.unselectData.splice(i, 1);
                        i--;
                    }
                }
                this.refreshTable();
                this.$forwardBtn.removeClass('btn-info').addClass('btn-default');
                this.$checkedNum1.html('');
            } else {
                var selectList = this.getSelect(this.$selectTable.find('tbody tr'));
                for (var i = 0; i < this.selectData.length; i++) {
                    if (selectList.indexOf(this.selectData[i][this.option.uniqueId]) >= 0) {
                        this.selectData[i][this.option.unselectColumns[0].field] = false;
                        this.unselectData.push(this.selectData[i]);
                        this.selectData.splice(i, 1);
                        i--;
                    }
                }
                this.refreshTable();
                this.$backwardBtn.removeClass('btn-info').addClass('btn-default');
                this.$checkedNum2.html('');
            }
            this.showTotalNum();
        },
        getData: function(type, arr) {
            if (!type) { console.error('unselectData or selectData is needed!'); return false; }
            if (arr && typeof arr == 'string') {
                return $.map(this[type], function(item, index) {
                    return item[arr];
                });
            } else if (arr && arr instanceof Array && arr.length > 0) {
                return $.map(this[type], function(item, index) {
                    var obj = {};
                    for (var i = 0; i < arr.length; i++) {
                        obj[arr[i]] = item[arr[i]];
                    }
                    return obj;
                });
            } else {
                return this[type];
            }
        },
        destroy: function() {
            this.$el.html('');
        },
        refresh: function(data) {
            if (this.option.url) {
                this.initServer();
            } else {
                this.option.dataSource = JSON.parse(JSON.stringify(data));
                this.selectData = [];
                this.unselectData = [];
                this.classifyData();
            }
        },
        refreshLeft: function(data) {
            var uniqueId = this.option.uniqueId
            var selectDataId = this.getData('selectData', uniqueId);
            for (var i = 0; i < data.length; i++) {
                if (selectDataId.indexOf(data[i][uniqueId]) >= 0) {
                    data.splice(i, 1);
                    i--;
                }
            }
            this.$unselectTable.bootstrapTable("load", data);
            this.unselectData = data;
            this.showTotalNum();
        },
        refreshRight: function(data) {
            this.selectData = data;
            var uniqueId = this.option.uniqueId
            var selectDataId = this.getData('selectData', uniqueId);
            for (var i = 0; i < this.unselectData.length; i++) {
                if (selectDataId.indexOf(this.unselectData[i][uniqueId]) >= 0) {
                    this.unselectData.splice(i, 1);
                    i--;
                }
            }
            this.$selectTable.bootstrapTable("load", data);
            this.$unselectTable.bootstrapTable("load", this.unselectData);
            this.showTotalNum();
 
        }
    }
    var allowedMethods = ['refresh', 'refreshLeft', 'refreshRight', 'destroy', 'getData'];
    $.fn.transfer = function(option) { 
        var e = this,
            value,
            args = Array.prototype.slice.call(arguments, 1);
        e.each(function() {
            var $this = $(this),
                data = $this.data('transfer'),
                options = $.extend({}, transfer.DEFAULTS, $this.data(),
                    typeof option === 'object' && option);
            if (typeof option === 'string') {
                if ($.inArray(option, allowedMethods) < 0) {
                    throw new Error("Unknown method: " + option);
                }
                if (!data) {
                    return;
                }
                value = data[option].apply(data, args);
 
                if (option === 'destroy') {
                    $this.removeData('transfer');
                }
            }
            if (!data) {
                $this.data('transfer', (data = new transfer(this, options)));
            }
        });
        return typeof value === 'undefined' ? this : value;
    };
    $.fn.transfer.Constructor = transfer;
    $.fn.transfer.defaults = transfer.DEFAULTS;
    $.fn.transfer.methods = allowedMethods;
})(jQuery, window, document);
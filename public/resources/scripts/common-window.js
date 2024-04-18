export function simpleAlert (content, callback) {
    $.confirm({
        title: 'Info',
        icon: 'fa fa-info-circle',
        content: content,
        type: 'blue',
        typeAnimated: true,
        buttons: {
            Ok: {
                btnClass: 'btn-blue',
                keys: ['enter', 'shift'],
                action: function () {
                    callback ? callback() : null;
                }
            }
        }
    });
}

export function simpleWarn (content, callback) {
    $.confirm({
        title: 'Warn',
        icon: 'fa fa-warning',
        content: content,
        type: 'orange',
        typeAnimated: true,
        buttons: {
            Ok: {
                btnClass: 'btn-warning',
                keys: ['enter', 'shift'],
                action: function () {
                    callback ? callback() : null;
                }
            }
        }
    });
}

export function simpleError (content) {
    $.confirm({
        title: 'Error',
        theme: 'light',
        icon: 'fa fa-warning',
        content: content,
        type: 'red',
        typeAnimated: true,
        buttons: {
            Close: function () {
            }
        }
    });
}

export function simpleConfirm (content, confirmCallback, cancelCallback) {
    $.confirm({
        title: 'Confirm',
        content: content,
        columnClass: 'col-md-8 col-md-offset-2',
        buttons: {
            Confirm: {
                btnClass: 'btn-blue',
                keys: ['enter', 'shift'],
                action: function () {
                    confirmCallback ? confirmCallback() : null
                },
            },
            Cancel: {
                action: function () {
                    cancelCallback ? cancelCallback() : null
                },
            },
        }
    });
}

export function simpleWindowLoading (content) {
    // $.confirm({
    //     title: 'Title',
    //     content: 'url:http://localhost:10000/test.txt',
    //     onContentReady: function () {
    //         var self = this;
    //         this.setContentPrepend('<div>Prepended text</div>');
    //         setTimeout(function () {
    //             self.setContentAppend('<div>Appended text after 2 seconds</div>');
    //         }, 2000);
    //     },
    //     columnClass: 'medium',
    // });

    $.confirm({
        content: function(){
            var self = this;
            self.setContent('Checking callback flow');
            return $.ajax({
                url: 'https://localhost:9900/test.txt',
                // dataType: 'json',
                method: 'get'
            }).done(function (response) {
                self.setContentAppend('<div>Done!</div>');
            }).fail(function(){
                self.setContentAppend('<div>Fail!</div>');
            }).always(function(){
                self.setContentAppend('<div>Always!</div>');
            });
        },
        contentLoaded: function(data, status, xhr){
            this.setContentAppend('<div>Content loaded!</div>' + JSON.stringify(data));
        },
        onContentReady: function(){
            this.setContentAppend('<div>Content ready!</div>');
        },
        buttons: {
            confirm: function () {
                return $.alert('Confirmed!');
            },
            cancel: function () {
                return $.alert('Canceled!');
            }
        }
    });
}
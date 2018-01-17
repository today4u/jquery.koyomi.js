;(function(jQuery) {
    'use strict';
    var Now      = new Date();
    var Today    = new Date(Now.getFullYear(), Now.getMonth(), Now.getDate());
    var methods  = {
        init: function(options) {
            var defaults = jQuery.extend(true,{
                "year":  Now.getFullYear(),
                "month": Now.getMonth()+1,  // 1-12
                "headLabel": "%year% %month%",
                "prevNext": true,
                "weekBeginning": 0, //0-6
                "weekdayNames" : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                "weekdayClass" : ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
                "monthNames"   : ['January','February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                "url": "http://example.com/%year%/%month%/%day%/",
            },options);
            
            return this.each(function() {
                var $this = jQuery(this);
                var settings = mergeOptions($this, defaults);
                var koyomi = new Koyomi($this, settings);
                koyomi.settings.target = new Date(koyomi.settings.year, koyomi.settings.month-1 , 1);
                //html build
                koyomi.buildKoyomi();
                //event (next or prev)
                jQuery($this).on("click", "div.prev", function () {
                    koyomi.settings.month = koyomi.settings.month-1;
                    koyomi.settings.target = new Date(koyomi.settings.year, koyomi.settings.month-1,1);
                    $this.empty();
                    koyomi.buildKoyomi();
                });
                jQuery($this).on("click", "div.next", function () {
                    koyomi.settings.month = koyomi.settings.month+1;
                    koyomi.settings.target = new Date(koyomi.settings.year, koyomi.settings.month-1,1);
                    $this.empty();
                    koyomi.buildKoyomi();
                });
                jQuery($this).on("click", "td > div", function () {
                    window.location.href = $(this).data("url");
                });
            });
        }
    }
    var Counter = function(initNumber, weekBeginning) {
        var counter = initNumber;
        return {
            getWeekNum: function() {
                return (counter + weekBeginning) % 7;
            },
            getCellNum: function() {
                return counter % 7;
            },
            countUp: function() {
                return counter++;
            }
        }
    }
    jQuery.fn.koyomi = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            jQuery.error('Method ' +  method + ' does not exist on jQuery.koyomi');
        }
    }
    //private method
    var mergeOptions = function($el, settings) {
        return jQuery.extend(true,{}, settings, $el.data());
    };
    //class
    var Koyomi = (function() {
        //constructor
        var Koyomi = function($el, settings) {
            this.$el       = $el;
            this.settings  = settings;
        }
        //インスタンスメソッド
        jQuery.extend(Koyomi.prototype, {}, {
            buildKoyomi: function() {
                var html  = '';
                html += '<div class="koyomi">';
                html += '<table>';
                html +=   '<thead>';
                html +=     this.buildHead();
                html +=   '</thead>';
                html +=   '<tbody>';
                html +=     this.buildMain();
                html +=   '</tbody>';
                html += '</table>';
                html += '</div>';
                this.$el.append(html);
            },
            buildHead: function() {
                var headLabel = this.settings.headLabel;
                headLabel = headLabel.replace('%month%',this.settings.monthNames[this.settings.target.getMonth()]);
                headLabel = headLabel.replace('%year%', this.settings.target.getFullYear());
                var colspan = 7;
                var html = '';
                html += '<tr>';
                if(this.settings.prevNext) {
                    colspan = 5;
                    html +=   '<td><div class="prev">＜</div></td>';
                }
                html +=   '<td colspan="'+colspan+'"><div class="headLabel">'+headLabel+'</div></td>';
                if(this.settings.prevNext) {
                    html +=   '<td><div class="next">＞</div></td>';
                }
                html += '</tr>';
                return html;
            },
            buildMain: function() {
                var firstDay  = new Date(this.settings.target.getFullYear(), this.settings.target.getMonth(), 1);
                var endDay    = new Date(this.settings.target.getFullYear(), this.settings.target.getMonth()+1, 0);
                var i         = 0;
                var counter   = Counter(0, this.settings.weekBeginning);
                var weekData  = this.initWeekObject();
                var html      = '';

                html += '<tr>';
                Object.keys(weekData).forEach(function(value, index) {
                    html += '<th class="'+weekData[value].class+'">'+weekData[value].name+'</th>';
                });
                html += '</tr>';
                //before 
                if(this.settings.weekBeginning != firstDay.getDay()) {
                    html += '<tr>';
                    while(counter.getWeekNum() != firstDay.getDay()) {
                        var attributes = this.settings.weekdayClass[counter.getWeekNum()];
                        html += '<td class="'+attributes+'"></td>';
                        counter.countUp();
                    }
                }
                //numbers
                for(i=1; i<=endDay.getDate(); i++) {
                    if(!counter.getCellNum()) {
                        html += '<tr>';
                    }
                    var attributes = []
                    attributes.push(this.settings.weekdayClass[counter.getWeekNum()]);
                    if(this.isToday(new Date(this.settings.target.getFullYear(), this.settings.target.getMonth(), i))) {
                        attributes.push('today');
                    }
                    var url = this.settings.url;
                    url = url.replace('%year%' ,this.settings.target.getFullYear());
                    url = url.replace('%month%',this.settings.target.getMonth()+1);
                    url = url.replace('%day%'  ,i);
                    html += '<td class="'+attributes.join(' ')+'"><div data-url="'+url+'">'+i+'</div></td>';
                    counter.countUp();
                    if(!counter.getCellNum()) {
                        html += '</tr>';
                    }
                }
                //after
                if(counter.getCellNum()) {
                    while(counter.getCellNum()) {
                        var attributes = this.settings.weekdayClass[counter.getWeekNum()];
                        html += '<td class="'+attributes+'"></td>';
                        counter.countUp();
                    }
                    html += '</tr>';
                }
                return html;
            },
            initWeekObject: function() {
                var counter = Counter(this.settings.weekBeginning, this.settings.weekBeginning);
                var result  = new Object;
                for(var i=0; i<7; i++) {
                    result[i] = {"name": this.settings.weekdayNames[counter.getCellNum()], "class": this.settings.weekdayClass[counter.getCellNum()]}
                    counter.countUp();
                }
                return result;
            },
            isToday: function(targetDate) {
                if(Today.getTime() === targetDate.getTime()) {
                    return true;
                }
                return false;
            },
            getWeekDay: function() {
                return this.settings.weekdayClass[weeknumber];
            },
            _bind: function(funcName) {
              var that = this;
              return function() { that[funcName].apply(that, arguments) };
            }
        });
        return Koyomi;
    })();
}) (jQuery);

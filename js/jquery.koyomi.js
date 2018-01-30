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
                "prevSign": "＜",
                "nextSign": "＞",
                "eraName": [
                    {"name":"明治","firstDate":"1868-01-25", "lastDate":"1912-07-29"},
                    {"name":"大正","firstDate":"1912-07-30", "lastDate":"1926-12-24"},
                    {"name":"昭和","firstDate":"1926-12-25", "lastDate":"1989-01-07"},
                    {"name":"平成","firstDate":"1989-01-08"},
                ],
                "weekBeginning": 0, //0-6
                "weekdayNames" : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                "weekdayClass" : ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
                "monthNames"   : ['January','February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                "url": "http://example.com/%year%/%month%/%day%/",
                "eventDates": {
                    "dates" :  [],
                    "yearly":  [],
                    "monthly": [],
                }
            },options);
            
            return this.each(function() {
                var $this = jQuery(this);
                var settings = mergeOptions($this, defaults);
                var koyomi = new Koyomi($this, settings);
                koyomi.settings.FirstDay = new Date(koyomi.settings.year, koyomi.settings.month-1, 1);
                koyomi.settings.LastDay  = new Date(koyomi.settings.year, koyomi.settings.month,   0);
                //html build
                koyomi.buildKoyomi();
                koyomi.load();
                //event (next or prev)
                jQuery($this).on("click", "div.prev,div.next", function () {
                    switch(true) {
                        case jQuery(this).attr("class") === 'prev':
                            koyomi.settings.month = koyomi.settings.month-1;
                            break;
                        case jQuery(this).attr("class") === 'next':
                            koyomi.settings.month = koyomi.settings.month+1;
                            break;
                    }
                    koyomi.settings.FirstDay = new Date(koyomi.settings.year, koyomi.settings.month-1,1);
                    koyomi.settings.LastDay  = new Date(koyomi.settings.year, koyomi.settings.month,  0);
                    $this.empty();
                    koyomi.buildKoyomi();
                    koyomi.load();
                });
                jQuery($this).on("click", "div.number", function () {
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
    var zeroPadding  = function(number, length) {
        return (Array(length).join('0') + number).slice(-length);
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
            load: function() {
                var elements = this.$el
                var settings = this.settings
                //dates
                $.each(settings.eventDates.dates, function(i, value) {
                    $(elements).find('.date_'+value.date).addClass(value.class?value.class:'eventday');
                });
                //yearly
                $.each(settings.eventDates.yearly, function(i, value) {
                    $(elements).find('.date_'+settings.FirstDay.getFullYear()+'-'+value.date).addClass(value.class?value.class:'eventday');
                });
                //monthly
                $.each(settings.eventDates.monthly, function(i, value) {
                    $(elements).find('.date_'+settings.FirstDay.getFullYear()+'-'+zeroPadding(settings.FirstDay.getMonth()+1,2)+'-'+zeroPadding(value.date,2)).addClass(value.class?value.class:'eventday');
                });
                //today
                $(elements).find('.date_'+Today.getFullYear()+'-'+zeroPadding(Today.getMonth()+1,2)+'-'+zeroPadding(Today.getDate(),2)).addClass('today');
            },
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
                headLabel = headLabel.replace('%month%',this.settings.monthNames[this.settings.FirstDay.getMonth()]);
                headLabel = headLabel.replace('%year%', this.settings.FirstDay.getFullYear());
                var colspan = 7;
                var html = '';
                html += '<tr>';
                if(this.settings.prevNext) {
                    colspan = 5;
                    html +=   '<td><div class="prev">'+this.settings.prevSign+'</div></td>';
                }
                html +=   '<td colspan="'+colspan+'"><div class="headLabel">'+headLabel+'</div></td>';
                if(this.settings.prevNext) {
                    html +=   '<td><div class="next">'+this.settings.nextSign+'</div></td>';
                }
                html += '</tr>';
                return html;
            },
            buildMain: function() {
                var lastDay    = new Date(this.settings.FirstDay.getFullYear(), this.settings.FirstDay.getMonth()+1, 0);
                var counter   = Counter(0, this.settings.weekBeginning);
                var weekData  = this.initWeekObject();
                var html      = '';

                html += '<tr>';
                Object.keys(weekData).forEach(function(value, index) {
                    html += '<th class="'+weekData[value].class+'">'+weekData[value].name+'</th>';
                });
                html += '</tr>';
                //before 
                if(this.settings.weekBeginning != this.settings.FirstDay.getDay()) {
                    html += '<tr>';
                    while(counter.getWeekNum() != this.settings.FirstDay.getDay()) {
                        var attributes = this.settings.weekdayClass[counter.getWeekNum()];
                        html += '<td class="'+attributes+'"></td>';
                        counter.countUp();
                    }
                }
                //numbers
                for(var i=1; i<=this.settings.LastDay.getDate(); i++) {
                    var Day = new Date(this.settings.FirstDay.getFullYear(), this.settings.FirstDay.getMonth(), i);
                    if(!counter.getCellNum()) {
                        html += '<tr>';
                    }
                    var attributes = []
                    attributes.push(this.settings.weekdayClass[counter.getWeekNum()]);
                    attributes.push('date_'+Day.getFullYear()+'-'+zeroPadding(Day.getMonth()+1,2)+'-'+zeroPadding(Day.getDate(),2) );// date_yyyy-mm-dd
                    var url = this.settings.url;
                    url = url.replace('%year%' ,this.settings.FirstDay.getFullYear());
                    url = url.replace('%month%',this.settings.FirstDay.getMonth()+1);
                    url = url.replace('%day%'  ,i);
                    
                    html += '<td class="'+attributes.join(' ')+'"><div class="number" data-url="'+url+'">'+i+'</div></td>';
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

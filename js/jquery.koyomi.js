;(function(jQuery) {
    'use strict';
    var Now      = new Date();
    var weekData = null;
    var settings = null;
    var firstDay = null;
    var endDay   = null;
    var target   = null;
    var methods  = {
        init: function(options) {
            var defaults = jQuery.extend(true,{
                "year":  Now.getFullYear(),
                "month": Now.getMonth()+1,  // 1-12
                "headLabel": "%year% %month%",
                "weekBeginning": 0, //0-6
                "weekdayNames" : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                "weekdayClass" : ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
                "monthNames"   : ['January','February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                "url": "http://example.com/%year%/%month%/%day%/",
            },options);
            
            return this.each(function() {
                var $this = jQuery(this);
                settings = mergeOptions($this, defaults);
                var koyomi = new Koyomi($this, settings);
                console.log(koyomi)
                target = new Date(koyomi.settings.year, koyomi.settings.month-1 , 1);
                weekData = initWeekObject();
                //html build
                koyomi.buildKoyomi();
                koyomi.event();

                jQuery($this).on("click", "div.prev", function () {
                    koyomi.settings.month = koyomi.settings.month-1;
                    koyomi.settings.year  = target.getFullYear();
                    koyomi.settings.month = target.getMonth();
                    console.log(koyomi)
                    target = new Date(koyomi.settings.year, koyomi.settings.month-1,1);
                    $this.empty();
                    koyomi.buildKoyomi();
                });
                jQuery($this).on("click", "div.next", function () {
                    koyomi.settings.month = koyomi.settings.month+1;;
                    console.log(koyomi)
                    target  = new Date(koyomi.settings.year, koyomi.settings.month-1,1);
                    $this.empty();
                    $this.data('year',target.getFullYear());
                    $this.data('month',target.getMonth());
                    koyomi.buildKoyomi();
                });
            });
        }
    }
    var Counter = function(initNumber) {
        var counter = initNumber;
        return {
            getWeekNum: function() {
                return (counter + settings.weekBeginning) % 7;
            },
            getCellNum: function() {
                return counter % 7;
            },
            countUp: function() {
                return counter++;
            }
        }
    }
    var ClassAattribute = function() {
        var Today = new Date(Now.getFullYear(), Now.getMonth(), Now.getDate());
        return {
            getAttribute: function(weeknumber, day = null) {
                var attributes = [];
                attributes.push(settings.weekdayClass[weeknumber]);
                if(day != null && this.isToday(new Date(target.getFullYear(), target.getMonth(), day))) {
                    attributes.push('today');
                }
                return attributes.join(' ');
            },
            isToday: function(targetDate) {
                if(Today.getTime() === targetDate.getTime()) {
                    return true;
                }
                return false;
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
                firstDay  = new Date(target.getFullYear(), target.getMonth(), 1);
                endDay    = new Date(target.getFullYear(), target.getMonth()+1, 0);
                var html  = '';
                html += '<div class="koyomi">';
                html += '<table>';
                html +=   '<thead>';
                html +=     buildHead();
                html +=   '</thead>';
                html +=   '<tbody>';
                html +=     buildMain();
                html +=   '</tbody>';
                html += '</table>';
                html += '</div>';
                this.$el.append(html);
            },
            _bind: function(funcName) {
              var that = this;
              return function() { that[funcName].apply(that, arguments) };
            },
            event: function() {
            }
        });
        return Koyomi;
    })();
    function buildHead() {
        var headLabel = settings.headLabel;
        headLabel = headLabel.replace('%month%',settings.monthNames[target.getMonth()]);
        headLabel = headLabel.replace('%year%', target.getFullYear());
        var html = '';
        html += '<tr>';
        html +=   '<td><div class="prev">＜</div></td>';
        html +=   '<td colspan="5"><div class="headLabel">'+headLabel+'</div></td>';
        html +=   '<td><div class="next">＞</div></td>';
        html += '</tr>';
        return html;
    }
    function buildMain() {
        var i         = 0;
        var counter   = Counter(0);
        var classAttr = ClassAattribute();
        var html      = '';
        html += '<tr>';
        Object.keys(weekData).forEach(function(value, index) {
            html += '<th class="'+weekData[value].class+'">'+weekData[value].name+'</th>';
        });
        html += '</tr>';
        //before 
        if(settings.weekBeginning != firstDay.getDay()) {
            html += '<tr>';
            while(counter.getWeekNum() != firstDay.getDay()) {
                html += '<td class="'+classAttr.getAttribute(counter.getWeekNum())+'"></td>';
                counter.countUp();
            }
        }
        for(i=1; i<=endDay.getDate(); i++) {
            if(!counter.getCellNum()) {
                html += '<tr>';
            }
            var url = settings.url;
            url = url.replace('%year%' ,target.getFullYear());
            url = url.replace('%month%',target.getMonth()+1);
            url = url.replace('%day%'  ,i);
            html += '<td class="'+classAttr.getAttribute(counter.getWeekNum(), i)+'"><div data-url="'+url+'">'+i+'</div></td>';
            counter.countUp();
            if(!counter.getCellNum()) {
                html += '</tr>';
            }
        }
        //after
        if(counter.getCellNum()) {
            while(counter.getCellNum()) {
                html += '<td class="'+classAttr.getAttribute(counter.getWeekNum())+'"></td>';
                counter.countUp();
            }
            html += '</tr>';
        }
        return html;
    }
    function initWeekObject() {
        var counter = Counter(settings.weekBeginning);
        var result  = new Object;
        for(var i=0; i<7; i++) {
            result[i] = {"name": settings.weekdayNames[counter.getCellNum()], "class": settings.weekdayClass[counter.getCellNum()]}
            counter.countUp();
        }
        return result;
    }
}) (jQuery);

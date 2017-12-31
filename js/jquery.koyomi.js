;(function(jQuery) {
    'use strict';
    var weekData = null;
    var settings = null;
    var methods = {
        init: function(options) {
            var today    = new Date();
            var defaults = jQuery.extend(true,{
                "year": today.getFullYear(),
                "month": today.getMonth()+1,  // 1-12
                "weekBeginning": 0, //0-6
                "weekName":  ["日", "月", "火", "水", "木", "金", "土"],
                "weekClass": ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
            },options);
            //
            return this.each(function() {
                var $this = jQuery(this);
                settings = mergeOptions($this, defaults);
                weekData = initWeekObject();
                var koyomi = new Koyomi($this, settings);
                //html build
                koyomi.buildKoyomi();
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
    };
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
                html += '<table>';
                html +=   '<thead>';
                html +=     '<tr class="week">';
                html +=        buildWeek();
                html +=     '</tr>';
                html +=   '</thead>';
                html +=   '<tbody>';
                html +=     buildMain();
                html +=   '</tbody>';
                html += '</table>';
                this.$el.append(html);
            },
            _bind: function(funcName) {
              var that = this;
              return function() { that[funcName].apply(that, arguments) };
            },
        });
        return Koyomi;
    })();
    function buildWeek() {
        var html  =       '';
        Object.keys(weekData).forEach(function(value, index) {
            html += '<td class="'+weekData[value].class+'">'+weekData[value].name+'</td>';
        });
        return html;
    }
    function buildMain() {
        //曜日
        var firstDay = new Date(settings.year, settings.month-1, 1);    //初日の曜日
        var endDay   = new Date(settings.year, settings.month,   0);    //月の最終日
        var i        = 0;
        var counter  = Counter(0);
        var html     = '';
        //before余白
        if(settings.weekBeginning != firstDay.getDay()) {
            html += '<tr>';
            while(counter.getWeekNum() != firstDay.getDay()) {
                html += '<td></td>';
                counter.countUp();
            }
        }
        for(var i=1; i<=endDay.getDate(); i++) {
            if(!counter.getCellNum()) {
                html += '<tr>';
            }
            html += '<td>'+i+'</td>';
            counter.countUp();
            if(!counter.getCellNum()) {
                html += '</tr>';
            }
        }
        //after余白
        if(counter.getCellNum()) {
            while(counter.getCellNum()) {
                html += '<td></td>';
                counter.countUp();
            }
            html += '</tr>';
        }
        return html;
    }
    function initWeekObject() {
        var counter = Counter(settings.weekBeginning);
        var result  = new Object;
        for(var j=0; j < 7; j++) {
            result[j] = {'name': settings.weekName[counter.getCellNum()], 'class': settings.weekClass[counter.getCellNum()]}
            counter.countUp();
        }
        return result;
    }
}) (jQuery);


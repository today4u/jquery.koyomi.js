;(function(jQuery) {
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
                "useJapaneseEra": 0,
                "japaneseEras": [
                    {"name":"明治","firstDate":"1868-01-25", "lastDate":"1912-07-29"},
                    {"name":"大正","firstDate":"1912-07-30", "lastDate":"1926-12-24"},
                    {"name":"昭和","firstDate":"1926-12-25", "lastDate":"1989-01-07"},
                    {"name":"平成","firstDate":"1989-01-08"},
                ],
                "weekBeginning": 0, //0-6
                "dowClass" : ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
                "url": "http://example.com/%year%/%month%/%day%/",
                "eventDates": {
                    "dates" :  [],
                    "yearly":  [],
                    "monthly": [],
                },
                "language": "en"
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
    var strToDate = function(string) {
        var array = string.split('-');
        return new Date(array[0], array[1]-1,   array[2]);
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
                html +=     this.buildHead();
                html +=     this.buildMain();
                html += '</table>';
                html += '</div>';
                this.$el.append(html);
            },
            buildHead: function() {
                var labels    = getLabels(this.settings.language);
                var headLabel = this.settings.headLabel;
                headLabel = headLabel.replace('%month%',labels.month[this.settings.FirstDay.getMonth()]);
                headLabel = headLabel.replace('%year%', this.settings.FirstDay.getFullYear());
                if(this.settings.useJapaneseEra) {
                    headLabel = headLabel.replace('%era%',  this.getJapaneseEra());
                }
                var colspan = 7;
                var tr   = $('<tr></tr>');
                if(this.settings.prevNext) {
                    colspan = 5;
                    tr.append($('<td></td>').append($('<div class="prev"></div>').text(this.settings.prevSign)));
                }
                $(tr).append($('<td colspan="'+colspan+'">').append($('<div class="headLabel"></div>').text(headLabel)));
                if(this.settings.prevNext) {
                    tr.append($('<td></td>').append($('<div class="next"></div>').text(this.settings.nextSign)));
                }
                return $('<thead></thead>').append(tr).prop("outerHTML");
                //return thead.prop("outerHTML");
            },
            buildMain: function() {
                var lastDay   = new Date(this.settings.FirstDay.getFullYear(), this.settings.FirstDay.getMonth()+1, 0);
                var counter   = Counter(0, this.settings.weekBeginning);
                var weekData  = this.initWeekObject();
                //
                var tbody     = $('<tbody></tbody>');
                var tr        = $('<tr></tr>');
                Object.keys(weekData).forEach(function(value, index) {
                    tr.append($('<th></th>').addClass(weekData[value].class).text(weekData[value].name));
                });
                $(tbody).append(tr);
                //before 
                if(this.settings.weekBeginning != this.settings.FirstDay.getDay()) {
                    tr = $('<tr></tr>');
                    while(counter.getWeekNum() != this.settings.FirstDay.getDay()) {
                        tr.append($('<td></td>').addClass(this.settings.dowClass[counter.getWeekNum()]));
                        counter.countUp();
                    }
                }
                //numbers
                for(var i=1; i<=this.settings.LastDay.getDate(); i++) {
                    var Day = new Date(this.settings.FirstDay.getFullYear(), this.settings.FirstDay.getMonth(), i);
                    if(!counter.getCellNum()) {
                        tr = $('<tr></tr>');
                    }
                    var attributes = []
                    attributes.push(this.settings.dowClass[counter.getWeekNum()]);
                    attributes.push('date_'+Day.getFullYear()+'-'+zeroPadding(Day.getMonth()+1,2)+'-'+zeroPadding(Day.getDate(),2) );// date_yyyy-mm-dd
                    var url = this.settings.url;
                    url = url.replace('%year%' ,this.settings.FirstDay.getFullYear());
                    url = url.replace('%month%',this.settings.FirstDay.getMonth()+1);
                    url = url.replace('%day%'  ,i);
                    //
                    var div  = $('<div></div>').attr('data-url',url).addClass("number").text(i);
                    tr.append($('<td></td>').addClass(attributes.join(' ')).append(div) );
                    counter.countUp();
                    if(!counter.getCellNum()) {
                        tbody.append(tr);
                    }
                }
                //after
                if(counter.getCellNum()) {
                    while(counter.getCellNum()) {
                        tr.append($('<td></td>').addClass(this.settings.dowClass[counter.getWeekNum()]));
                        counter.countUp();
                    }
                    tbody.append(tr);
                }
                return tbody.prop("outerHTML");
                //return html;
            },
            initWeekObject: function() {
                var labels  = getLabels(this.settings.language);
                var counter = Counter(this.settings.weekBeginning, this.settings.weekBeginning);
                var result  = new Object;
                for(var i=0; i<7; i++) {
                    result[i] = {"name": labels.dow[counter.getCellNum()], "class": this.settings.dowClass[counter.getCellNum()]}
                    counter.countUp();
                }
                return result;
            },
            getJapaneseEra: function() {
                var settings   = this.settings;
                var result = [];
                $.each(settings.japaneseEras, function(i, value) {
                    var firstDate = strToDate(value.firstDate);
                    if(value.lastDate !== undefined) {
                        var lastDate  = strToDate(value.lastDate);
                    }
                    switch(true) {
                        case firstDate.getTime() <= settings.LastDay.getTime()  && value.lastDate    === undefined:
                        case firstDate.getTime() <= settings.FirstDay.getTime() && lastDate.getTime() >= settings.FirstDay.getTime():
                            result.push((function(name) {
                                var eraYear = settings.FirstDay.getFullYear()+1 - firstDate.getFullYear();
                                if(eraYear === 1) {
                                    return name+'元年';
                                } else {
                                    return name+eraYear+'年';
                                }
                            })(value.name));
                            break;
                        default:
                            break;
                    }
                });
                return result.join('/');
            },
            _bind: function(funcName) {
                var that = this;
                return function() { that[funcName].apply(that, arguments) };
            }
        });
        return Koyomi;
    })();
    var getLabels = function(lang) {
        if(lang === undefined || lang === false) {
            lang = 'en';
        }
        switch(lang) {
            case 'ja':
                return {
                    dow:   ['日', '月', '火', '水', '木', '金', '土'],
                    month: ['1月','2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
                };
            case 'en':
            default:
                return {
                    dow:   ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                    month: ['January','February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                };
        }
    }
}) (jQuery);

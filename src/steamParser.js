var fs = require('fs');
var path = require('path');
var assert = require('assert').ok;

var StdClass = require('./stdclass');

/**
 * parser css file by the way of FileSteam
 * @constructor
 * @extends StdClass
 */
function SteamParser(){
    StdClass.apply(this, arguments);
}

StdClass.extend(SteamParser, StdClass, {

    attributes: {
        //file path
        file: '',
        //selector collections
        selectors : [],
        //property collections
        properties : [],
        //value collections
        values : [],
        //history of events
        history : [],
        //right now status
        //{'start' | 'ruleStart' | 'ruleEnd' | 'valueStart' | 'valueEnd' |
        // 'selectorBreak'}
        status : '',
        timeStart : '',
        timeEnd : ''
    },

    /**
     * @const
     */ 
    CONSIT: {

        DISMEMBER: {
            123 : 'ruleStart',// "{"
            125 : 'ruleEnd',// "}"
            58  : 'valueStart',// ":"
            59  : 'valueEnd',// ";"
            44  : 'selectorBreak' // ","
        },

        IGNORE: {
            10 : 'ENTER',// "\n"
            13 : 'ENTER',// "\r"
            32 : 'EMPTY',// "\s"
            9  : 'EMPTY',// "\t"
            47 : 'COMMENT_START',// "/*"
            42 : 'COMMENT_END'// "*/"
        },

        MAX_LEN_HISTORY: 10,
        TRIM_REG: /(^\s+)|(\s+$)/g
    },

    _init: function init(){

        var file = this.get('file');
        if (!file) return;

        this.set('timeStart', (new Date()).getTime());
        var steam = fs.createReadStream(file);
        this._steam = steam;
        this._bind();
    },

    _bind: function bind(){
        this._addEvent('start');
        this._steam.on('data', this._read.bind(this));
        this._steam.on('end', this._readEnd.bind(this));

        this.on("change:status:selectorBreak, change:status:ruleStart",
            this._addSelector);
        this.on("change:status:valueStart", this._addProperty);
        this.on("change:status:valueEnd", this._addValue);
        this.on("change:status:ruleEnd", this._fixEnd);
    },

    //fix the problem when have some empty rule such as
    //.foo {}
    //remove the selector in the collections of selector
    _fixEnd: function(e){
        var selectors ;
        if (e.old === 'ruleStart'){
            selectors = this.get('selectors');
            //delete the last selector
            selectors.pop();
        }
    },

    _addSelector: function addSelector(e){
        var isNew = e.old != 'selectorBreak';
        var selector = this._getLast(isNew);
        selector && selector.push(e.data);
    },

    _addProperty: function addProperty(e){
        var isNew = e.old == 'ruleStart';
        var property = this._getLast(isNew, 'properties');
        property && property.push(e.data);
    },

    _addValue: function addValue(e){
        var history = this.get('history');
        var len = history.length;
        var preStatus = history[len - 3];
        var isNew = preStatus == 'ruleStart';
        var value = this._getLast(isNew, 'values');

        value && value.push(e.data);
    },

    /**
     * get last item of selectors or properties or values
     * @param isNew {bool} if isNew, push it an new empty array, if isNew 
     * is null, isNew equal to false
     * @param opt_key {string} selectors | properties | values
     * by default opt_key is selectors
     */
    _getLast: function getLast(isNew, opt_key){
        opt_key = opt_key || 'selectors';
        var items = this.get(opt_key);

        if (isNew) items.push([]);
        var len = items.length;
        return items[len - 1];
    },

    /**
     * push event to history, when history.length > this.get('MAX_LEN_HISTORY')
     * shift the last recode
     * @param {string} ev event name
     */
    _addEvent: function addEvent(ev, val){

        var history = this.get('history');
        var maxLen  = this.get('MAX_LEN_HISTORY');
        history.push(ev);

        if (history.length > maxLen) history.shift();

        this.set('status', ev, true, {data: val});
    },

    /**
     * read data steam
     */
    _read: function read(data){

        var dismember = this.get('DISMEMBER');
        var i = 0, j = 0;
        var comment = false;
        var len = data.length;
        var code = data[0];
        var val;
        console.log("one\n");

        while(code){

            //comment end
            if (code === 42 && data[i + 1] === 47){
                comment = false;
                i++;
                j = i + 1;
            } else if (code === 47 && data[i + 1] === 42){
            //comment start
                comment = true;
                i++;
            } else if (!comment && code in dismember){

                var status = this.get('status');
                //filter the condiction of semicolon(,) in css rule such as
                //_filter: xxx(src=url, sizingMethod='crop')
                var isFalseSelecterBreak = code === 44 && 
                        status == 'valueStart';
                //filter the condiction of pseudo selector(:)
                var isPseudo = code == 58 && status != 'ruleStart' &&
                        status != 'valueEnd';
                if (isPseudo || isFalseSelecterBreak){
                    isFalseSelecterBreak && console.log(status);
                    code = data[++i];
                    continue;
                }

                val = data.asciiSlice(j, i).replace(this.get('TRIM_REG'), '');
                this._addEvent(dismember[code], val);
                j = i + 1;
            }

            code = data[++i];
        }

    },
    _readEnd: function readEnd(){
        this.set('timeEnd', (new Date()).getTime());
        console.log(['end', this.get('timeEnd') - this.get('timeStart')]);
        //console.log(this.get('selectors'));
        //console.log(this.get('properties'));
        assert.equal(this.get('values').length, this.get('properties').length);
        assert.equal(this.get('selectors').length, this.get('values').length);
    }

});

module.exports = SteamParser;

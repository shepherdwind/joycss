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
        //single line rules, such as {charset "UTF-8";}
        metas: {},
        //history of events
        history : [],
        //right now status
        //{'start' | 'ruleStart' | 'ruleEnd' | 'valueStart' | 'valueEnd' |
        // 'selectorBreak'}
        status : '',
        //nest level
        nest : 0,
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
        TRIM_REG: /(^\s+)|(\s+$)/g,
        RULE_END_EVT: 'ruleEnd'
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

        this.on('change:status:ruleStart', this._ruleStart);
        this.on("change:status:selectorBreak", this._addSelector);
        this.on("change:status:valueStart", this._addProperty);
        this.on("change:status:valueEnd", this._addValue);
        this.on("change:status:ruleEnd", this._ruleEnd);

    },

    /**
     * 1. fix the problem when have some empty rule such as
     * @example .foo {}
     * remove the selector in the collections of selector
     * 2. fix when the last value don't end with the semicolon
     * @example .foo { color: red }
     */
    _ruleEnd: function ruleEnd(e){

        this.attributes.nest--;
        var selectors ;
        var isNew = false;

        if (e.old === 'ruleStart'){
            selectors = this.get('selectors');
            //delete the last selector
            selectors.pop();

            return;
        } else if (e.old === 'valueStart') {
            this._addValue(e);
        }

        if (!this.attributes.nest){
            this.fire(this.get('RULE_END_EVT'), {
                selectors : this._getLast(isNew),
                properties : this._getLast(isNew, 'properties'),
                values : this._getLast(isNew, 'values')
            });
        }
    },

    _ruleStart: function ruleStart(e){
        var isNew = true;
        this._addSelector(e);

        if (e.old === 'ruleStart') {
            this._getLast(isNew, 'properties');
            this._getLast(isNew, 'values');
        }
        ++this.attributes.nest;
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

    /**
     * add value and when meet with single rule, such as '@charset "UTF-8";',
     * push the is to the object of metas
     */
    _addValue: function addValue(e){

        var len;

        if (e.old === 'valueStart') {
            var history = this.get('history');
            len = history.length;
            var preStatus = history[len - 3];
            isNew = preStatus == 'ruleStart';
            value = this._getLast(isNew, 'values');

            value && value.push(e.data);
        } else {
            var metas = this.get('metas');
            var selectors = this.get('selectors');
            len = selectors.length;
            metas[len] = metas[len] || [];
            var data = '';

            /*when @import url("booya.css") print, screen;*/
            if (e.old === 'selectorBreak'){
                data = selectors.pop().join(', ') + ', ';
            }

            data += e.data;
            metas[len].push(data);
        }
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
        var len = items.length;

        if (isNew) {
            len++;
            items.push([]);
            if (this.get('nest') > 1) items[len - 2].push(items[len - 1]);
        }

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
     * read data steam, loop exam the assic code one by one. filter the comment
     * and when meet with code in dismember, fire some event, then change the
     * property of status, push event into the array of history, and deliver a
     * string of selector or property or value.
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
        console.log(this.get('metas'));
        //console.log(this.get('selectors'));
        //console.log(this.get('properties'));
        //console.log(this.get('values'));
        assert.equal(this.get('selectors').length, 
            this.get('values').length, 'selectors is not equal values'); 
        assert.equal(this.get('values').length, 
            this.get('properties').length, 'values is not equal properties');
    }

});

module.exports = SteamParser;

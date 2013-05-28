/**
 * parser css file by the way of FileSteam, support the less file. That mean
 * that this can deal with the nest rule, such as:
 * @example 1
 * <code css>
 * @charset "UTF-8"
 * @import url("booya.css") print,screen, print;
 * a { 
 *  .foo { color: red;}
 *  .foo2 { 
 *     color: blue; 
 *     .foo2-1 { 
 *       color: yello; 
 *     }
 *   }
 * }
 * </code>
 * Althought you may never write css like this, but, when meet with @media, you
 * may need nest rule support.
 *
 * Some meta info for example @charset "UTF-8" stored in the metas object, get 
 * it in the property metas, such as
 * @example 2
 * <code>
 *  var p = new CssReader({
 *      file: 'path/to/cssfile.css'
 *  });
 *  //when the property timeEnd setted, parser css is finished
 *  p.on('change:timeEnd', function(e){
 *      var metas = p.get('metas');
 *  });
 * </code>
 * the css rule of example 1, the metas is 
 * { '0': ['@charset "UTF-8"', '@import url("booya.css") print, screen, print']}
 * the key in metas object represent where it should set to.
 *
 * when one rule is finish, you can watch the event 'RULE_END_EVT'(get by 
 * parser.get('RULE_END_EVT')), you can get a object of css rule object, at
 * example 1, you can get this kind object
 * {
 *   selector: ['a', ['.foo'], ['.foo2', ['.foo2-1']]],
 *   property: [['color'], ['color', [ 'color']]],
 *   value: [['red'], ['blue', ['yello']]]
 * }
 */

var fs = require('fs');
var path = require('path');
var assert = require('assert').ok;
var util = require('util');

var StdClass = require('../common/stdclass');

/**
 * @constructor
 * @extends StdClass
 */
function CssReader(){
  StdClass.apply(this, arguments);
}

StdClass.extend(CssReader, StdClass, {

  attributes: {
    //file path
    file: '',
    copyFile: '',
    text: '',
    //selector collections
    selectors : [],
    //property collections
    properties : [],
    //value collections
    values : [],
    //single line rules, such as {charset "UTF-8";}
    metas: {},
    idList: [],
    //history of events
    history : [],
    //right now status
    //{'start' | 'ruleStart' | 'ruleEnd' | 'valueStart' | 'valueEnd' |
    // 'selectorBreak'}
    status : '',
    //nest level
    nest : [],
    lines: [],
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
    if (file) {
      this.set('timeStart', (new Date()).getTime());
      var steam = fs.createReadStream(file);
      var copyFileName = this.get('copyFile');

      if (copyFileName && copyFileName !== file){
        var copyFile = fs.createWriteStream(copyFileName);
        util.pump(steam, copyFile);
      }

      this._steam = steam;
    } else {
      var text = this.get('text');
      if (!text) return;
    }

    this._bind();
  },

  _bind: function bind(){

    this._addEvent('start');
    var text = this.get('text');

    this.on('change:status:ruleStart'     , this._ruleStart);
    this.on("change:status:selectorBreak" , this._addSelector);
    this.on("change:status:valueStart"    , this._addProperty);
    this.on("change:status:valueEnd"      , this._addValue);
    this.on("change:status:ruleEnd"       , this._ruleEnd);

    if (!text){
      this._steam.on('data', this._read.bind(this));
      this._steam.on('end', this._readEnd.bind(this));
    } else {
      var _this = this;
      setTimeout(function(){
        _this._read(text);
        _this._readEnd();
      }, 10);
    }
  },

  /**
   * 1. fix the problem when have some empty rule such as
   * @example .foo {}
   * remove the selector in the collections of selector
   * 2. fix when the last value don't end with the semicolon
   * @example .foo { color: red }
   */
  _ruleEnd: function ruleEnd(e){

    var selectors ;

    if (e.old === 'ruleStart'){
      selectors = this.get('selectors');
      //delete the last selector
      selectors.pop();
      var lines = this.get('lines');
      lines.pop();

      this.attributes.nest.pop();

      return;
    } else if (e.old === 'valueStart') {
      this._addValue(e);
    }

    ruleEnd.recode = ruleEnd.recode || 0;
    ruleEnd.recode++;
    this.attributes.nest.pop();

    if (!this.attributes.nest.length){
      var num = this.getLen() - ruleEnd.recode;
      ruleEnd.recode = 0;
      var idList = this.get('idList');
      idList.push(num);
      this.fire(this.get('RULE_END_EVT'), this.getRule(num));
    }
  },

  _ruleStart: function ruleStart(e){

    var isNew = true;
    if (e.old === 'ruleStart') {
      //@media print { li.inline { color: red; } }
      this._getLast(isNew, 'properties');
      this._getLast(isNew, 'values');
    }

    this.attributes.nest.push(this.getLen());
    this._addSelector(e);
  },

  _addSelector: function addSelector(e){
    var isNew = e.old != 'selectorBreak';
    var selector = this._getLast(isNew);
    var lines = this.get('lines');
    if (selector){
      selector.push(e.data);
      if (isNew) lines.push(e.line);
    }
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
        var lines = this.get('lines');
        lines.pop();
      }

      data += e.data;
      metas[len].push(data);
    }
  },

  getRule: function(i){
    var selectors = this.get('selectors');
    var properties = this.get('properties');
    var values = this.get('values');
    var lines = this.get('lines');

    i = parseInt(i, 10);
    if(this.getLen() > i){
      return {
        selector: selectors[i],
        property: properties[i],
        value: values[i],
        id: i,
        line: lines[i]
      };
    } else {
      return false;
    }
  },

  getLen: function(){
    return this.attributes.selectors.length;
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

    if (isNew){
      len++;
      items.push([]);

      var nest = this.get('nest');
      var nLen = nest.length;
      if (nLen > 1){
        //console.log([nest, nest[nLen - 2], len - 1]);
        //push the new rule to is father
        items[nest[nLen - 2]].push(items[len - 1]);
      }
    }

    return items[len - 1];
  },

  /**
   * push event to history, when history.length > this.get('MAX_LEN_HISTORY')
   * shift the last recode
   * @param {string} ev event name
   */
  _addEvent: function addEvent(ev, val, line){

    var history = this.get('history');
    var maxLen  = this.get('MAX_LEN_HISTORY');
    history.push(ev);

    if (history.length > maxLen) history.shift();

    this.set('status', ev, true, {data: val, line: line});
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
    var line = 1;
    var val;
    var slice = data.asciiSlice ? 'asciiSlice' : 'slice';
    //console.log("one\n");

    while(code){

      if (typeof code == 'string') code = code.charCodeAt();
      if (code === 10 || code === 13){
        var isoneLine = code === 10 && data[i - 1] === 13;
        //isoneLine = isoneLine || (code === 10 && data[i - 1] === 13);
        if (!isoneLine) line = line + 1;
      } else if (code === 42 && (data[i + 1] === 47 || data[i + 1] == '/')){
        //comment end 
        comment = false;
        i++;
        j = i + 1;
      } else if (code === 47 && (data[i + 1] === 42 || data[i + 1] == '*')){
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

        val = data[slice](j, i).replace(this.get('TRIM_REG'), '');
        this._addEvent(dismember[code], val, line);
        j = i + 1;
      }

      code = data[++i];
    }

  },

  _readEnd: function readEnd(){
    this.set('timeEnd', (new Date()).getTime());
    //console.log(['end', this.get('timeEnd') - this.get('timeStart')]);
    //console.log(this.get('metas'));
    //console.log(this.get('selectors'));
    //console.log(this.get('lines'));
    //console.log(this.get('properties'));
    //console.log(this.get('values'));
    assert.equal(this.get('selectors').length, this.get('values').length, 
      'the lenght of selectors is not equal to the lenght of values'); 
    assert.equal(this.get('values').length, this.get('properties').length, 
      'the length of values is not equal to the length of properties');
  }

});

module.exports = CssReader;

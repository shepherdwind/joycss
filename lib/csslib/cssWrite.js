var StdClass  = require('../common/stdclass');
var forEach   = require('../common/utils').forEach;
var fs        = require('fs');
var path      = require('path');
var exists    = fs.existsSync || path.existsSync;

function cssWrite(){
  StdClass.apply(this, arguments);
}

var red, blue, reset;
red   = '\033[31m';
blue  = '\033[34m';
reset = '\033[0m';

function dateFormat (date, fstr, utc) {
  utc = utc ? 'getUTC' : 'get';
  return fstr.replace (/%[YmdHMS]/g, function (m) {
    switch (m) {
      case '%Y': return date[utc + 'FullYear'] (); // no leading zeros required
      case '%m': m = 1 + date[utc + 'Month'] (); break;
      case '%d': m = date[utc + 'Date'] (); break;
      case '%H': m = date[utc + 'Hours'] (); break;
      case '%M': m = date[utc + 'Minutes'] (); break;
      case '%S': m = date[utc + 'Seconds'] (); break;
      default: return m.slice (1); // unknown code, remove %
    }
    // add leading zero if required
    return ('0' + m).slice (-2);
  });
}

var VERSION = '0.4.12';

StdClass.extend(cssWrite, StdClass, {

  attributes: {
    useImportant : false,
    destFile     : '',
    file         : '',
    cssText      : '',
    extraRules   : {},
    changedRules : {},
    cssReader    : {}
  },

  CONSIT: {},

  _init: function(){
    var date =  dateFormat (new Date (), "%Y-%m-%d %H:%M:%S");
    this.cssText = "/** generate by joycss v" + VERSION + ", on time: " + date + " */\n";
  },

  write: function(changedRules, extraRules, opt_fn){
    debugger;
    var cssReader = this.get('cssReader');
    var idList = cssReader.get('idList');

    forEach(extraRules, this._writeRule, this);

    forEach(idList, function(id){
      var rule = cssReader.getRule(id);
      rule = changedRules[id] || rule;
      this._writeRule(rule);
    }, this);

    var imageUrlReg = /url\(['"]*([a-z0-9A-Z&?=_\-.,\[\]\/\\]+)['"]*\)/;
    var images = [];
    forEach(extraRules, function(rule){
      var uri = imageUrlReg.exec(rule.value);
      images.push( red + uri[1] + reset);
    });
    opt_fn ? opt_fn(this.cssText) : this._writeFile();
    console.log();
    console.log('[image sprited url] ' + images.join(','));
  },

  replace: function(maps){
    maps = maps || {};
    var images = [];
    forEach(maps, function(fileurl, file){
      this.cssText = this.cssText.replace(file, fileurl);
      images.push(red + fileurl + reset);
    }, this);
    this._writeFile();
    console.log('[image url replaced] ' + images.join(','));
  },

  _writeFile: function(){
    //var destFile = path.basename(this.get('destFile'));
    var destFile = this.get('destFile');
    fs.writeFileSync(destFile, this.cssText);
    console.log('[css write]write file ' + destFile + ' success');
  },

  /**
   * 写一条css规则，结果合并到this.cssText
   * @param {object} rule css rule
   */
  _writeRule: function(rule){
    var self = this;
    var cssText = '';
    var subs = [];
    var selectors = [];

    var index = 0;
    function findNest(){
      if (rule.property[index] instanceof Array){
        return {
          property: rule.property[index],
          value: rule.value[index]
        };
      } else {
        findNest(index++);
      }
    }

    forEach(rule.selector, function(selector){
      var sub = {
        selector: [],
        value: [],
        property: []
      };
      if (selector instanceof Array){
        sub = findNest();
        sub.selector = selector;
        index++;
        subs.push(sub);
      } else {
        selectors.push(selector);
      }
    });

    cssText += selectors.join(",\n") + " {\n";

    forEach(rule.property, function(p, i){
      if (!(p instanceof Array)){
        cssText += '  ' + p + ': ' + rule.value[i] + ";\n";
      }
    });

    this.cssText += cssText;

    forEach(subs, function(sub){
      this._writeRule(sub);
    }, this);

    this.cssText += "}\n";
  }

});

module.exports = cssWrite;

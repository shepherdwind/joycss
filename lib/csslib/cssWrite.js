var StdClass  = require('../common/stdclass');
var forEach   = require('../common/utils').forEach;
var fs        = require('fs');
var path      = require('path');
var exists    = fs.existsSync || path.existsSync;
var config    = require("../common/config");
var VERSION   = config.system("version");

function cssWrite(){
  StdClass.apply(this, arguments);
}

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
    this.cssText = this._getHeader();
  },

  _getHeader: function(){
    var date = dateFormat (new Date (), "%Y-%m-%d %H:%M:%S");
    return "/** generate by joycss v" + VERSION + ", on time: " + date + " */\n";
  },

  /**
   * 写入css规则，数据来源于cssReader实例对象
   * @param changedRules {object} 需要替换的规则，覆盖cssReader中的规则
   * @param extraRules object 写入头部的规则，通常是css
   * sprite，在cssReader对象中加入其他规则
   * @param opt_fn function 回调函数，如果不写，默认情况是把css写入destFile
   * @return this
   */
  write: function(changedRules, extraRules, opt_fn){

    var cssReader = this.get('cssReader');
    changedRules = changedRules || {};
    extraRules   = extraRules || {};

    // 写入sprite图片规则
    forEach(extraRules, this._writeRule, this);

    cssReader.iterator(function(rule){

      if (!rule.type) {

        var id = rule.id;
        // 替换原有的规则
        rule = changedRules[id] || rule;
        this._writeRule(rule);

      } else {

        this.cssText += rule.value + "\n";

      }

    }, this);

    opt_fn ? opt_fn(this.cssText) : this._writeFile();
    return this;
  },

  /**
   * 替换css中的图片
   * @param maps object 图片替换的map
   * @param opt_fn function 回调函数，如果不填，默认把文件写入到destFile
   * @return this
   */
  replace: function(maps, op_fn){

    maps = maps || {};

    forEach(maps, function(fileurl, file){
      this.cssText = this.cssText.replace(file, fileurl);
    }, this);

    opt_fn ? opt_fn(this.cssText) : this._writeFile();
    return this;
  },

  _writeFile: function(){

    var destFile = this.get('destFile');

    if (fs.existsSync(destFile)) {
      fs.writeFileSync(destFile, this.cssText);
    } else {
      console.log("Error, cssWrite can not write an file: '%s' not exists", destFile);
      process.exists(1);
    }

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

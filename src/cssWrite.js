var StdClass  = require('../lib/stdclass');
var forEach   = require('../lib/utils').forEach;
var fs        = require('fs');
var path      = require('path');
var exists    = fs.existsSync || path.existsSync;

function cssWrite(){
  StdClass.apply(this, arguments);
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
    this.cssText = '';
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

    opt_fn ? opt_fn(this.cssText) : this._writeFile();
  },

  replace: function(maps){
    forEach(maps, function(fileurl, file){
      this.cssText = this.cssText.replace(file, fileurl);
    }, this);
    this._writeFile();
  },

  _writeFile: function(){
    var destFile = path.basename(this.get('destFile'));
    fs.writeFile(destFile, this.cssText, function(err){
      if (err){
        console.log(err);
      } else {
        console.log('[css write]write file ' + destFile + ' success');
      }
    });
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

/**!
 * 获得css中所有需要处理的区块，计算图片信息
 *
 * Copyright(c) Eward.song Limited.
 * MIT Licensed
 *
 * Authors:
 *   Eward <eward.song@gmail.com> (http://shepherdwind.com)
 */

var util = require('util');
var css = require('css');

var walk = require('./walk');

function slice(cssText){

  if (!cssText || typeof cssText !== 'string') {
    return;
  }

  var asts = css.parse(cssText, {});
  return walk(asts, collect);
}


/**
 * 收集所有需要处理的图片
 *
 */

// 背景图正则
var IMG_URL_REG = /url\(['"]*([a-z0-9A-Z&?=_\-.,\[\]\/\\]+)['"]*\)/;

// 找到所有有图片的样式规则
function collect(ast){
  var ret;
  var rules = ast.declarations;
  if (!util.isArray(rules)) {
    return;
  }
  var props = ['background', 'background-image'];
  rules.forEach(function(rule){
    if (props.indexOf(rule.property) === -1) {
      return;
    }

    var value = rule.value;
    var uri = IMG_URL_REG.exec(value);
    if (uri && uri[1]) {
      ret = { img: uri[1], ast: ast };
    }
  });

  return ret;
}

module.exports = slice;

/**!
 * 获得css中所有需要处理的区块，计算图片信息
 *
 * Copyright(c) Eward.song Limited.
 * MIT Licensed
 *
 * Authors:
 *   Eward <eward.song@gmail.com> (http://shepherdwind.com)
 */
'use strict';

var util = require('util');

var walk = require('./walk');

function slice(asts){
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
  rules.forEach(function(rule, i){
    if (props.indexOf(rule.property) === -1) {
      return;
    }

    var value = rule.value;
    var uri = IMG_URL_REG.exec(value);
    if (uri && uri[1] && !shouldIgnore(uri[1])) {
      ret = { img: uri[1], ast: ast, index: i };
    }
  });

  return ret;
}

var url = require('url');
/**
 * 参数后面有?ecs的需要忽略
 */
function shouldIgnore(uri){
  var query = url.parse(uri, true).query;
  return 'esc' in query;
}

module.exports = slice;

/**!
 * 对css解析后得到的ast进行运算，依次查找语法树，直到找到包含css规则的定义的对象
 * 依次执行传入的函数，并且返回结果，如果返回为undefined，则忽略
 *
 * Copyright(c) Eward.song Limited.
 * MIT Licensed
 *
 * Authors:
 *   Eward <eward.song@gmail.com> (http://shepherdwind.com)
 */
'use strict';

var util = require('util');

/**
 * 类似于Array.prototype.forEach，遍历css语法树，执行某个函数，并且返回数组
 *
 * @param {object} asts css语法树对象
 * @param {function} fn 执行函数，函数的第一个参数，是包含declarations的一组css
 *        规则语法描述
 * @return {array} 函数迭代后的结果数组
 */
function walk(asts, fn){

  var ret = [];

  if (util.isArray(asts)) {
    asts.forEach(function(ast){
      var val = walk(ast, fn);
      if (val !== undefined) ret = ret.concat(val);
    });
    return ret;
  }

  // 如果存在rules描述，查找rules
  if (asts.rules) {
    var val = walk(asts.rules, fn);
    if (val !== undefined) ret = ret.concat(val);
    return ret;
  }

  var type = asts.type;
  // 如果asts包含declarations属性，表示为一组css描述规则
  if (asts['declarations']) {
    return fn(asts);
  }

  // stylesheet, media, keyframes等
  if (asts[type]) {
    var val = walk(asts[type], fn);
    if (val !== undefined) ret = ret.concat(val);
  }

  return ret;

}

module.exports = walk;

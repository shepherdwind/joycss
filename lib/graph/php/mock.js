/**!
 * 模拟接口实现，当在没有php环境的情况下，使用mock来模拟数据接口响应，比如用于
 * TRAVIS测试用例
 *
 * Copyright(c) Eward.song Limited.
 * MIT Licensed
 *
 * Authors:
 *   Eward <eward.song@gmail.com> (http://shepherdwind.com)
 */
'use strict';
exports.size = function* (files){
  var ret = {};
  files.forEach(function(file){
    ret[file] = {
      width: 30,
      height: 30,
      type: 2
    };
  });
  return ret;
};

var fs = require('co-fs');
exports.merge = function*(filename, conf) {
  yield fs.writeFile(filename, 'hello png');
  return {
    info: 'hello'
  };
};

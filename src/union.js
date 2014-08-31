/**!
 * 拼图等任务中间过程
 *
 * Copyright(c) Eward.song Limited.
 * MIT Licensed
 *
 * Authors:
 *   Eward <eward.song@gmail.com> (http://shepherdwind.com)
 */

'use strict';

var path = require('path');

var read = require('./read/index');
var slice = require('./css/slice');
var position = require('./css/position');
var Graph = require('./graph/index')();

/**
 * 拼图操作
 *
 */
function* merge(file, destImg){
  var css = yield read(file);
  var pieces = slice(css);
  var config = yield position(pieces, file);

  // 执行拼图操作
  var graph = new Graph(path.dirname(file));
  var cli = yield graph.merge(destImg, config);

  return cli;
}

module.exports = {
  merge: merge
};

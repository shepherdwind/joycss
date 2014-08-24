/**!
 * position, 计算图片的位置
 *
 * Copyright(c) Eward.song Limited.
 * MIT Licensed
 *
 * Authors:
 *   Eward <eward.song@gmail.com> (http://shepherdwind.com)
 */

var path = require('path');

var Graph = require('../graph/index')();

function* position(slice, file){
  var graph = new Graph(path.dirname(file));
  var images = slice.map(function(s){ return s.img; });
  var size = yield graph.size(images);
  console.log(size);
}

module.exports = position;

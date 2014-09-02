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
var css = require('css');

var read = require('./read/index');
var slice = require('./css/slice');
var position = require('./css/position');
var Graph = require('./graph/index')();

var rework = require('./rework-sprite');
/**
 * 拼图操作
 *
 */
function* merge(file, destImg, destCss){
  var cssText = yield read(file);
  var asts = css.parse(cssText, {});
  var pieces = slice(asts);
  var config = yield position(pieces, file);

  // 执行拼图操作
  var graph = new Graph(path.dirname(file));
  var cli = yield graph.merge(destImg, config);

  var imagePath = getReltivePath(destCss, destImg);
  var rules = rework(pieces, config.images, imagePath);
  // 合并后的样式加入到规则最前面
  asts.stylesheet.rules.unshift(rules);

  var resultCSS = css.stringify(asts);
  console.log(resultCSS);

  return resultCSS;
}


function getReltivePath(cssPath, imgPath){
  var cssDir = path.dirname(cssPath);
  return path.relative(cssDir, imgPath);
}

module.exports = {
  merge: merge
};

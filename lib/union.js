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
var mkdirp = require('mkdirp');
var thunkify = require('thunkify');

var read = require('./read/index');
var slice = require('./css/slice');
var position = require('./css/position');
var Graph = require('./graph/index')();

var rework = require('./css/rework');
var pngqunat = require('./pngquant/exec');
/**
 * 拼图操作
 *
 */
function* merge(file, option){

  var cssText = option.cssText;
  if (!cssText) cssText = yield read(file);

  var destImg = option.destImg;
  var destCss = option.destCss;

  var asts = css.parse(cssText, {});
  var pieces = slice(asts);
  var config = yield position(pieces, file, option.layout);

  // 如果是从文件夹中读取，不需要dirname运行
  var pathRoot = path.extname(file) ?
    path.dirname(file):
    file;

  // 执行拼图操作
  var graph = new Graph(pathRoot);

  // 生成图片目标路径
  yield thunkify(mkdirp)(path.dirname(destImg));
  var cli = yield graph.merge(destImg, config);

  var imagePath = getReltivePath(destCss, destImg);

  var alpha = !option.force8bit;
  if (!alpha) {
    var success = yield* qunat(destCss, imagePath);
    // 如果生成png8成功，那么兼容png8，否则不生成png8样式，alpha为true
    alpha = success ? alpha : true;
  }

  var rules = rework(pieces, config.images, imagePath, alpha);
  // 合并后的样式加入到规则最前面
  asts.stylesheet.rules.unshift(rules);

  var resultCSS = css.stringify(asts);

  return resultCSS;
}


function getReltivePath(cssPath, imgPath){
  var cssDir = path.dirname(cssPath);
  return path.relative(cssDir, imgPath);
}

function* qunat(destCss, img){
  var base = path.dirname(destCss);
  return yield* pngqunat.run(base, img);
}

module.exports = {
  merge: merge
};

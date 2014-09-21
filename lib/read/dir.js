/**!
 * 从文件夹中css，读取规则是，读取文件夹中所有图片，根据图片名称作为样式的
 * classname，样式的最外层是文件夹的名字，比如：
 *
 * icons
 * ├─ justify-center.png
 * ├─ justify-left.png
 * └─ justify-right.png
 *
 * =>
 * .icons .justify-center { background: url(); }
 * .icons .justify-left   { background: url(); }
 * .icons .justify-right  { background: url(); }
 *
 * Copyright(c) Eward.song Limited.
 * MIT Licensed
 *
 * Authors:
 *   Eward <eward.song@gmail.com> (http://shepherdwind.com)
 */

'use strict';

var path = require('path');
var fs = require('co-fs');
var thunkify = require('thunkify');
var util = require('util');

var Graph = require('../graph/index')();
var Logger = require('../common/logger');

module.exports = function* (file){

  Logger.debug('根据文件夹%s生成css样式', file);
  var trees = yield getTree(file);
  Logger.debug('从文件夹%s中读取到%s个图片', file, trees.length);

  var graph = new Graph(file);
  var size = yield graph.size(trees);

  return toCSS(trees, size);
};


/**
 * 文件夹结构转换为css
 * @param {array} trees 文件夹结构数组
 * @param {object} 每个文件对应的大小
 * @return {string} cssText
 */
function toCSS(trees, sizes){
  var cssText = '';
  var selectors = [];

  trees.forEach(function(file){
    var size = sizes[file];

    // 如果是xxx-sprite.png或者xxx-sprite8.png，则忽略，这种图片是joycss生成的
    // 图片
    if (/-sprite[8]{0,1}.png$/.test(file)) {
      return;
    }

    var selector = '.' + file.replace(/\.\w+$/, ''). // 去掉或追 a.png => a
      replace(/^([\w\-\d]+)\-hover$/g, '$1:hover'). // -hover => :hover
      replace(/[\/\\]/g, ' .'); // a/b.png => .a .b

    cssText += util.format('%s { background: url(%s) no-repeat; width: %spx; height: %spx; }\n',
      selector, file, size.width, size.height);

    selectors.push(selector);
  });

  // 增加inline-block样式
  cssText += util.format('%s { display: inline-block; *zoom: 1; *display: inline; }',
    selectors.join(',\n'));

  return cssText;
}

/**
 * 获得文件树结构
 *
 */
function* getTree(file){

  var files = yield fs.readdir(file);
  var exts = ['.png', '.gif', '.jpg'];
  var tree = [];

  for (var i = 0; i < files.length; i++) {
    var item = files[i];
    var ext = path.extname(item);
    if (exts.indexOf(ext) !== -1) {
      tree.push(item);
      continue;
    }

    var dir = path.join(file, item);
    var stat = yield fs.stat(dir);
    if (stat.isDirectory()) {
      var dirs = yield getTree(dir);
      tree = tree.concat(dirs.map(function(filename){
        return item + '/' + filename;
      }));
    }
  }

  return tree;
}

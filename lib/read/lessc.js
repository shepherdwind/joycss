/**!
 * less 中读取文件
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
var format = require('util').format;

var Logger = require('../common/logger');

function* lessc(file){

  var less;

  try {
    less = require('less');
  } catch (e) {
    //Logger.error('Less解析失败，请安装通过npm安装less模块');
    throw new Error('Less解析失败，请安装通过npm安装less模块');
  }

  var css = yield fs.readFile(file);
  var parser = new(less.Parser)({
    paths: [path.dirname(file)],
    filename: path.basename(file)
  });
  parser.parse = thunkify(parser.parse);

  var tree;
  try {
    tree = yield parser.parse(css.toString());
  } catch(err) {
    var msg = format('less 解析失败: %s (%s:%s:%s)',
        err.message,
        err.filename,
        err.line,
        err.column);
    throw new Error(msg);
  }

  return tree.toCSS();
}

module.exports = lessc;

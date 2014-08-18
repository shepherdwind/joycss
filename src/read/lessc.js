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

var Logger = require('../common/logger');

function* lessc(file){

  try {
    var less = require('less');
  } catch (e) {
    //Logger.error('Less解析失败，请安装通过npm安装less模块');
    throw new Error('Less解析失败，请安装通过npm安装less模块');
    return;
  }

  var css = yield fs.readFile(file);
  var parser = new(less.Parser)({
    paths: [path.dirname(file)],
    filename: path.basename(file)
  });
  parser.parse = thunkify(parser.parse);

  try {
    var tree = yield parser.parse(css.toString());
  } catch(err) {
    //Logger.error('less 解析失败: %s, %s:%s:%s', err.message, err.filename, err.line, err.column);
    throw new Error('less 解析失败: ' + err.message + '\n' + err.extract.join('\n'));
  }

  return tree.toCSS();
}

module.exports = lessc;

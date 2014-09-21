/**!
 * css流读取模块
 *
 * Copyright(c) Eward.song Limited.
 * MIT Licensed
 *
 * Authors:
 *   Eward <eward.song@gmail.com> (http://shepherdwind.com)
 */
'use strict';

var co = require('co');
var thunkify = require('thunkify');
var util = require('util');
var path = require('path');
var fs = require('co-fs');

var Logger = require('../common/logger');
var stat = thunkify(fs.stat);

/**
 * 读取css，css可以有一下几种不同的来源
 * 1. 来自css文件，比如 read(a.css)
 * 2. 来自less、stylus、scss等文件，需要经过css预处理器进行解析运算，通过文件
 *    名后缀判断
 * 3. 来自终端流
 * 4. 直接接受css字符串输入
 * 5. 把一个文件夹作为输入，输出文件夹所对应的css样式，这种情况，根据文件夹里面
 *    的文件名作为样式的classname
 *
 * @param {string} file 如果file是文件，并且文件存在，为1、2的情况，如果是一个
 * 文件夹，并且存在，为5的情况，否则，当做合法的css字符串
 * @return {string} 解析后得到的css字符串
 */

var lessc = require('./lessc');
var sass = require('./sass');
var readDir = require('./dir');

var avilable = {
  '.css': readFile,
  '.less': lessc,
  //'.styl': stylus,
  '.scss': sass
};

function* readFile(file){
  Logger.debug('开始读取css文件%s', file);
  var buf = yield fs.readFile(file);
  Logger.debug('读取css文件%s完成', file);
  return buf.toString();
}

function* read(file) {
  var ext = path.extname(file);
  var isExists = yield fs.exists(file);

  if (!isExists) {
    var error = util.format('css文件%s不存在', file);
    throw new Error(error);
  }

  // css, less, styl, scss文件读取过程
  if (avilable[ext]) {
    // 读取文件
    return yield avilable[ext](file);
  }

  var stat = yield fs.stat(file);

  // 从文件夹中读取css
  if (stat.isDirectory()) {
    return yield readDir(file);
  }

}

module.exports = read;

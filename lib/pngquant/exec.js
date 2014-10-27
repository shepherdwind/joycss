/**!
 * pngqunat 命令执行
 *
 * Copyright(c) Eward.song Limited.
 * MIT Licensed
 *
 * Authors:
 *   Eward <eward.song@gmail.com> (http://shepherdwind.com)
 */

'use strict';

var path = require('path');
var exec = require('co-exec');
var util = require('util');
var fmt = util.format;

var logger = require('../common/logger');
var isWin = !!process.platform.match(/^win/);

var IS_TRAVIS = process.env.TRAVIS;

exports.run = function*(base, image){
  var bin = 'pngquant';
  if (isWin) {
    bin = path.join(__dirname, '../../bin/', bin + '.exe');
  }

  var cmd = fmt('%s --ext 8.png -f --iebug %s', bin, image);
  var stdout;
  try {
    stdout = yield exec(cmd, {cwd: base});
  } catch(e) {
    logger.success('生成png8图片失败，需要手动安装pngquant：brew install pngquant');
    return false;
  }

  return true;
};

if (IS_TRAVIS) {
  // 模拟生成图片
  var fs = require('co-fs');
  exports.run = function*(base, image) {
    image = image.replace(/\.png$/, '8.png');
    yield fs.writeFile(path.join(base, image), 'hello');
    return true;
  };
}

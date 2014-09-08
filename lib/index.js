/**!
 * api入口文件
 *
 * Copyright(c) Eward.song Limited.
 * MIT Licensed
 *
 * Authors:
 *   Eward <eward.song@gmail.com> (http://shepherdwind.com)
 */

'use strict';
/**
 * Joycss对象
 *
 * @param {string} input css来源，可以是css文件、less、sass文件，或者一个包含图
 * 片文件夹，或者cssText字符串
 * @param {object} option
 *
 */
var defaultOption = {
  /**
   * 图片目标地址，如果没有指定，默认图片和生成的css地址一致
   */
  destImg: null,
  /**
   * 生成css地址，如果不指定，和源css路径一致
   */
  destCss: null,
  /**
   * cssText，css字符串，当存在cssText，不需要从文件中读取css字符串，第一参数
   * filename用于查找css中图片路径，比如css中图片../size.png，filename是/a/b/
   * 那么图片的绝对路径就是/a/size.png
   */
  cssText: null,
  /**
   * 使用png8模式，如果设置为false，生成png24图
   */
  force8bit : true,
  /**
   * 拼图算法，支持三种'auto | close | vertical | horizontal'
   * auto自动拼图，如果知道图片所在的盒子大小，使用紧凑拼图，否则独占一行
   * close: 紧凑拼图，搜有图片使用紧凑拼图
   * vertical: 垂直布局,
   * horizontal: 水平布局
   */
  layout : 'auto',

  // 是否保存css文件到destCss
  save: true
};

var path = require('path');
var fs = require('co-fs');
var mkdirp = require('mkdirp');
var thunkify = require('thunkify');
var unyield = require('unyield');

var utils = require('./common/utils');
var union = require('./union');
var logger = require('./common/logger');

mkdirp = thunkify(mkdirp);

function Joycss(filename, option){

  if (!filename) {
    throw new Error('css文件路径不能为空');
  }

  if (!(this instanceof Joycss)) {
    return new Joycss(filename, option);
  }

  logger.debug('拼图开始------------------');
  this.filename = filename;
  this.option = utils.mixin(defaultOption, {});
  utils.mixin(option, this.option);

  this.initialize();
}

// 判断输入类型
Joycss.prototype.type = function(){
  var filename = this.filename;
  var option = this.option;
  if (option.cssText) return 'string';

  var ext = path.extname(filename);
  if (ext === '.css') return 'css';
  if (!ext) return 'dir';

  return 'other';
};

var EXT_REG = /\.\w{2,4}$/;

Joycss.prototype.initialize = function(){
  var option = this.option;
  var filename = this.filename;
  var type = this.type();

  // 如果传入的是css字符串，filename是一个目录的情况，自动补全css路径
  if (type === 'string' && !path.extname(filename)) {
    filename = filename + '/joyss.css';
    this.filename = filename;
  }

  // 如果目标css地址没有设置或者图片地址未设置，和源css路径在一起，比如
  // a.css => a-sprite.css, a-sprite.png
  if (type === 'css') {
    option.destCss = option.destCss ||
      filename.replace(EXT_REG, '-sprite.css');
  }

  // 如果是less之类的，直接返回同名的css文件，比如
  // a.less => a.css
  if (type === 'other') {
    option.destCss = option.destCss ||
      filename.replace(EXT_REG, '.css');
  }

  // 如果是一个文件夹的情况，默认生成和文件夹同名的css文件
  if (type === 'dir') {
    option.destCss = option.destCss ||
      path.join(filename, path.basename(filename) + '.css');
  }

  option.destImg = option.destImg ||
    option.destCss.replace(EXT_REG, '-sprite.png');

};

Joycss.prototype.run = unyield(function* (){
  var cssText = yield union.merge(this.filename, this.option);
  var option = this.option;
  if (this.option.save) {
    logger.debug('开始写入到文件%s', option.destCss);
    yield mkdirp(path.dirname(option.destCss));
    yield fs.writeFile(option.destCss, cssText);
    logger.debug('写入文件%s成功', option.destCss);
  }
  logger.success('拼图完成');
  return cssText;
});

module.exports = Joycss;

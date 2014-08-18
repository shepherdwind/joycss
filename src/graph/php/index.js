/**
 * Created by hanwen.sah@taobao.com.
 * Date: 2012-06-05
 * Time: 14:03
 * Desc: 图片处理api，包括读取图片大小，拼图过程
 */

var path = require('path');
var exec = require('co-exec');
var Logger = require('../../common/logger');

var PHP_CMD = 'php';
var SIZE_CMD = path.join(__dirname, '/size.php');
var COMBINE_CMD = path.join(__dirname, '/combine.php');
var util = require('util');

/**
 * @param {string} base 图片根路径
 */
var graph = function(base) {
  this.base = base;
};

/**
 * get the image size
 *
 * @param files {array} the files name of image file, full path
 */
graph.prototype.size = function* (files){

  Logger.debug('开始读取图片大小信息');

  // php size.php a.png b.png c.gif
  var cmd = util.format('%s %s %s', PHP_CMD, SIZE_CMD, files.join(' '));
  var stdout = yield exec(cmd, {cwd: this.base});

  Logger.debug('读取图片大小信息完成');

  var ret;
  try {
    ret = JSON.parse(stdout);
  } catch (e) {
    Logger.error('读取图片大小数据出现错误, 错误信息:\n %s', stdout);
    return undefined;
  }

  Logger.success('读取图片大小成功');
  return ret;
};

/**
 * 图片合并操作
 * @param {object} conf 图片合并描述json数据
 */
graph.prototype.merge = function* (conf){
  // php combine.php {conf}
  var str = JSON.stringify(conf);
  var cmd = util.format('%s %s %s', PHP_CMD, COMBINE_CMD, str);

  Logger.debug('拼图操作开始执行, 根目录%s', this.base);
  var stdout = yield exec(cmd, {cwd: this.base});

  var ret;
  try {
    // 解决libpng在1.6.2下报错的问题，蛋疼
    stdout = stdout.replace(/libpng warning: iCCP: known incorrect sRGB profile\s+/g, '');
    ret = JSON.parse(stdout);
  } catch(e) {
    Logger.error('拼图操作失败, 错误信息: %s', stdout);
    return undefined;
  }

  Logger.success('拼图操作开始完成', this.base);
  return ret;

};

module.exports = graph;

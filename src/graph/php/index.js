/**
 * Created by hanwen.sah@taobao.com.
 * Date: 2012-06-05
 * Time: 14:03
 * Desc: 图片处理api，包括读取图片大小，拼图过程
 */
'use strict';
var path = require('path');
var exec = require('co-exec');
var spawn = require('child_process').spawn;
var thunkify = require('thunkify');

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

  // php size.php a.png b.png c.gif
  var cmd = util.format('%s %s %s', PHP_CMD, SIZE_CMD, files.join(' '));
  Logger.debug('开始读取图片大小信息, 执行命令：\n    %s', cmd);

  var stdout;
  try {
    stdout = yield exec(cmd, {cwd: this.base});
  } catch (e) {
    Logger.error('读取图片大小数据出现错误, 错误信息: %s', e.stack);
    return;
  }

  Logger.debug('读取图片大小信息完成');

  var ret;
  try {
    ret = JSON.parse(stdout);
  } catch (e) {
    Logger.error('读取图片大小数据出现错误, 错误信息: %s', stdout);
    return undefined;
  }

  Logger.success('读取图片大小成功');
  return ret;
};

/**
 * 图片合并操作
 * @param {object} conf 图片合并描述json数据
 */
graph.prototype.merge = thunkify(function(filename, conf, done){
  // php combine.php {conf}
  var str = JSON.stringify(conf);
  //var cmd = util.format('%s %s %s %s', PHP_CMD, COMBINE_CMD, filename, str);
  var args = [COMBINE_CMD, filename, str];
  var cmd = spawn(PHP_CMD, [COMBINE_CMD, filename, str], {cwd: this.base});

  Logger.debug('拼图操作开始执行, 根目录%s, 执行命令:\n  %s', this.base);
  //var stdout = yield exec(cmd, {cwd: this.base});

  var ret = '';
  var err = false;

  cmd.stdout.on('data', function cmdSuccess(data){
    ret += data.toString();
  });

  cmd.stderr.on('data', function cmdError(data){
    ret += data.toString();
    err = true;
  });

  cmd.on('exit', function(){
    if (!err) {
      ret  = JSON.parse(ret);
      done(null, ret);
      Logger.success('拼图操作完成: %s', ret.info);
    } else {
      var len = ret.length;
      // 解决libpng在1.6.2下报错的问题，蛋疼
      ret = ret.replace(/libpng warning: iCCP: known incorrect sRGB profile\s+/g, '');
      if (ret.length < len) {
        done(null, JSON.parse(ret));
        Logger.success('拼图操作完成: %s', ret.info);
      } else {
        Logger.error('拼图操作失败:Error %s', err);
        done(err, ret);
      }
    }
  });

});

module.exports = graph;

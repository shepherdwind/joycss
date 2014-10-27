/**
 * Created by hanwen.sah@taobao.com.
 * Date: 2012-06-05
 * Time: 14:03
 * Desc: 图片处理api，包括读取图片大小，拼图过程
 */
'use strict';
var path = require('path');
var spawn = require('child_process').spawn;
var thunkify = require('thunkify');
var size = require('../size');

var logger = require('../../common/logger');

var PHP_CMD = 'php';
var COMBINE_CMD = path.join(__dirname, '/combine.php');

var IS_TRAVIS = process.env.TRAVIS;
if (!IS_TRAVIS) {
  require('../check/php');
}

/**
 * @param {string} base 图片根路径
 */
var graph = function(base) {
  this.base = base;
};

graph.NAME = 'php';

var mockApi = require('./mock');

/**
 * get the image size
 *
 * @param files {array} the files name of image file, full path
 */
graph.prototype.size = function* (files){
  return yield* size(this.base, files);
};

/**
 * 图片合并操作
 * @param {object} conf 图片合并描述json数据
 */
graph.prototype.merge = thunkify(function(filename, conf, done){
  // php combine.php {conf}
  var str = JSON.stringify(conf);
  //var cmd = util.format('%s %s %s %s', PHP_CMD, COMBINE_CMD, filename, str);
  var cmd = spawn(PHP_CMD, [COMBINE_CMD, filename, str], {cwd: this.base});

  logger.debug('拼图操作开始执行, 根目录%s', this.base);

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
      logger.success('拼图操作完成: %s', ret.info);
    } else {
      var len = ret.length;
      // 解决libpng在1.6.2下报错的问题，蛋疼
      ret = ret.replace(/libpng warning: iCCP: known incorrect sRGB profile\s+/g, '');
      if (ret.length < len) {
        done(null, JSON.parse(ret));
        logger.success('拼图操作完成: %s', ret.info);
      } else {
        logger.error('拼图操作失败:Error %s', ret);
        done(err, ret);
      }
    }
  });

});

if (IS_TRAVIS) {
  graph.prototype.merge = mockApi.merge;
  graph.prototype.size = mockApi.size;
}

module.exports = graph;

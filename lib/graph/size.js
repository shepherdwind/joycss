/**!
 * count image size use node module `image-size`
 *
 * Copyright(c) Eward.song Limited.
 * MIT Licensed
 *
 * Authors:
 *   Eward <eward.song@gmail.com> (http://shepherdwind.com)
 */

'use strict';

var sizeOf = require('image-size');
var thunkify = require('thunkify');
var url = require('url');
var path = require('path');
var coSize = thunkify(size);

var logger = require('../common/logger');

var types = {
  'git': 1,
  'jpeg': 2,
  'png': 3,
  'bmp': 5,
  'jpg': 2
};

module.exports = function*(base, files) {
  files = files.map(trimQuery);
  var querys = files.map(function(img){
    return coSize(addBase(base, img));
  });

  var ret = {};
  var sizes;
  try {
    sizes = yield querys;
  } catch(e) {
    logger.error('读取图片大小数据出现错误, 错误信息: %s', e.stack);
    return null;
  }

  logger.debug('读取图片大小信息完成');

  files.map(function(img, i){
    var type = sizes[i].type;
    ret[img] = sizes[i];
    ret[img].type = types[type];
  });

  return ret;
};

// 去掉图片中query部分，比如a.png?line => a.png
function trimQuery(uri){
  return url.parse(uri).pathname;
}

function size(img, done){
  sizeOf(img, function(err, ret){
    if (err) {
      return done(err);
    }

    done(null, ret);
  });
}

function addBase(base, file){
  return path.join(base, file);
}

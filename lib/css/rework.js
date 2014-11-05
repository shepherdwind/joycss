/**!
 * css rework to sprite
 *
 * Copyright(c) Eward.song Limited.
 * MIT Licensed
 *
 * Authors:
 *   Eward <eward.song@gmail.com> (http://shepherdwind.com)
 */
'use strict';

var util = require('util');
var url = require('url');
/**
 * 拼图后的css集合
 */
function rework(slices, images, url, alpha){
  var rules = [];
  var selectors = [];
  slices.forEach(function(slice){
    var index = slice.index;
    var rule = slice.ast.declarations[index];
    var imageInfo = getImageConfig(slice.img, images);

    if ('base' in query(slice.img)) {
      rule.property = rule.property + '-inval';
    } else {
      rule.property = 'background-position';
      // 通过slice.img路径找到对应的图片定位信息
      rule.value = imageInfo.position;
    }

    // repeat的样式追加到原有的css中
    if (imageInfo.repeat !== 'no-repeat'){
      slice.ast.declarations.push({
        property: 'background-repeat',
        value: imageInfo.repeat,
        type: 'declaration'
      });
    }

    selectors = selectors.concat(slice.ast.selectors);
  });

  var asts = {
    declarations: [
      {
        property: 'background-image',
        value: util.format('url(%s)', url),
        type: 'declaration'
      },
      {
        property: 'background-repeat',
        value: 'no-repeat',
        type: 'declaration'
      }
    ],
    selectors: selectors,
    type: 'rule'
  };

  if (!alpha) {
    asts.declarations.push({
      property: '*background-image',
      // 生成png8图片
      value: util.format('url(%s)', url.replace(/\.png$/, '8.png')),
      type: 'declaration'
    });
  }

  return asts;
}

function getImageConfig(image, images){
  var ret;
  images.some(function(config){
    if (image.indexOf(config.file_location) === 0) {
      ret = config;
      return true;
    }
  });
  return ret;
}

// 获得url参数
function query(img){
  return url.parse(img, true).query;
}

module.exports = rework;

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
/**
 * 拼图后的css集合
 */
function rework(slices, images, url){
  var rules = [];
  var selectors = [];
  slices.forEach(function(slice, i){
    var index = slice.index;
    var rule = slice.ast.declarations[index];
    rule.property = 'background-position';

    // 通过slice.img路径找到对应的图片定位信息
    var imageInfo = getImageConfig(slice.img, images);
    rule.value = imageInfo.position;

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

  return {
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

module.exports = rework;

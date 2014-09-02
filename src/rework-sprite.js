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
 *
 */
function rework(slices, images, url){
  var rules = [];
  var selectors = [];
  slices.forEach(function(slice, i){
    var index = slice.index;
    var rule = slice.ast.declarations[index];
    rule.property = 'background-position';
    rule.value = images[i].position;

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
    if (config.file_location === image) {
      ret = config;
      return true;
    }
  });
  return ret;
}

module.exports = rework;

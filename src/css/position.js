/**!
 * position, 计算图片的位置
 *
 * Copyright(c) Eward.song Limited.
 * MIT Licensed
 *
 * Authors:
 *   Eward <eward.song@gmail.com> (http://shepherdwind.com)
 */
'use strict';

var path = require('path');

var Graph = require('../graph/index')();
var Box = require('./value/box');
var Logger = require('../common/logger');
var mixin = require('../common/utils').mixin;

function* position(slices, file, layout){
  var graph = new Graph(path.dirname(file));
  var images = slices.map(function(s){ return s.img; });
  var sizes = yield graph.size(images);

  var config = [];
  Object.keys(sizes).forEach(function(img){
    var imageInfo = sizes[img];
    var css = getCSS(img, slices);
    var box = new Box(css.property, css.value, css.line);
    imageInfo['file_location'] = img;
    mixin(coords(box, imageInfo), imageInfo);

    imageInfo.box = box;
    config.push(imageInfo);
  });

  layout = layout || 'auto';
  if (layout === 'close' || layout === 'auto') file = 'vertical';

  var Locate = require('../locating/' + file);
  var Loc = new Locate(config, layout);
  //sprite.height = Loc.height;
  //sprite.width = Loc.width;
  return {
    background: "ffffff7f",
    width: Loc.width,
    height: Loc.height,
    // 生成png图片
    imagetype: '3',
    images: config.map(function(conf){
      delete conf.box;
      return conf;
    })
  };

}

function getCSS(img, slices){
  var ast;
  slices.some(function(slice){
    if (slice.img === img) {
      ast = slice.ast;
      return true;
    }
  });

  var css = { property: [], value: [] };
  ast.declarations.forEach(function(o){
    css.property.push(o.property);
    css.value.push(o.value);
    css.line = css.line || o.position.start.line;
  });

  return css;
}

function coords(box, imageInfo){
  var ret = {
    "repeat": 'no-repeat',
    "align": '',
    "spritepos_left": 0,
    "spritepos_top": 0
  };
  var background = box.background;
  var repeat = background.repeat;
  var position = background.position;

  ret.repeat = repeat;
  if (position){
    //处理center
    if (position.x === 'center'){
      if (box.width){
        position.x = Math.floor((box.width - imageInfo.width) / 2);
      } else {
        Logger.debug('[Error info @' + box.line +
            ']use 50% for background-position but not set ');
      }
    }

    if (position.y === 'center'){
      if (box.width){
        position.y = Math.floor((box.height - imageInfo.height) / 2);
      } else {
        Logger.debug('[Error info @' + box.line +
            ']use 50% for background-position-y but not set height');
      }
    }

    if (position.x === 'right') ret['align'] = 'right';

    //is number
    if (+position.x) ret['spritepos_left'] = parseInt(position.x, 10);
    if (+position.y) ret['spritepos_top'] = parseInt(position.y, 10);
  }

  return ret;
}

module.exports = position;

"use strict";
var path      = require('path');
var cssReader = require('./cssReader');
var StdClass  = require('../lib/stdclass');
var Api       = require('./graph/api');
var some      = require('../lib/utils').some;
var forEach   = require('../lib/utils').forEach;
var util      = require('util');
var fs        = require('fs');

var conf = {
  "background" : "ffffff7f",
  "colorcount" : "256",
  "dataurl"    : false,
  "filename"   : "../img/mysprite.png",
  "width"      : 0,
  "height"     : 0,
  "force8bit"  : true,
  "imagetype"  : 3,
  "layout"     : "vertical",
  "margin"     : 0,
  "images"     : {}
};

var imageUrlReg = /url\(['"]*([a-z0-9A-Z_\-.\/\\]+)['"]*\)/;
//console.log(imageUrlReg.exec('background: red;'));
//console.log(imageUrlReg.exec('background: url("b\\a.png") top left;'));

function SpriteDef (){
  StdClass.apply(this, arguments);
}

StdClass.extend(SpriteDef, StdClass, {

  attributes: {
    file: ''
  },

  CONSIT: {
  },

  _init: function(){
    var file = this.get('file');
    if (!file) throw Error('file is not defined');

    this.cssReader = new cssReader({file: file});

    /**
     * 所有sprites属性集合
     */
    this.sprites = {
      mysprite: conf
    };

    /**
     * 所有含有background的css集合，{id: url}，id指css集合id，url是图片路径
     */
    this.images = {};

    /**
     * 图片属性集合，记录图片大小以及图片类型
     */
    this.imagesDef = {};
    this.cssReult = '';

    this._bind();
  },

  _bind: function(){
    var cssReader = this.cssReader;
    //收集css规则
    cssReader.on(cssReader.get('RULE_END_EVT'), this.getRule, this);
    //收集规则结束
    cssReader.on('change:timeEnd', this.cssEnd, this);
  },

  /**
   * 获取css属性组合
   * @param e {object} 一组css规则{selector: [], property: [], value: [], id: 0}
   * selector, property, value分别是css规则的选择器、属性和值，id是规则序号
   */
  getRule: function(e){
    var property = e.property;
    var imageIndex = property.indexOf('background');

    if (imageIndex > -1) {
      this.collectImages(e, imageIndex);
    }
  },

  writeRule: function(rule){
    var self = this;
    self.cssReult += rule.selector.join(",\n") + " {\n";
    forEach(rule.property, function(p, i){
      self.cssReult += '  ' + p + ': ' + rule.value[i] + ";\n";
    });
    self.cssReult += "}\n";
  },

  /**
   * 获取css中背景图
   * @param css {object} css规则
   * @param imageIndex {number} 背景图属性所在的位置
   */
  collectImages: function(css, imageIndex){
    var urlVal = css.value[imageIndex];
    var image  = this._isSpriteImage(urlVal);
    var images = this.images;

    if (image){
      images[css.id] = image;
    }
  },

  /**
   * 判断是否是需要做sprite的图片
   * @param val {string} css background 对应的value值，比如 url(a.png) left
   * right;
   */
  _isSpriteImage: function(val){
    //存在url，并且url不是http方式
    var isHttpUrl = val.indexOf('//') > -1;
    var ret = false;
    if (!isHttpUrl){
      var url = imageUrlReg.exec(val);
      ret = url ? url[1] : false;
    }

    return ret;
  },

  cssEnd: function(){
    var images  = this.images;
    var baseDir = path.dirname(this.get('file'));
    var files   = {};

    forEach(images, function(file){
      //去除重复
      files[path.resolve(baseDir, file)] = 1;
    });

    files = Object.keys(files);

    //获取图片大小
    Api.getImagesSize(files, this.setDef, this);
  },

  setDef: function(err, data){
    if (err) throw Error(data.toString());

    var baseDir = path.dirname(this.get('file'));
    var filePath;
    var imagesDef = this.imagesDef;

    forEach(JSON.parse(data), function(def, file){
      filePath = path.relative(baseDir, file);
      imagesDef[filePath] = def;
    });

    this.setPos();
  },

  setPos: function(){
    var imagesDef = this.imagesDef;
    //排序
    var imgs = Object.keys(imagesDef).sort(function(img1, img2){
      return imagesDef[img2].width - imagesDef[img1].width;
    });

    var sprites = this.sprites['mysprite'];
    var images  = sprites.images;
    var self    = this;
    var height  = 0;
    sprites['width'] = imagesDef[imgs[0]].width;

    forEach(imgs, function(img){
      var image;
      images[img] = imagesDef[img];
      image = images[img];
      self.coords(img, image);
      height += image['spritepos_top'];
      image['spritepos_top'] = height;
      image['file_location'] = img;
      height += parseInt(image.height, 10);
    });

    sprites['height'] = height;

    this.createSprite();
  },

  /**
   * 生成sprite图片
   * @next writeCssBack 回写css样式，生成sprite样式
   */
  createSprite: function(){
    var cfg = JSON.stringify(this.sprites);
    //拼图
    Api.mergeImages([this.get('file'), cfg], this.writeCssBack, this);
  },

  writeCssBack: function(err, data){
    var file = this.get('file');
    var spriteFile = file.replace('.css', '.sprite.css');
    var cssReader = this.cssReader;
    var len = cssReader.getLen();
    var indexs = Object.keys(this.images);
    var index = indexs.shift();
    var rule, img;
    var multSelector = [];

    for (var i = 0; i < len; i++) {
      rule = cssReader.getRule(i);
      if (index != i){
        this.writeRule(rule);
      } else {
        img = this.images[index];
        multSelector = multSelector.concat(rule.selector);
        this.writeSpriteRule(rule, this.imagesDef[img]);
        index = indexs.shift();
      }
    }
    this.writeRule({
      'selector': multSelector,
      'property': ['background-image'],
      'value': ['url(' + this.sprites['mysprite']['filename'] + ')']
    });
    fs.writeFile(spriteFile, this.cssReult, function(err, data){
      console.log(err);
      console.log(data);
    });
    //console.log(this.imagesDef);
  },

  writeSpriteRule: function(rule, def){
    var repeat = def['repeat'];
    var position = [def['spritepos_left'], def['spritepos_left']];
    var self = this;
    var backgroudProp = ['background', 'background-position', 
      'background-repeat', 'background-image'];

    self.cssReult += rule.selector.join(', ') + " {\n";
    forEach(rule.property, function(prop, i){
      if (backgroudProp.indexOf(prop) == -1){
        self.cssReult += '  ' + rule.property[i] + ': ' + rule.value[i] + ';\n';
      }
    });
    self.cssReult += '  background-repeat: ' + repeat + ';\n';
    self.cssReult += '  background-position: ' + position.join(', ') + ';\n';
    self.cssReult += "}\n";
  },

  coords: function(img, result){
    var css = this.getCss(img);
    forEach(this._getBackgroudDef(css), function(val, key){
      result[key] = val;
    });
  },

  _getBackgroudDef: function(css){
    var ret = {
      "repeat"         : 'no-repeat',
      "align"          : '',
      "spritepos_left" : 0,
      "spritepos_top"  : 0
    };
    var self = this;
    var height = 0;
    var padding = 0;

    forEach(css.property, function(property, id){

      var layout = 'vertical';
      var isVertical = layout === 'vertical';
      var val = css.value[id];
      if (property == 'background-repeat') ret['repeat'] = val;

      if (property == 'background-position'){
        self._getBackgroudAlign(val, ret, isVertical);
      }

      if (property == 'background'){
        var isPos = false;
        val.split(' ').forEach(function(str, i, arr){
          //repeat
          if (str.indexOf('repeat') > -1){
            ret['repeat'] = str;
          }

          //position
          if (!isPos && (parseInt(str, 10) > -1 || ['left', 'right', 'center'].indexOf(str))){
            isPos = true;
            self._getBackgroudAlign([str, arr[i + 1]], ret, isVertical);
          } else {
            isPos =false;
          }
        });
      }

      //get height
      if (['height', 'line-height'].indexOf(property) > -1 && val.indexOf('px') > 0){
        height = +val > height ? +val : height;
      }
      //get padding
      //Todo:

    });

    return ret;
  },

  _getBackgroudAlign: function(val, ret, isVertical){

    var pos = util.isArray(val) ? val :
    val.split(' ').map(function(v){
      return v.trim();
    });

    var aligns = ['left', 'right', 'center', '0', '50%', '100%'];
    (aligns.indexOf(pos[0]) > -1 && isVertical) ?
    ret['align'] = pos[0] :
    ret['spritepos_left'] = parseInt(pos[0], 10) || 0;

    (aligns.indexOf(pos[1]) > -1 && !isVertical) ?
    ret['align'] = pos[1]:
    ret['spritepos_top'] = parseInt(pos[1], 10) || 0;

    if (ret['align'] == '0'){
      ret['align'] = isVertical ? 'left': 'top';
    }
    if (ret['align'] == '100%'){
      ret['align'] = isVertical ? 'right': 'bottom';
    }
    if (ret['align'] == '50%'){
      ret['align'] = 'center';
    }

  },

  /**
   * 获取图片对应的css规则，规定，同一个图片对应同一个规则，不允许同一个图片，
   * 使用不同的方式设置规则
   * @param img {string} img url
   * @return {object} css rules
   */
  getCss: function(img){
    var cssReader = this.cssReader;
    var images    = this.images;
    var imgId     = null;

    some(images, function(imgPath, id){
      if (imgPath == img){
        imgId = id;
        return true;
      }
    });

    return cssReader.getRule(imgId);
  }

});

module.exports = SpriteDef;

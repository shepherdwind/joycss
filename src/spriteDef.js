"use strict";
var path      = require('path');
var cssReader = require('./cssReader');
var StdClass  = require('../lib/stdclass');
var Api       = require('./graph/api');
var some      = require('../lib/utils').some;
var forEach   = require('../lib/utils').forEach;
var util      = require('util');
var fs        = require('fs');
var Box       = require('../lib/box');
var url       = require('url');
var ESC_KEY   = 'esc';

var conf = {
  "background" : "ffffff7f",
  "colorcount" : "256",
  "dataurl"    : false,
  "filename"   : "",
  "width"      : 0,
  "height"     : 0,
  "force8bit"  : true,
  "imagetype"  : 3,
  "layout"     : "vertical",
  "margin"     : 0
};

function mixin(from, to){
  forEach(from, function(val, key){
    to[key] = val;
  });
  return to;
}

var imageUrlReg = /url\(['"]*([a-z0-9A-Z&?=_\-.\/\\]+)['"]*\)/;
//console.log(imageUrlReg.exec('background: red;'));
//console.log(imageUrlReg.exec('background: url("b\\a.png") top left;'));

function SpriteDef (){
  StdClass.apply(this, arguments);
}

StdClass.extend(SpriteDef, StdClass, {

  attributes: {
    file: '',
    basename: '',
    id: 0,
    ids: {},
    imgPath: ''
  },

  CONSIT: {
  },

  _init: function(){
    var file = this.get('file');
    if (!file) throw Error('file is not defined');

    this.cssReader = new cssReader({file: file});

    var basename = path.basename(file, '.css');
    this.set('basename', basename);
    /**
     * 所有sprites属性集合
     */
    this.sprites = {};
    this.initSpriteConf();

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

  /**
   * 初始化配置，对应可能存在的多图情况
   */
  initSpriteConf: function(){
    var id = this.get('id');
    var basename = this.get('basename');
    var ids = this.get('ids');
    var spriteId = id ? basename + id : basename;
    var imgPath = this.get('imgPath');

    this.sprites[spriteId] = mixin(conf, {});
    this.sprites[spriteId]['images'] = {};
    if (imgPath) {
      this.sprites[spriteId]['filename'] = imgPath + '/' + spriteId + '-sprite.png';
    }

    ids[id] = spriteId;
    id++;
    this.set('id', id);
    return id - 1;
  },

  _bind: function(){
    var cssReader = this.cssReader;
    //收集css规则
    cssReader.on(cssReader.get('RULE_END_EVT'), this.getRule, this);
    //收集规则结束
    cssReader.on('change:timeEnd', this.cssEnd, this);
    this.on('change:imgPath', this.setImgPath);
  },

  setImgPath: function(e){
    var path = e.now + '/';
    forEach(this.sprites, function(sprite, id){
      if (!sprite.filename) sprite['filename'] = path + id + '-sprite.png';
    });
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

  writeRule: function(rule, isBegin){
    var self = this;
    var cssReult = '';
    cssReult += rule.selector.join(",\n") + " {\n";
    forEach(rule.property, function(p, i){
      cssReult += '  ' + p + ': ' + rule.value[i] + ";\n";
    });
    cssReult += "}\n";

    if (!isBegin){
      this.cssReult += cssReult;
    } else {
      this.cssReult = cssReult + this.cssReult;
    }
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
      var uri = imageUrlReg.exec(val);
      if (uri){
        var imgurl = url.parse(uri[1], true);
        var params = imgurl.query;
        var id = params['id'] || 0;
        //过滤图片
        if (!params[ESC_KEY]){
          ret = imgurl.pathname;
          //设置第一个图片为sprite图片位置
          if (!this.get('imgPath')){
            this.set('imgPath', path.dirname(ret));
          }
        }

        if (id && this.get('id') === id){
          this.initSpriteConf();
        }
      }
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

    var self = this;

    forEach(imgs, function(img){
      var imageInfo = imagesDef[img];
      var css = self.getCss(img);
      var box = new Box(css.property, css.value);
      imageInfo['file_location'] = img;
      mixin(self.coords(box), imageInfo);

      self.setImageInfo(box, imageInfo);
    });

    this.createSprite();
  },

  setImageInfo: function(box, imageInfo){
    var id = this.get('id');
    var background = box.background;
    var params = background.params;
    var basename = this.get('basename');

    if (params.id && params.id == id){
      this.initSpriteConf();
    }

    var spriteId = params.id ? basename + params.id : basename;
    var sprites = this.sprites[spriteId];
    var width = sprites['width'];
    var height = sprites['height'];

    if (imageInfo.width > width) width = imageInfo.width;

    height += imageInfo['spritepos_top'];
    imageInfo['spritepos_top'] = height;
    height += parseInt(imageInfo.height, 10);

    sprites['images'][imageInfo['file_location']] = imageInfo;
    sprites['width'] = width;
    sprites['height'] = height;
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
    var multSelector = {};

    for (var i = 0; i < len; i++) {
      rule = cssReader.getRule(i);
      if (index != i){
        this.writeRule(rule);
      } else {
        img = this.images[index];
        multSelector[img] = rule.selector;
        this.writeSpriteRule(rule, this.imagesDef[img]);
        index = indexs.shift();
      }
    }

    var _this = this;
    forEach(this.sprites, function(sprites, spriteId){
      var selectors = [];
      forEach(sprites.images, function(def, img){
        selectors = selectors.concat(multSelector[img]);
      });

      _this.writeRule({
        'selector': selectors,
        'property': ['background-image', 'background-repeat'],
        'value': ['url(' + sprites['filename'] + ')', 'no-repeat']
      }, true);
    });

    fs.writeFile(spriteFile, this.cssReult, function(err, data){
      console.log(err);
      console.log(data);
    });
  },

  writeSpriteRule: function(rule, def){
    var repeat = def['repeat'];
    var position = [def['spritepos_left'] + 'px', def['spritepos_top'] + 'px'];
    var self = this;
    var backgroudProp = ['background', 'background-position', 
      'background-repeat', 'background-image'];

    self.cssReult += rule.selector.join(', ') + " {\n";
    forEach(rule.property, function(prop, i){
      if (backgroudProp.indexOf(prop) == -1){
        self.cssReult += '  ' + rule.property[i] + ': ' + rule.value[i] + ';\n';
      }
    });

    if (repeat !== 'no-repeat'){
      self.cssReult += '  background-repeat: ' + repeat + ';\n';
    }
    self.cssReult += '  background-position: ' + position.join(', ') + ';\n';
    self.cssReult += "}\n";
  },

  coords: function(box){
    var ret = {
      "repeat"         : 'no-repeat',
      "align"          : '',
      "spritepos_left" : 0,
      "spritepos_top"  : 0
    };
    var background = box.background;
    var repeat = background.repeat;
    var position = background.position;

    ret.repeat = repeat;
    if (position){
      if (position.x !== 'right') ret['align'] = 'left';

      //is number
      if (+position.x) ret['spritepos_left'] = parseInt(position.x, 10);
      if (+position.y) ret['spritepos_top'] = parseInt(position.y, 10);
    }

    return ret;
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

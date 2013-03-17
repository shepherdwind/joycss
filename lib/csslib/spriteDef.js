"use strict";
var path      = require('path');
var StdClass  = require('../common/stdclass');
var Config    = require('../common/config');

var node_gd   = Config.joyrc('node_gd');
var graph     = Config.joyrc('node_gd') ? 'node-gd' : 'php';
var Api       = require('../graph/' + graph);
var some      = require('../common/utils').some;
var forEach   = require('../common/utils').forEach;
var mixin     = require('../common/utils').mixin;
var util      = require('util');
var Box       = require('./value/box');
var url       = require('url');

var PARAMS    = {
  'nosprite'   : 'esc',
  'direction'  : 'way',
  'horizontal' : 'h',
  'force8bit'  : 'png24' 
};

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
  //默认间距
  "margin"     : 0
};

var imageUrlReg = /url\(['"]*([a-z0-9A-Z&?=_\-.,\[\]\/\\]+)['"]*\)/;
//console.log(imageUrlReg.exec('background: red;'));
//console.log(imageUrlReg.exec('background: url("b\\a.png?cood=[0,-230]") top left;'));

function SpriteDef (){
  StdClass.apply(this, arguments);
}

StdClass.extend(SpriteDef, StdClass, {

  attributes: {
    //目标文件
    file         : '',
    basename     : '',
    id           : 0,
    ids          : {},
    imgPath      : '',
    //预处理数组，处理id顺序关系
    preParam     : [],
    ruleIds      : [],
    //配置方式
    config       : {},
    layout       : 'auto',
    force8bit    : true,
    background   : 'ffffff7f',
    cssReader    : {},
    changedRules : {},
    extraRules   : [],
    cssImgs      : [],
    spritesImgs  : []
  },

  CONSIT: {
  },

  _init: function(){
    var file = this.get('file');
    if (!file) throw Error('file is not defined');

    var basename = path.basename(file, '.css');
    this.set('basename', basename);
    conf.force8bit = this.get('force8bit');
    conf.background = this.get('background');
    /**
     * 所有sprites属性集合
     */
    this.sprites = {};

    /**
     * 所有含有background的css集合，{id: url}，id指css集合id，url是图片路径
     */
    this.images = {};

    /**
     * 图片属性集合，记录图片大小以及图片类型
     */
    this.imagesDef = {};
    this.cssResult = '';

    this.imagesMap = {};

    this._bind();
  },

  /**
   * 初始化配置，对应可能存在的多图情况
   */
  initSpriteConf: function(params){
    var id = this.get('id');
    var basename = this.get('basename');
    var ids = this.get('ids');
    var spriteId = id ? basename + id : basename;
    var imgPath = this.get('imgPath');

    this.sprites[spriteId] = mixin(conf, {});
    this.sprites[spriteId]['images'] = {};
    var config = this.get('config');
    //合并全局配置
    mixin(config['global'], this.sprites[spriteId]);
    if (imgPath) {
      this.sprites[spriteId]['filename'] = imgPath + '/' + 
                       spriteId + '-sprite.png';
    }

    var dir = params[PARAMS['direction']];
    if (dir && dir == PARAMS['horizontal']) {
      this.sprites[spriteId]['layout'] = 'horizontal';
    }

    if (config[id]) mixin(config[id], this.sprites[spriteId]);

    ids[id] = spriteId;
    id++;
    this.set('id', id);
    return spriteId;
  },

  _bind: function(){
    var cssReader = this.get('cssReader');
    //收集css规则
    cssReader.on('ruleEnd', this._getRule, this);
    //收集规则结束
    cssReader.on('change:timeEnd', this._cssEnd, this);
    this.on('change:imgPath', this._setImgPath);
  },

  /**
   * 设置sprites图片的url地址，规则是imgPath + id + '-sprite'.png，id由两部分构
   * 成，前缀为css文件名，后缀是id，默认情况下id为空，其他id从1开始计数，imgPath
   * 是由第一个需要做拼图的图片地址决定的
   */
  _setImgPath: function(e){
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
  _getRule: function(e){
    var property = e.property;
    var ruleIds = this.get('ruleIds');
    var imageIndex = property.indexOf('background');

    if (imageIndex == -1) imageIndex = property.indexOf('background-image');

    ruleIds.push(e.id);
    if (imageIndex > -1) {
      this._collectImages(e, imageIndex);
    }
  },


  /**
   * 获取css中背景图
   * @param css {object} css规则
   * @param imageIndex {number} 背景图属性所在的位置
   */
  _collectImages: function(css, imageIndex){
    var urlVal = css.value[imageIndex];
    var image  = this._isSpriteImage(urlVal, imageIndex, css);
    var images = this.images;

    if (image){
      image = path.relative('./', image);
      image = image.replace(/\\+/g, '/');
      images[css.id] = image;
    }
  },

  /**
   * 判断是否是需要做sprite的图片，默认情况下，所有的图片都需要做拼合处理，当遇
   * 到如下情况是，不做拼图：
   * 1. 如果是http方式url，不做sprite
   * 2. 图片url参数中有ESC_KEY，比如a.png?esc
   * @param val {string} css background 对应的value值，比如 url(a.png) left
   * right;
   */
  _isSpriteImage: function(val, index, rule){
    //存在url，并且url不是http方式
    var isHttpUrl = val.indexOf('//') > -1;
    var ret = false;
    if (!isHttpUrl){
      var uri = imageUrlReg.exec(val);
      if (uri){
        var imgurl = url.parse(uri[1], true);
        var params = imgurl.query;
        var id = params['id'] || 0;
        ret = imgurl.pathname.replace(/\\+/g, '/');
        //过滤图片
        if (!(PARAMS['nosprite'] in params)){
          //设置第一个图片为sprite图片位置
          if (!this.get('imgPath')){
            this.set('imgPath', path.dirname(ret));
          }

          var preParam = this.get('preParam');
          var _id = this.get('id');
          if (_id == id){
            this.initSpriteConf(params);
            //依次初始化图片配置
            preParam.forEach(this.initSpriteConf, this);
            preParam = [];
          } else if (_id < id){
            //如果id提前出现，既id为0的图片没有出现之前，id是1的已经出现了，把
            //当前参数存在数组preParam中
            var isNewImg = preParam.every(function(params){
              return params.id < id;
            });
            if (isNewImg) preParam.push(params);
          }
          this.set('preParam', preParam);
        } else {
          var cssImgs = this.get('cssImgs');
          cssImgs.push(ret);
          rule.value[index] = val.replace(imgurl.pathname, ret);
          ret = false;
        }
      }
    }

    return ret;
  },

  /**
   * 文件读取完毕
   * @next Api.getImagesSize -> this._setDef
   */
  _cssEnd: function(e){
    var images  = this.images;
    var baseDir = path.dirname(this.get('file'));
    var files   = {};
    var equals = {};

    forEach(images, function(file, id){
      var fullPath = path.resolve(baseDir, file);
      if (files[fullPath] !== undefined) {
        equals[id] = files[fullPath];
      } else {
        //去除重复
        files[fullPath] = id;
      }
    });

    this.equals = equals;

    files = Object.keys(files);
    files.forEach(function(file){
      var fs = require('fs');
      var exists    = fs.existsSync;
      if (!exists(file)){
        console.log(file);
      }
    });

    //获取图片大小
    Api.getImagesSize(files, this._setDef, this);
  },

  /**
   * 设置图片配置，Api.getImagesSize函数回调
   * @param {Error} err 错误信息
   * @param {string|json} data 读取图片大小接口返回数据，包括图片大小和图片类型
   * @next this._setPos
   */
  _setDef: function(err, data){

    if (err) throw Error(data.toString());

    var baseDir = path.dirname(this.get('file'));
    var filePath;
    var imagesDef = this.imagesDef;

    forEach(data, function(def, file){
      filePath = path.relative(baseDir, file);
      filePath = filePath.replace(/\\+/g, '/');
      imagesDef[filePath] = def;
    });

    this._setPos();
  },

  /**
   * 设置背景图位置
   */
  _setPos: function(){
    var imagesDef = this.imagesDef;
    //排序
    var imgs = Object.keys(imagesDef);

    var self = this;

    forEach(imgs, function(img){
      var imageInfo = imagesDef[img];
      var css = self._getCss(img);
      var box = new Box(css.property, css.value, css.line);
      imageInfo['file_location'] = img;
      mixin(self._coords(box, imageInfo), imageInfo);

      self._setImageInfo(box, imageInfo);
    });

    //拼图算法接口调用
    forEach(this.sprites, function(sprite){
      var layout = sprite.layout;
      var file = layout;
      if (layout == 'close' || layout == 'auto') file = 'vertical';
      var Locate = require('../locating/' + file);
      var Loc = new Locate(sprite.images, imagesDef, layout || this.get('layout'));
      sprite.height = Loc.height;
      sprite.width = Loc.width;
      this._setChangedRules(sprite);
      debugger;
    }, this);

    this.fire('finish:parser');
  },

  _setChangedRules: function(sprite){
    var imgBase      = sprite.filename;
    var cssReader    = this.get('cssReader');
    var imgBase8     = imgBase.replace('sprite.png', 'sprite8.png');
    var imgPath      = sprite['force8bit'] ? imgBase8 : imgBase;
    var changedRules = this.get('changedRules');
    var defs         = this.imagesDef;
    var extraRules   = this.get('extraRules');
    var spritesImgs  = this.get('spritesImgs');
    var cssImgs      = this.get('cssImgs');
    var selectors    = [];

    function setRule(def, rule, imgInfo){
      var value = [];
      var property = [];
      var filters = ['background', 'background-image', 
        'background-repeat', 'background-position'];

      property = rule.property.filter(function(prop, i){
        var index = filters.indexOf(prop);
        if (index === -1){
          value.push(rule.value[i]);
          return true;
        }
      });

      if (def['repeat'] != 'no-repeat'){
        property.push('background-repeat');
        value.push(def['repeat']);
      }

      property.push('background-position');
      value.push(def.position);

      changedRules[rule.id] = {
        selector: rule.selector,
        property: property,
        value: value,
        id: rule.id
      };
      selectors = selectors.concat(rule.selector);

    }

    var equals = this.equals;
    var eqInfos = {};
    forEach(equals, function(key1){
      eqInfos[key1] = '';
    });

    forEach(sprite.images, function(imgInfo){
      var img = imgInfo['file_location'];
      var rule = this._getCss(img);
      var def  = defs[img];
      if (eqInfos[rule.id] !== undefined) {
        eqInfos[rule.id] = [imgInfo, def];
      }
      setRule(def, rule, imgInfo);
    }, this);

    //规则重复的情况
    forEach(equals, function(id1, id2){
      var rule = cssReader.getRule(id2);
      var def = eqInfos[id1][1];
      var imgInfo = eqInfos[id1][0];
      setRule(def, rule, imgInfo);
    });

    var extraRule = {
      property: ['background-image', 'background-repeat'],
      value: ['url(' + imgPath + ')', 'no-repeat'],
      selector: selectors
    };

    extraRules.push(extraRule);
    spritesImgs.push(imgBase);
    cssImgs.push(imgPath);
  },

  _setImageInfo: function(box, imageInfo){
    var id = this.get('id');
    var background = box.background;
    var params = background.params || {};
    var basename = this.get('basename');

    //sprite图片地址
    var spriteId = params.id ? basename + params.id : basename;
    var sprites = this.sprites[spriteId];

    sprites['images'][imageInfo['file_location']] = mixin(imageInfo, {});
    imageInfo.box = box;
  },

  /**
   * 生成sprite图片
   * @next writeCssBack 回写css样式，生成sprite样式
   */
  createSprite: function(){

    var sprites = this.sprites;

    if (Object.keys(sprites).length === 0) {
      console.log('[info]no image need merge');
      this.fire('finish:merge', {exit: true});
    } else {
      //拼图
      Api.mergeImages([this.get('file'), sprites], this._finishMerge, this);
    }
  },

  _finishMerge: function(err, data){

    if (err) throw new Error(data);

    console.log(data.info.join(''));
    console.log();
    this.fire('finish:merge');

  },

  _coords: function(box, imageInfo){
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
      //处理center
      if (position.x === 'center'){
        if (box.width){
          position.x = Math.floor((box.width - imageInfo.width) / 2);
        } else {
          console.log('[Error info @' + box.line + 
            ']use 50% for background-position but not set ');
        }
      }

      if (position.y === 'center'){
        if (box.width){
          position.y = Math.floor((box.height - imageInfo.height) / 2);
        } else {
          console.log('[Error info @' + box.line + 
            ']use 50% for background-position-y but not set height');
        }
      }


      if (position.x == 'right') ret['align'] = 'right';

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
  _getCss: function(img){
    var cssReader = this.get('cssReader');
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

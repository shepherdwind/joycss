"use strict";
var path      = require('path');
var cssReader = require('./cssReader');
var StdClass  = require('../lib/stdclass');
var Api       = require('./graph/api');
var some      = require('../lib/utils').some;
var forEach   = require('../lib/utils').forEach;
var mixin     = require('../lib/utils').mixin;
var util      = require('util');
var fs        = require('fs');
var Box       = require('../lib/box');
var url       = require('url');
var post      = require('../lib/post');
var exists    = fs.existsSync || path.existsSync;

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
    destFile     : '',
    basename     : '',
    id           : 0,
    ids          : {},
    imgPath      : '',
    //预处理数组
    preParam     : [],
    ruleIds      : [],
    layout       : 'auto',
    force8bit    : true,
    background   : 'ffffff7f',
    writeFile    : false,
    useImportant : false,
    uploadFile   : false,
    nochange     : false,
    //需要等待的任务
    task         : -1
  },

  CONSIT: {
  },

  _init: function(){
    var file = this.get('file');
    if (!file) throw Error('file is not defined');

    var cssFile = file;
    var destFile = file;

    if (this.get('writeFile')){
      var sourceFile = file.replace('.css', '.source.css');
      if (exists(sourceFile)){
        cssFile = sourceFile;
      } else {
        cssFile = file;
      }
    } else {
      destFile = file.replace('.css', '.sprite.css');
    }

    this.cssReader = new cssReader({file: cssFile, copyFile: sourceFile});
    this.set('destFile', destFile);

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

    if (this.get('nochange')){
      var _this = this;
      fs.readFile(file.replace('.css', '.json'), function(err, data){
        if (!err) {
          try {
            var ret = JSON.parse(data);
            _this.imagesMap = ret;
            console.log('Read from json backup file');
          } catch(e){
            console.log('Read json file failed!');
          }
        }
      });
    }

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
    if (imgPath) {
      this.sprites[spriteId]['filename'] = imgPath + '/' + 
                       spriteId + '-sprite.png';
    }

    var dir = params[PARAMS['direction']];
    if (dir && dir == PARAMS['horizontal']) {
      this.sprites[spriteId]['layout'] = 'horizontal';
    }

    ids[id] = spriteId;
    id++;
    this.set('id', id);
    return spriteId;
  },

  _bind: function(){
    var cssReader = this.cssReader;
    //收集css规则
    cssReader.on('ruleEnd', this.getRule, this);
    //收集规则结束
    cssReader.on('change:timeEnd', this.cssEnd, this);
    this.on('change:imgPath', this.setImgPath);
  },

  /**
   * 设置sprites图片的url地址，规则是imgPath + id + '-sprite'.png，id由两部分构
   * 成，前缀为css文件名，后缀是id，默认情况下id为空，其他id从1开始计数，imgPath
   * 是由第一个需要做拼图的图片地址决定的
   */
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
    var ruleIds = this.get('ruleIds');
    var imageIndex = property.indexOf('background');

    if (imageIndex == -1) imageIndex = property.indexOf('background-image');

    ruleIds.push(e.id);
    if (imageIndex > -1) {
      this.collectImages(e, imageIndex);
    }
  },

  /**
   * 写一条css规则，结果合并到this.cssResult
   * @param {object} rule css rule
   * @param {bool} isBegin 默认为false，为true时，规则写在最前面
   */
  writeRule: function(rule, isBegin){
    var self = this;
    var cssResult = '';
    var subs = [];
    var selectors = [];

    var index = 0;
    function findNest(){
      if (rule.property[index] instanceof Array){
        return {
          property: rule.property[index],
          value: rule.value[index]
        };
      } else {
        findNest(index++);
      }
    }

    forEach(rule.selector, function(selector){
      var sub = {
        selector: [],
        value: [],
        property: []
      };
      if (selector instanceof Array){
        sub = findNest();
        sub.selector = selector;
        index++;
        subs.push(sub);
      } else {
        selectors.push(selector);
      }
    });

    cssResult += selectors.join(",\n") + " {\n";

    forEach(rule.property, function(p, i){
      if (!(p instanceof Array)){
        cssResult += '  ' + p + ': ' + rule.value[i] + ";\n";
      }
    });

    if (!isBegin){
      this.cssResult += cssResult;
    } else {
      this.cssResult = cssResult + "\}\n" + this.cssResult;
    }

    forEach(subs, function(sub){
      this.writeRule(sub);
    }, this);

    if (!isBegin){
      this.cssResult += "}\n";
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
   * 判断是否是需要做sprite的图片，默认情况下，所有的图片都需要做拼合处理，当遇
   * 到如下情况是，不做拼图：
   * 1. 如果是http方式url，不做sprite
   * 2. 图片url参数中有ESC_KEY，比如a.png?esc
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
        if (!(PARAMS['nosprite'] in params)){
          ret = imgurl.pathname.replace(/\\+/g, '/');
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
        }
      }
    }

    return ret;
  },

  /**
   * 文件读取完毕
   * @next Api.getImagesSize -> this.setDef
   */
  cssEnd: function(e){
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

  /**
   * 设置图片配置，Api.getImagesSize函数回调
   * @param {Error} err 错误信息
   * @param {string|json} data 读取图片大小接口返回数据，包括图片大小和图片类型
   * @next this.setPos
   */
  setDef: function(err, data){
    if (err) throw Error(data.toString());

    var baseDir = path.dirname(this.get('file'));
    var filePath;
    var imagesDef = this.imagesDef;

    forEach(JSON.parse(data), function(def, file){
      filePath = path.relative(baseDir, file);
      filePath = filePath.replace(/\\+/g, '/');
      imagesDef[filePath] = def;
    });

    this.setPos();
  },

  /**
   * 设置背景图位置
   */
  setPos: function(){
    var imagesDef = this.imagesDef;
    //排序
    var imgs = Object.keys(imagesDef);

    var self = this;

    forEach(imgs, function(img){
      var imageInfo = imagesDef[img];
      var css = self.getCss(img);
      var box = new Box(css.property, css.value, css.line);
      imageInfo['file_location'] = img;
      mixin(self.coords(box, imageInfo), imageInfo);

      self.setImageInfo(box, imageInfo);
    });

    //拼图算法接口调用
    forEach(this.sprites, function(sprite){
      var layout = sprite.layout;
      var Locate = require('./locating/' + layout);
      var Loc = new Locate(sprite.images, imagesDef, this.get('layout'));
      sprite.height = Loc.height;
      sprite.width = Loc.width;
    }, this);

    this.createSprite();
  },

  setImageInfo: function(box, imageInfo){
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
    var sprites = mixin(this.sprites, {});

    forEach(sprites, function(sprite, name){
      if (!sprite.force8bit){
        var file = name + '-ie6';
        var spriteForIe = mixin(sprite, {});
        spriteForIe = mixin({
          force8bit: true,
          filename: sprite.filename.replace(name, file)
        }, spriteForIe);
        sprites[name + '-ie6'] = spriteForIe;
      }
    });

    var cfg = JSON.stringify(sprites);
    //拼图
    Api.mergeImages([this.get('file'), cfg], this.writeCssBack, this);
  },

  writeCssBack: function(err, data){
    if (err) throw new Error(data);

    debugger;
    data = JSON.parse(data);
    console.log(data.info.join(''));

    var file         = this.get('file');
    var spriteFile   = this.get('destFile');
    var cssReader    = this.cssReader;
    var len          = cssReader.getLen();
    var indexs       = Object.keys(this.images);
    var index        = indexs.shift();
    var multSelector = {};
    var ruleIds      = this.get('ruleIds');
    var rule, img;

    forEach(ruleIds, function(i){
      rule = cssReader.getRule(i);
      if (index != i){
        this.writeRule(rule);
      } else {
        img = this.images[index];

        //合并selector，处理一个图片有多个selector的情况
        multSelector[img] = multSelector[img] || [];
        multSelector[img] = multSelector[img].concat(rule.selector);
        this.writeSpriteRule(rule, this.imagesDef[img]);
        index = indexs.shift();
      }

    }, this);

    this.once('change:task:0', function(){
      fs.writeFile(spriteFile, this.cssResult, function(err, data){
        if (!err) console.log('sprite task finish');
      });

      if (this.get('uploadFile')) {
        var jsonFile = file.replace('.css', '.json');
        fs.writeFile(jsonFile, JSON.stringify(this.imagesMap), 
          function(err, data){
            if (!err) console.log('write image upload backup file ' + 
              path.basename(jsonFile));
        });
      }
    });

    this.writeAllSprite(multSelector);

  },

  getUploader: function(){
    if (this.get('uploadFile')){
      var config = fs.readFileSync(path.resolve(__dirname, '../upload.json'));
      try {
        var conf = JSON.parse(config);
        return conf;
      } catch(e){
        console.log('upload.json is not setted, pleace config you upload api');
        return false;
      }
    } else {
      return false;
    }
  },

  writeAllSprite: function(multSelector){

    var _this = this;
    var uploader = this.getUploader();

    var num = 0;
    forEach(this.sprites, function(sprites, spriteId){

      var selectors = [];
      forEach(sprites.images, function(def, img){
        selectors = selectors.concat(multSelector[img]);
      });

      var filename = sprites['filename'];
      var fileForIe = sprites.force8bit ? '' :
      filename.replace(spriteId, spriteId + '-ie6');

      if (uploader) {
        var newImgUrl = '';
        var upload1 = this._getUploader(filename, uploader);

        upload1.on('uploadEnd', function(e){
          newImgUrl = this._uploadEnd(e, filename) || filename;
          if (fileForIe) {
            if (newImgUrl2) this._writeAll(selectors, newImgUrl, newImgUrl2);
          } else {
            this._writeAll(selectors, newImgUrl);
          }
          this.finishTask();
        }, this);

        if (fileForIe){
          var upload2 = this._getUploader(fileForIe, uploader);
          var newImgUrl2 = '';

          upload2.on('uploadEnd', function(e){
            newImgUrl2 = this._uploadEnd(e, fileForIe) || fileForIe;
            if (newImgUrl) this._writeAll(selectors, newImgUrl, newImgUrl2);
            this.finishTask();
          }, this);
        }

      } else {
        this._writeAll(selectors, filename, fileForIe);
      }

    }, this);

    if (!uploader) this.finishTask(true);
  },

  _getUploader: function(file, config){

    var basePath = path.dirname(this.get('file'));
    var task = this.get('task');
    task++;
    if (!task) task = 1;
    this.set('task', task);

    console.log('uploading file ' + file);
    return new post(mixin(config, {
      file: path.resolve(basePath, file)
    }));
  },

  finishTask: function(isAll){
    var task = this.get('task');
    task = isAll? 0 : task - 1;
    this.set('task', task);
  },

  _uploadEnd: function(e, filename){

    var ret = false;

    if (e.success) {

      try {
        ret = JSON.parse(e.success);
        if (ret['url']){
          ret = ret['url'];
          this.imagesMap[filename] = ret;
          console.log('upload file get url ' + ret + ' success');
        } else {
          console.log('upload file fail');
          console.log(e.success.msg || e.success);
          ret = false;
        }

      } catch(e) {
        console.log('upload file fail');
        console.log(e.success);
        ret = false;
      }

    } else {
      console.log('upload file fail');
      console.log(e.err || e);
    }

    return ret;

  },

  _writeAll: function(selectors, filename, fileForIe){
    var important = this.get('useImportant') ? '!important': '';
    var imagesMap = this.imagesMap;

    //使用缓存图片
    filename = imagesMap[filename] || filename;
    var rule = {
      'selector': selectors,
      'property': ['background-image', 'background-repeat'],
      'value': ['url(' + filename + ')' + important, 'no-repeat']
    };

    if (fileForIe){
      fileForIe = imagesMap[fileForIe] || fileForIe;
      rule.property.push('_background-image');
      rule.value.push('url(' + fileForIe + ')' + important);
    }
    this.writeRule(rule, true);
  },

  writeSpriteRule: function(rule, def){
    var repeat = def['repeat'];
    var self = this;
    var backgroudProp = ['background', 'background-position', 
      'background-repeat', 'background-image'];

    self.cssResult += rule.selector.join(', \n') + " {\n";
    forEach(rule.property, function(prop, i){
      if (backgroudProp.indexOf(prop) == -1){
        self.cssResult += '  ' + rule.property[i] + ': ' + rule.value[i] + ';\n';
      }
    });

    if (repeat !== 'no-repeat'){
      self.cssResult += '  background-repeat: ' + repeat + ';\n';
    }
    self.cssResult += '  background-position: ' + def.position + ';\n';
    self.cssResult += "}\n";
  },

  coords: function(box, imageInfo){
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

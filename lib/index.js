var config = require('./common/config');
var Log = require('./common/log');
var graph = config.joyrc('php') ? 'php': 'node-gd';
var Api = require('./graph/' + graph);

if (!config.joyrc('isPass')) {
  Log.debug();
  Log.debug("  Well come to joycss.");
  var check = require('./check/index').checkAll();
  config.joyrc(null, check);
  return false;
}

var cssReader = require('./csslib/cssReader');
var utils     = require('./common/utils');
var SpriteDef = require('./csslib/spriteDef');
var CssWrite  = require('./csslib/cssWrite');
var Tasks     = require('./tasks/');
var path      = require('path');
var fs        = require('fs');
var exists    = fs.existsSync || path.existsSync;
var EventEmitter = require('events').EventEmitter;
var cssSource = require('./csslib/cssSource');

var red, blue, reset;
red   = '\033[31m';
blue  = '\033[34m';
reset = '\033[0m';

function Joycss(){
  this.timestart = Date.now();
  this.init.apply(this, arguments);
}

Joycss.Event = new EventEmitter();

var defaults = {
  global: {
    /**
     * 是否覆盖原有的图片
     */
    writeFile : false,
    /**
     * 是否上传图片
     */
    uploadImgs : false,
    /**
     * nochange 表示，只修改css，图片使用上一次拼图结果，拼图和图片本身不改变
     */
    nochange : false,
    /**
     * 使用png8模式，如果设置为false，生成png24图
     */
    force8bit : true,
    /**
     * 拼图算法，支持三种'auto | close | vertical | horizontal'
     * auto自动拼图，如果知道图片所在的盒子大小，使用紧凑拼图，否则独占一行
     * close: 紧凑拼图，搜有图片使用紧凑拼图
     * vertical: 垂直布局
     */
    layout : 'auto'
  }
};

Joycss.prototype = {
  constructor: Joycss,
  init: function(file, config, text, dest){

    this.config = config || {};
    var ext = path.extname(file);
    var inited = true;

    if (dest) this.dest = dest;

    if (text) {
      this.text = text;
    } else {

      if (!fs.existsSync(file)) {
        Log.error('file %s is not exist', file);
        process.exit(1);
      }
      var stats = fs.statSync(file);

    }

    if (!ext && !text) {
      if (exists(file + '.css')) {
        file = file + '.css';
      } else {
        //目录生成sprite
        if (stats.isDirectory()) {
          inited = false;
          this._readFromDir(file, config.global.prefix);
        }
      }
    } else if (cssSource.exts[ext]){
      inited = false;
      this.file = file.replace(ext, '.css');
      this._readFromSource(ext, file);
    } else if (ext !== '.css') {
      Log.error('unknow file type ' + ext);
      process.exit(1);
    }

    this.file = this.file || file;

    if (inited) this.run();
  },

  run: function(){
    this._init();
    this._bind();
  },

  _readFromSource: function(ext, file){
    var _this = this;
    Log.debug('read file source form ' + cssSource.exts[ext]);
    cssSource.event.once('success', function(e){
      _this.text = e.text || true;
      _this.run();
    });

    cssSource.getCss(ext, file);
  },

  _readFromDir: function(file, prefix){
    var files = fs.readdirSync(file);
    var exts = ['.png', '.gif', '.jpg'];
    var text = '';

    var images = files.map(function(f){
      return file + '/' + f;
    }).filter(function(f){
      var ext = path.extname(f);
      return (exts.indexOf(ext) !== -1 && f.indexOf('-sprite') === -1)
    });

    prefix = prefix || '';
    //获取图片大小
    Api.getImagesSize(images, function(err, sizes){

      utils.forEach(sizes, function(size, filename){

        var file = path.basename(filename);
        var ext = path.extname(filename);
        var classname = path.basename(file, ext).replace(/^([\w\-\d]+)\-hover$/, '$1:hover, .icons:hover .$1');

        text = text + '.' + prefix + classname + ' { background: url(' + file + ');' +
          'width: ' + size.width + 'px; height: ' + size.height + 
          'px; display: inline-block; *zoom: 1; *display: inline; }';
      });

      this.text = text || true;
      this.file = file + '/' + path.basename(file) + '.css';
      this.run();

    }, this);

  },

  //初始化配置
  _init: function(){
    this.config = utils.mixin(this.config, defaults);
    var file = this.file;

    var cssFile = file;
    var destFile = file;

    this._getConfig();

    if (!this.text) {
      if (this.config.global.writeFile){
        var sourceFile = file.replace('.css', '.source.css');
        if (exists(sourceFile)){
          cssFile = sourceFile;
        } else {
          cssFile = file;
        }
      } else {
        destFile = file.replace('.css', '.sprite.css');
      }

      this.cssReader = new cssReader({
        file: cssFile, copyFile: sourceFile
      });

    } else {
      this.cssReader = new cssReader({
        text: this.text
      });
    }

    var imgPath = this.config.global.imgPath;
    this.spriteDef = new SpriteDef({
      file: file,
      imgPath: this.config.global.imgPath,
      relative: this.config.global.relative,
      cssReader: this.cssReader,
      layout: this.config.global.layout,
      force8bit: this.config.global.force8bit,
      config: this.config
    });

    this.cssWrite = new CssWrite({
      destFile: this.dest ? this.dest : destFile,
      cssReader: this.cssReader
    });

  },

  _bind: function(){
    var spriteDef = this.spriteDef;
    var cssWrite  = this.cssWrite;
    var nochange = this.config.global.nochange;
    var _this = this;
    spriteDef.on('finish:parser', function(){
      cssWrite.write(this.get('changedRules'), this.get('extraRules'));
      if (!nochange){
        this.createSprite();
      } else {
        cssWrite.replace(_this.config.maps);
        Log.success('joycss --nochange end');
        Joycss.Event.emit('run:end', {
          file: cssWrite.get('destFile'),
          css: cssWrite.cssText
        });
      }
    });

    var cwd = path.dirname(this.dest || this.file);

    spriteDef.on('finish:merge', function(e){

      if (e && e.exit === true) {
        Joycss.Event.emit('run:end', { error: true });
        return;
      }

      var spritesImgs = this.get('spritesImgs');
      var cssImgs     = this.get('cssImgs');
      var quantsImg = [];
      var optis = [];
      cssImgs.forEach(function(img){
        var file = img.replace('sprite8.png', 'sprite.png');
        file !== img ? quantsImg.push(file) : optis.push(file);
      });

      var tasks = [];
      if (optis.length) tasks.push({files: optis, task: 'optipng'});
      if (quantsImg.length) tasks.push({files: quantsImg, task: 'quant'});

      new Tasks(tasks, cwd).once('success', function(){
        var config = _this.config;
        if (config.global.uploadImgs){
          var task = Tasks.upload(config.upload, cssImgs, _this.file);
          task.on('finish:upload', _this._uploadEnd.bind(_this));
        } else {
          _this._writeConfig();
        }
      });
    });

  },

  _uploadEnd: function(maps){
    var cssWrite  = this.cssWrite;
    cssWrite.replace(maps);
    this.config.maps = maps;
    this._writeConfig();
  },

  _writeConfig: function(){

    delete this.config.upload;
    delete this.config.global.nochange;

    var cssWrite = this.cssWrite;

    var self = this;
    var file = this.file.replace('.css', '.joy');
    //fs.writeFile(file, text, function(err){
    var time = 'cost time:' + red + (Date.now() - self.timestart) + reset + 'ms.';
    var endPart = '[develop model]image is not upload';
    if (self.config.maps) {
      endPart = '[deploy model]image is uploaded.';
    }

    Log.debug(red + endPart + reset);
    Joycss.Event.emit('run:end', {
      // css url地址
      file: cssWrite.get('destFile'),
      // css字符串
      cssText: cssWrite.cssText,
      // 图片路径
      img: this.spriteDef.get('output')
    });
    //});

  },

  _getConfig: function(){

    var localFile = this.file.replace('.css', '.joy');

    if (exists(localFile)){
      try {
        var localConfig = JSON.parse(fs.readFileSync(localFile));
      } catch(e) {
        localConfig = {}
      }

      if (this.config.global.nochange) {
        this.config = utils.mixin(localConfig, this.config);
      }

    }

    if (this.config.global.uploadImgs){
      this._getUploadConfig();
    }
  },

  _getUploadConfig: function(){
    if (config.joyrc('upload')){
      this.config.upload = config.joyrc('upload');
    } else {
      Log.error('upload has not config, please run joycss --config first');
    }
  }

};

var Mult = {
  tasks: [],
  isRuning: false,
  isInited: false,
  /**
   * 加入任务
   * @param args {array} 传递给joycss的参数
   * @param autoRun {bool} 是否自动执行
   */
  add: function(args, autoRun){
    this.tasks.push(args);
    if (autoRun) this.run();
  },

  run: function(finishData){

    if (this.isRuning) return;

    if (!this.tasks.length) {
      Joycss.Event.emit('mult:end',finishData);
      return;
    }

    var task = this.tasks.shift();

    this.isRuning = true;
    Log.debug();
    new Joycss(task[0], task[1] || {}, task[2], task[3]);
    var self = this;

    if (!this.isInited) {
      Joycss.Event.on('run:end', function run(finishData) {
        self.isRuning = false;
        self.run(finishData);
      });
      this.isInited = true;
    }
  }
};

Joycss.Mult = Mult;
Joycss.Log = Log;
Joycss.version = config.system('version');

Joycss.configUser = require('../bin/config').configUser;

module.exports = Joycss;

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
  init: function(file, config, text){

    this.config = config || {};
    var ext = path.extname(file);
    var inited = true;

    if (text) {
      this.text = text;
    } else {

      if (!fs.existsSync(file)) {
        console.log('file %s is not exist', file);
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
          this._readFromDir(file);
        }
      }
    } else if (cssSource.exts[ext]){
      inited = false;
      this.file = file.replace(ext, '.css');
      this._readFromSource(ext, file);
    } else if (ext !== '.css') {
      console.log('unknow file type ' + ext);
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
    console.log('read file source form ' + cssSource.exts[ext]);
    cssSource.event.once('success', function(e){
      _this.text = e.text || true;
      _this.run();
    });

    cssSource.getCss(ext, file);
  },

  _readFromDir: function(file){
    var files = fs.readdirSync(file);
    var exts = ['.png', '.gif', '.jpg'];
    var text = '';
    files.forEach(function(file){
      var ext = path.extname(file);
      if (exts.indexOf(ext) !== -1 && file.indexOf('-sprite') === -1){
        text = text + '.' + path.basename(file, ext) + 
               ' { background: url(' + file + ');}';
      }
    });
    this.text = text || true;
    this.file = file + '/' + path.basename(file) + '.css';
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

    this.spriteDef = new SpriteDef({
      file: file,
      cssReader: this.cssReader,
      layout: this.config.global.layout,
      force8bit: this.config.global.force8bit,
      config: this.config
    });

    this.cssWrite = new CssWrite({
      destFile: destFile,
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
        Joycss.Event.emit('run:end');
      }
    });

    var cwd = path.dirname(this.file);

    spriteDef.on('finish:merge', function(e){

      if (e && e.exit === true) {
        Joycss.Event.emit('run:end');
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

      new Tasks(tasks, cwd).on('success', function(){
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

    var text = JSON.stringify(this.config);
    text = this.formatJson(text);

    var self = this;
    var file = this.file.replace('.css', '.joy');
    fs.writeFile(file, text, function(err){
      var time = 'cost time:' + red + (Date.now() - self.timestart) + reset + 'ms.';
      var endPart = '[develop model]image is not upload';
      if (self.config.maps) {
        endPart = '[deploy model]image is uploaded.';
      }
      if (err) {
        console.log('[joycss end]write config false. ' + time);
        console.log(err);
      } else {
        console.log('[joycss end]write config success. ' + time);
      }

      console.log(red + endPart + reset);
      Joycss.Event.emit('run:end');
    });

  },

  formatJson: function(val) {
    var retval = '';
    var str = val;
    var pos = 0;
    var strLen = str.length;
    var indentStr = '  ';
    var newLine = "\n";
    var _char = '';

    for (var i=0; i<strLen; i++) {
      _char = str.substring(i,i+1);

      if (_char == '}' || _char == ']') {
        retval = retval + newLine;
        pos = pos - 1;

        for (var j=0; j<pos; j++) {
          retval = retval + indentStr;
        }
      }

      retval = retval + _char;	

      if (_char == '{' || _char == '[' || _char == ',') {
        retval = retval + newLine;

        if (_char == '{' || _char == '[') {
          pos = pos + 1;
        }

        for (var k=0; k<pos; k++) {
          retval = retval + indentStr;
        }
      }
    }

    return retval;

  },

  _getConfig: function(){

    var localFile = this.file.replace('.css', '.joy');

    if (exists(localFile)){
      var localConfig = JSON.parse(fs.readFileSync(localFile));

      if (this.config.global.nochange) {
        this.config = utils.mixin(localConfig, this.config);
      }

    }

    if (this.config.global.uploadImgs){
      this._getUploadConfig();
    }
  },

  _getUploadConfig: function(){
    var uploadFile = path.resolve(__dirname, '../../config.json');
    if (exists(uploadFile)){
      var upload = JSON.parse(fs.readFileSync(uploadFile));
      this.config.upload = upload;
    } else {
      console.log('[Error] upload has not config, please run joycss --config first');
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

  run: function(){
    if (this.isRuning) return;
    if (!this.tasks.length) return;
    var task = this.tasks.shift();

    this.isRuning = true;
    console.log();
    new Joycss(task[0], task[1] || {}, task[2]);
    var self = this;

    if (!this.isInited) {
      Joycss.Event.on('run:end', function run() {
        self.isRuning = false;
        self.run();
      });
      this.isInited = true;
    }
  }
};

Joycss.Mult = Mult;
module.exports = Joycss;

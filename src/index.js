var cssReader = require('./cssReader');
var utils     = require('../lib/utils');
var SpriteDef = require('./spriteDef');
var CssWrite  = require('./cssWrite');
var Tasks     = require('./tasks/');
var path      = require('path');
var fs        = require('fs');
var exists    = fs.existsSync || path.existsSync;

function Joycss(){
  this.init.apply(this, arguments);
}

var defaults = {
  global: {
    writeFile    : false,
    uploadImgs   : false,
    useImportant : false,
    nochange     : false,
    force8bit    : true,
    layout       : 'auto'
  }
};

Joycss.prototype = {
  constructor: Joycss,
  init: function(file, config){
    this.config = config || {};
    var stats = fs.statSync(file);
    var ext = path.extname(file);
    var inited = true;

    if (!ext) {
      if (exists(file + '.css')) {
        file = file + '.css';
      } else {
        //目录生成sprite
        if (stats.isDirectory()) {
          this._readFromDir(file);
        }
      }
    } else if (ext === '.less'){
      inited = false;
      this._readFromLess(file);
      this.file = file.replace('.less', '.css');
    }

    this.file = this.file || file;

    if (inited) this.run();
  },

  run: function(){
    this._init();
    this._bind();
  },

  _readFromLess: function(file){
    var _this = this;
    console.log('read file source form less');
    try {
      var less = require('less');
      var parser = new(less.Parser)({
        paths: [path.dirname(file)], 
        filename: path.basename(file)
      });
      var css = fs.readFileSync(file);
      parser.parse(css.toString(), function lessc(err, tree){
        if (err){
          console.log(err);
          process.exit(0);
        } else {
          var text = tree.toCSS();
          _this.text = text || true;
          _this.run();
        }
      });
    } catch(e){
      console.log('please install lessc first, run npn install less -g');
      process.exit(0);
    }
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
      }
    });

    var cwd = path.dirname(this.file);

    spriteDef.on('finish:merge', function(){
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
          var task = Tasks.upload(config.upload, cssImgs);
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

    var file = this.file.replace('.css', '.joy');
    fs.writeFile(file, text, function(err){
      if (err) {
        console.log('write config false');
        console.log(err);
      } else {
        console.log('write config success');
      }
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

      if (this.config.global.uploadImgs){
        this._getUploadConfig();
      }
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

module.exports = Joycss;

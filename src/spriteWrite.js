var StdClass  = require('../lib/stdclass');
function cssWrite(){
  StdClass.apply(this, arguments);
}

StdClass.extend(cssWrite, StdClass, {
  attributes: {},
  CONSIT: {},
  _init: function(){

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
  }

});

module.exports = cssWrite;

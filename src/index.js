var cssReader = require('./cssReader');
var utils     = require('../lib/utils');
var SpriteDef = require('./spriteDef');
var CssWrite  = require('./cssWrite');
function Joycss(){
  this.init.apply(this, arguments);
}

var config = {
    writeFile    : false,
    uploadFile   : false,
    useImportant : false,
    destFile     : '',
    nochange     : false
};
Joycss.prototype = {
  constructor: Joycss,
  init: function(file){
    this.cssReader = new cssReader({
      file: file
    });
    this.spriteDef = new SpriteDef({
      file: file,
      cssReader: this.cssReader
    });
    this.cssWrite = new CssWrite({
      file: file,
      cssReader: this.cssReader
    });
    this._bind();
  },

  _bind: function(){
    var spriteDef = this.spriteDef;
    var cssWrite  = this.cssWrite;
    spriteDef.on('finish:parser', function(){
      cssWrite.write(this.get('changedRules'), this.get('extraRules'));
      this.createSprite();
    });
  }
};

module.exports = Joycss;

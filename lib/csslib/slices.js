/**
 * 处理所有的图片碎片，获取所有需要拼图的图片，和图片相关的配置信息
 */
var Slices = function(cssReader){
  this.cssReader = cssResader;
  this.init();
};

Slices.prototype = {

  constructor: Slices,

  init: function(){
    this.cssReader.iterator(this._pickAllItem, this);
  },

  _pickAllItem: function(){
  }

};

module.exports = Slices;

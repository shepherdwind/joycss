'use strict';
/**
 * 水平布局算法，计算图片位置spritepos_left和spritepos_top，大图的宽度高度
 * @param {object} images 图片对象，记录align, height, width, repeat
 * @param {object} spriteConfig 图片对应的css规则
 */
function Horizontal(spriteConfig){
  this.spriteConfig = spriteConfig;
  this.width = 0;
  this.height = 0;
  this.init();
}

Horizontal.prototype = {
  constructor: Horizontal,
  init: function(){
    this.sortImgs();
    this.spriteConfig.forEach(this.siteImg, this);
  },

  siteImg: function(imageInfo){
    var box = imageInfo.box;
    var width = this.width;
    var height = this.height;
    var params = box.background.params;

    var imageHeight = imageInfo.height + imageInfo['spritepos_top'];

    if (imageHeight> height) {
      height = imageHeight;
    }

    var top, left;

    //position计算
    top = imageInfo['align'] || '0';
    left = width;
    if (left && imageInfo.width < width){
      left = '-' + left + 'px';
    } else {
      left = '0';
    }

    //repeat时候必须是整数倍宽度
    if (imageInfo['repeat'] === 'repeat-y'){
      var ceil = Math.ceil(height / imageInfo.height);
      if (ceil < 2) { ceil = 2; }
      height = imageInfo['height'] * ceil;
    }

    width += imageInfo['spritepos_left'];
    imageInfo['spritepos_left'] = width;

    width += parseInt(imageInfo.width, 10);
    //bottom padding
    if (params.right){
      width += parseInt(params.right, 10);
    } else if (box.width) {
      var right = box.width - imageInfo['spritepos_left'] - 
                  imageInfo['width'];
      width += right > 0 ? right : 0;
    }

    imageInfo.position = left + ' ' + top;
    this.width = width;
    this.height = height;
  },

  sortImgs: function(){
    this.spriteConfig.sort(function(imageInfo1, imageInfo2){
      var params1 = imageInfo1.box.background.params;
      var params2 = imageInfo2.box.background.params;

      //base参数，强制放在前面
      if ('base' in params1){
        return -1;
      } else if('base' in params2) {
        return 1;
      } else {

        return imageInfo2['height'] - imageInfo2['height'];
      }
    });
  }
};

module.exports = Horizontal;

/**
 * 水平布局算法，计算图片位置spritepos_left和spritepos_top，大图的宽度高度
 * @param {object} images 图片对象，记录align, height, width, repeat
 * @param {object} spriteDef 图片对应的css规则
 */
function Horizontal(images, spriteDef){
  this.images = images;
  this.spriteDef = spriteDef;
  this.width = 0;
  this.height = 0;
  this.init();
}

Horizontal.prototype = {
  constructor: Horizontal,
  init: function(){
    var imgList = this.sortImgs();
    imgList.forEach(this.siteImg, this);
  },

  siteImg: function(img){
    var imageInfo = this.spriteDef[img];
    var box = imageInfo.box;
    var width = this.width;
    var height = this.height;
    var params = box.background.params;

    var imageHeight = imageInfo.height + imageInfo['spritepos_top'];

    if (imageHeight> height) height = imageHeight;

    //position计算
    top = imageInfo['align'] || '0';
    left = width;
    if (left && imageInfo.width < width){
      left = '-' + left + 'px';
    } else {
      left = '0';
    }

    //repeat时候必须是整数倍宽度
    if (imageInfo['repeat'] == 'repeat-y'){
      var ceil = Math.ceil(height / imageInfo.height);
      if (ceil < 2) ceil = 2;
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

    this.images[img]['spritepos_top'] = imageInfo['spritepos_top'];
    this.images[img]['spritepos_left'] = imageInfo['spritepos_left'];
    imageInfo.position = left + ' ' + top;
    this.width = width;
    this.height = height;
  },

  sortImgs: function(){
    var images = this.images;
    var imgsList = Object.keys(images);
    imgsList.sort(function(img1, img2){
      return images[img2]['height'] - images[img1]['height'];
    });
    return imgsList;
  }
};

module.exports = Horizontal;


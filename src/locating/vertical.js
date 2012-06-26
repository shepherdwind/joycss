/**
 * 垂直布局算法，计算图片位置spritepos_left和spritepos_top，大图的宽度高度
 * @param {object} images 图片对象，记录align, height, width, repeat
 * @param {object} spriteDef 图片对应的css规则
 */
function Vertical(images, spriteDef){
  this.images = images;
  this.spriteDef = spriteDef;
  this.width = 0;
  this.height = 0;
  this.init();
}

Vertical.prototype = {
  constructor: Vertical,
  init: function(){
    var imgList = this.sortImgs();
    imgList.forEach(this.siteImg, this);
  },

  siteImg: function(img, i){
    var imageInfo = this.spriteDef[img];
    var box = imageInfo.box;
    var width = this.width;
    var height = this.height;
    var params = box.background.params;

    var imageWidth = imageInfo.width + imageInfo['spritepos_left'];
    if (imageWidth> width) width = imageWidth;

    //position计算
    left = imageInfo['align'] || '0';
    top = height;
    if (top && imageInfo.height < height){
      top = '-' + top + 'px';
    } else {
      top = 0;
    }

    //repeat时候必须是整数倍宽度
    if (imageInfo['repeat'] == 'repeat-x'){
      var ceil = Math.ceil(width / imageInfo.width);
      if (ceil < 2) ceil = 2;
      width = imageInfo['width'] * ceil;
    }

    height += imageInfo['spritepos_top'];
    imageInfo['spritepos_top'] = height;

    height += parseInt(imageInfo.height, 10);
    //bottom padding
    if (params.bottom){
      height += parseInt(params.bottom, 10);
    } else if (box.height) {
      var bottom = box.height - imageInfo['spritepos_top'] - 
                   imageInfo['height'];
      height += bottom > 0 ? bottom : 0;
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
      return images[img2]['width'] - images[img1]['width'];
    });
    return imgsList;
  }
};

module.exports = Vertical;

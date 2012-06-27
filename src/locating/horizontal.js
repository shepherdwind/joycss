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

    //设置固定的坐标
    var coods = params.cood;

    if (!coods){
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
    } else {
      coods = JSON.parse(coods);
      left = coods[0] + 'px';
      top = coods[1] ? coods[1] + 'px': coods[1];
      imageInfo['spritepos_top'] =  coods[1];
      imageInfo['spritepos_left'] = Math.abs(coods[0]);
    }

    this.images[img]['spritepos_top'] = imageInfo['spritepos_top'];
    this.images[img]['spritepos_left'] = imageInfo['spritepos_left'];
    imageInfo.position = left + ' ' + top;
    this.width = width;
    this.height = height;
  },

  sortImgs: function(){
    var images = this.images;
    var imagesDef = this.spriteDef;
    var imgsList = Object.keys(images);

    imgsList.sort(function(img1, img2){
      var imageInfo1 = imagesDef[img1];
      var params1 = imageInfo1.box.background.params;

      var imageInfo2 = imagesDef[img2];
      var params2 = imageInfo2.box.background.params;

      //base参数，强制放在前面
      if ('base' in params1){
        return -1;
      } else if('base' in params2) {
        return 1;
      } else {

        return images[img2]['height'] - images[img1]['height'];
      }
    });
    return imgsList;
  }
};

module.exports = Horizontal;

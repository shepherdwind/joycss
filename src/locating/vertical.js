var forEach = require('../../lib/utils').forEach;
var GrowingPacker = require('../../lib/packer');
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
  this.labels = {
    //固定定位
    fix: [],
    //占独立一行
    line: [],
    //紧凑拼图
    close: []
  };
  this.blocks = [];
  this.init();
}

Vertical.prototype = {
  constructor: Vertical,
  init: function(){
    var spriteDef = this.spriteDef;
    var labels = this.labels;

    forEach(this.images, this.setLables, this);

    this.sortImgs(labels.line);
    this.sortImgs(labels.close);

    forEach(labels.close, this.setBlocks, this);

    //大于3个时候才使用紧凑拼图
    if (this.blocks.length > 2){
      var packer = new GrowingPacker();
      packer.fit(this.blocks);
      this.width = packer.root.w;
      this.height = packer.root.h;
    } else {
      labels.line = labels.close.concat(labels.line);
      labels.close = [];
      this.sortImgs(labels.line);
    }

    forEach(labels.fix, this.siteImg, this);
    forEach(labels.close, this.closeSiteImg, this);
    forEach(labels.line, this.siteImg, this);
  },

  setBlocks: function(img){
    var spriteDef = this.spriteDef;
    var def = spriteDef[img];
    var box = def.box;
    var blocks = this.blocks;
    blocks.push({w: box.width, h: def.height});
  },

  closeSiteImg: function(img, i){
    var fit = this.blocks[i].fit;
    this.spriteDef[img]['coods'] = [fit.x, fit.y];
    this.siteImg(img, i);
  },

  setLables: function(val, img){
    var labels = this.labels;
    var def = this.spriteDef[img];
    var box = def.box;
    var params = box.background.params;
    if ('base' in params){
      labels.fix.push(img);
    } else if (box.hasWidth){
      labels.close.push(img);
    } else {
      labels.line.push(img);
    }
  },

  siteImg: function(img, i){
    var imageInfo = this.spriteDef[img];
    var width = this.width;
    var height = this.height;
    var box = imageInfo.box;
    var params = box.background.params;

    var imageWidth = imageInfo.width + imageInfo['spritepos_left'];
    if (imageWidth> width) width = imageWidth;

    //设置固定的坐标
    var coods = imageInfo.coods || params.coods || '';

    if (!coods) {
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
    } else {
      coods = coods instanceof Array ? coods : JSON.parse(coods);

      top = Math.abs(coods[1]);
      imageInfo['spritepos_top'] =  top;
      top = top ? '-' + top + 'px' : top;

      left = Math.abs(coods[0]);
      imageInfo['spritepos_left'] = left;
      left = left ? '-' + left + 'px': left;
    }

    this.images[img]['spritepos_top'] = imageInfo['spritepos_top'];
    this.images[img]['spritepos_left'] = imageInfo['spritepos_left'];
    imageInfo.position = left + ' ' + top;
    this.width = width;
    this.height = height;
  },

  sortImgs: function(imgsList){
    var imagesDef = this.spriteDef;
    var images = this.images;

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
        return images[img2]['width'] - images[img1]['width'];
      }
    });
  }
};

module.exports = Vertical;

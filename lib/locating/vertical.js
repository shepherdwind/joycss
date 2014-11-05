'use strict';
var forEach = require('../common/utils').forEach;
var GrowingPacker = require('./packer');
/**
 * 垂直布局算法，计算图片位置spritepos_left和spritepos_top，大图的宽度高度
 * @param {object} images 图片对象，记录align, height, width, repeat
 * @param {object} spriteConfig 图片对应的css规则
 */
function Vertical(spriteConfig, layout){
  this.spriteConfig = spriteConfig;
  this.layout = layout;
  this.width = 0;
  this.height = 0;
  this.labels = {
    //固定定位
    fix: [],
    //占独立一行
    line: [],
    //紧凑拼图
    close: [],
    //放置在最后
    end: []
  };
  this.blocks = [];
  this.init();
}

Vertical.prototype = {
  constructor: Vertical,
  init: function(){
    var spriteConfig = this.spriteConfig;
    var labels = this.labels;

    //console.log(JSON.stringify(spriteConfig));
    spriteConfig.forEach(this.setLables, this);

    this.sortImgs(labels.line);
    this.sortImgs(labels.close);

    forEach(labels.close, this.setBlocks, this);

    if (!this.pack()){
      labels.line = labels.close.concat(labels.line);
      labels.close = [];
      this.sortImgs(labels.line);
    }

    forEach(labels.fix, this.siteImg, this);
    forEach(labels.close, this.closeSiteImg, this);
    forEach(labels.line, this.siteImg, this);
    forEach(labels.end, this.siteImg, this);
  },

  // packer算法调用
  // 检测packer算法是否成功，如果中间某个fit为null，说明失败
  // 失败的情况，去掉失败的块，重新运算
  pack: function(){
    // 如果三个不到，退出pack运算
    if (this.blocks.length < 3) return false;
    var packer = new GrowingPacker();
    packer.fit(this.blocks);
    var labels = this.labels;
    var isOk = true;

    this.blocks.forEach(function(block, i){
      if (!block.fit){
        // 删除出现错误的块
        this.blocks.splice(i, 1);
        var item = labels.close.splice(i, 1);
        labels.line.push(item[0]);
        isOk = false;
      }
    }, this);

    if (!isOk) return this.pack();
    this.width = packer.root.w;
    this.height = packer.root.h;
    return true;
  },

  setBlocks: function(imageInfo){
    var box = imageInfo.box;
    var blocks = this.blocks;
    var params = box.background.params;
    //设置默认右边距
    var width = imageInfo.width + imageInfo['spritepos_left'];
    width += params.right ? parseInt(params.right, 10) : 10;

    var height = imageInfo.height + imageInfo['spritepos_top'];
    height += params.bottom ? parseInt(params.bottom, 10) : 10;

    width = box.width > width ? box.width : width;
    height = box.height > height ? box.height : height;

    blocks.push({w: width, h: height});
  },

  closeSiteImg: function(imageInfo, i){
    var fit = this.blocks[i].fit;
    imageInfo.coods = [fit.x, fit.y];
    this.siteImg(imageInfo);
  },

  setLables: function(imageInfo){
    var labels = this.labels;
    //var def = this.spriteConfig[img];
    var box = imageInfo.box;
    var params = box.background.params;
    if ('base' in params){
      labels.fix.push(imageInfo);
    } else if ('end' in params) {
      labels.end.push(imageInfo);
    } else if (this.layout === 'auto' &&
        box.hasWidth &&
        imageInfo.repeat === 'no-repeat' &&
        !imageInfo['align'] &&
        box.width < (imageInfo.width + imageInfo.spritepos_left)* 3){//盒子宽度小于图片的3倍
      labels.close.push(imageInfo);
    } else {

      if (this.layout === 'close' && !imageInfo['align'] && 
        imageInfo['repeat'] === 'no-repeat' && 
        box.width < (imageInfo.width + imageInfo.spritepos_left)* 3 &&
        !('line' in params)){

        labels.close.push(imageInfo);
      } else {
        labels.line.push(imageInfo);
      }
    }
  },

  siteImg: function(imageInfo){
    var width = this.width;
    var height = this.height;
    var box = imageInfo.box;
    var params = box.background.params;

    var imageWidth = imageInfo.width + imageInfo['spritepos_left'];
    if (imageWidth> width) width = imageWidth;

    //设置固定的坐标
    var coods = imageInfo.coods || params.coods || '';
    var left, top;

    if (!coods) {
      //position计算
      left = imageInfo['align'] || '0';
      top = height;
      //if (top && imageInfo.height < height){
      if (top){
        top = '-' + top + 'px';
      } else {
        top = 0;
      }

      //repeat时候必须是整数倍宽度
      if (imageInfo['repeat'] === 'repeat-x'){
        var ceil = Math.ceil(width / imageInfo.width);
        if (ceil < 2) ceil = 2;
        width = imageInfo['width'] * ceil;
      }

      var bottom = box.height - imageInfo['spritepos_top'] - imageInfo['height'];
      height += parseInt(imageInfo['spritepos_top']);
      imageInfo['spritepos_top'] = height;

      height += parseInt(imageInfo.height, 10);
      //bottom padding
      if (params.bottom){
        height += parseInt(params.bottom, 10);
      } else if (box.hasHeight) {
        height += bottom > 0 ? bottom : 0;
      } else {
        //默认10像素间距
        height += 10;
      }
    } else {
      coods = coods instanceof Array ? coods : JSON.parse(coods);

      top = Math.abs(coods[1]);
      imageInfo['spritepos_top'] =  top + imageInfo['spritepos_top'];
      top = top ? '-' + top + 'px' : top;

      left = Math.abs(coods[0]);
      imageInfo['spritepos_left'] = left + imageInfo['spritepos_left'];
      left = left ? '-' + left + 'px': left;
    }

    imageInfo.position = left + ' ' + top;
    this.width = width;
    this.height = height;
  },

  sortImgs: function(images){
    images.sort(function(imageInfo1, imageInfo2){
      var params1 = imageInfo1.box.background.params;
      var params2 = imageInfo2.box.background.params;

      //base参数，强制放在前面
      if ('base' in params1){
        return -1;
      } else if('base' in params2) {
        return 1;
      } else {
        return imageInfo2.width - imageInfo1.width;
      }
    });
  }
};

module.exports = Vertical;

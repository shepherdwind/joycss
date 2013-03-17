/**
 * Created by hanwen.sah@taobao.com.
 * Date: 2012-06-05
 * Time: 14:03
 * Desc: 图片处理api，包括读取图片大小，拼图过程
 */

var utils = require('../../common/utils');
var gd = require('node-gd');
var path = require('path');
var imageOpenFn = {
  '.jpg': 'openJpeg',
  '.jpeg': 'openJpeg',
  '.png': 'openPng',
  '.gif': 'openGif'
};

var Api = {

  /**
   * get the image size
   *
   * @param files {array} the files name of image file, full path
   * @param callback {function} callback of return
   * @param context {object} context of callback
   */
  getImagesSize: function(files, callback, context){

    var sizes = {};

    utils.walks(files, function(file, cb){
      var ext = path.extname(file);
      var fn = imageOpenFn[ext];

      if (fn) {

        gd[fn](file, function(err, img){
          if (err) {
            cb(err);
          } else {
            sizes[file] = {width: img.width, height: img.height};
            cb(null, {width: img.width, height: img.height});
          }
        });

      } else {
        cb(new Error('un know file type ' + ext));
      }
    }, function(err, ret){
      callback.call(context, err, sizes);
    });
  },

  /**
   * 调用拼图接口
   * @param conf {array} 传递给拼图算法的接口，数组第一个是css文件绝对路径，第二
   * 个是配置文件绝对路径
   */
  mergeImages: function(conf, callback, context){

    var dir = path.dirname(conf[0]);
    var sprites = conf[1];

    utils.forEach(sprites, function(config){

      var filename = path.join(dir, config.filename);
      var canvas = gd.createTrueColor(config.width, config.height);

      canvas.alphaBlending(0);
      canvas.saveAlpha(1);
      transparent = canvas.colorAllocateAlpha(255, 255, 255, 127);
      canvas.colorTransparent(transparent);
      canvas.filledRectangle(0, 0, config.width, config.height, transparent);

      var images = Object.keys(config.images);
      var imgDef = config.images;

      utils.walks(images, function(image, cb){

        var def = imgDef[image];
        var imagePath = path.join(dir, def['file_location']);
        var ext = path.extname(imagePath);
        var fn = imageOpenFn[ext];

        if (fn) {

          gd[fn](imagePath, function(err, img){

            if (err) {

              cb(err);
              
            } else {

              if (def['align'] === 'right') {
                def['spritepos_left'] = config.width - def['width'];
              } else if (def['align'] === 'center') {
                def['spritepos_left'] = (config.width - def['width']) / 2;
              }

              //repeat-x
              if (def['repeat'] === 'repeat-x') {

                var nWidth = 0;
                while(nWidth <= config.width) {
                  img.copy(canvas, def['spritepos_left'] + nWidth,
                           def['spritepos_top'], 0, 0,
                           def['width'], def['height'],
                           def['width'], def['height']);
                  nWidth += def['width'];
                }

              } else if (def['repeat'] === 'repeat-y') {

                var nHeight = 0;
                while(nHeight <= config.height) {
                  img.copyResampled(canvas, def['spritepos_left'],
                           def['spritepos_top'] + nHeight,
                           0,0, def['width'], def['height'],
                           def['width'], def['height']);
                  nHeight += def['height'];
                }

              } else {
                // copy to canvas
                img.copy(canvas, def['spritepos_left'], def['spritepos_top'], 
                         0, 0, def['width'], def['height']); 
              }

              cb(null, 'success');
            }
            
          });

        } else {
          cb(new Error('unknow file type ' + ext));
        }

      }, function(err, ret){
        if (err) {
          callback.call(context, err, ret);
        } else {
          canvas.savePng(filename, 1, function(err){
            callback.call(context, err, {info: ["node-gd merge image success"]});
          });
        }
      });

    });

  }

};

module.exports = Api;

/**!
 * scss源读取
 *
 * Copyright(c) Eward.song Limited.
 * MIT Licensed
 *
 * Authors:
 *   Eward <eward.song@gmail.com> (http://shepherdwind.com)
 */
var fs = require('co-fs');
var path = require('path');

module.exports = function* (file){

  try {
    var sass = require('node-sass');
  } catch (e) {
    Logger.error('node-sass模块不存在，请安装通过npm安装node-sass模块');
    return;
  }

  var css = yield fs.readFile(file);

  function co_sass(){
    return function(done){
      sass.render(css, function(err, text){
        if (err){
          done(err);
        } else {
          done(null, text);
        }
      }, {includePaths: [path.dirname(file)]});
    };
  }

  return yield co_sass();
};


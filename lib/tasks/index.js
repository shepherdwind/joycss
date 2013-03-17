var EventEmitter = require('events').EventEmitter;
var forEach   = require('../common/utils').forEach;
var mixin = require('../common/utils').mixin;
var post = require('./post');
var path = require('path');

/**
 * var task = {
 *   task: 'quant',
 *   files: ['a.png']
 * };
 */
function Tasks(tasks, cwd){
  this.num = 0;
  this.finish = 0;
  var _this = this;
  forEach(tasks, function(task){
    var exec = require('./' + task.task);
    forEach(task.files, function(file){
      var cmd = new exec({'file': file, cwd: cwd});
      console.log('[task ' + task.task + '] on file ' + file + ' begin');
      this.num = this.num + 1;
      cmd.on('finish', function(e){
        _this.emit('finish', {ret: e, file: file, task: task.task});
      });
    }, this);
  }, this);
  this._bind();
}

Tasks.prototype = new EventEmitter;

Tasks.prototype._bind = function(){
  this.on('finish', function(e){
    this.finish = this.finish + 1;
    //if (e.ret) console.log(e.ret);
    console.log('[task ' + e.task + '] on file ' + e.file + ' finish');
    if (this.finish === this.num){
      this.emit('success');
    }
  });
};

Tasks.upload = function(config, files, basePath){
  var i = 0;
  var posts = {};
  var maps = {};
  var ret = new EventEmitter();
  //防止forEach出错
  files = files || {};
  if (!config){
    console.log('[error] pleace run joycss --config first, config your user name cookie');
    console.log('[error] upload file fail!');
    process.exit(0);
  }

  forEach(files, function(file){
    i ++;
    console.log('uploading file ' + file);
    var _file = path.resolve(path.dirname(basePath), file);
    posts[file] = new post(mixin(config, {
      file: _file
    }));
  });

  forEach(posts, function(post, file){
    post.on('uploadEnd', function(e){
      i --;
      var fileurl = uploadEnd(e, file);
      if (fileurl) maps[file] = fileurl;
      //发布事件
      if (!i) ret.emit('finish:upload', maps);
    });
  });

  return ret;
};

function uploadEnd(e, filename){

  var ret = false;

  if (e.success){

    try {
      ret = JSON.parse(e.success);
      if (ret['url']){
        ret = ret['url'];
        console.log('upload file get url ' + ret + ' success');
      } else {
        console.log('upload file ' + filename + ' fail');
        console.log(e.success.msg || e.success);
        ret = false;
      }

    } catch(e) {
      console.log('upload file ' + filename + ' fail');
      console.log(e.success);
      ret = false;
    }

  } else {
    console.log('upload file ' + filename+ ' fail');
    console.log(e.err || e);
  }

  return ret;

}

Tasks.prototype.constructor =  Tasks;
module.exports = Tasks;

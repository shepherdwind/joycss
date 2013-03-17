/**
 * Created by hanwen.sah@taobao.com.
 * Date: 2012-06-05
 * Time: 14:03
 * Desc: 图片处理api，包括读取图片大小，拼图过程
 */

var spawn = require('child_process').spawn;
var phpCmd = 'php';
var sizeCmd = __dirname + '/size.php';
var combineCmd = __dirname + '/combine.php';
var Api = {

  /**
   * get the image size
   *
   * @param files {array} the files name of image file, full path
   * @param callback {function} callback of return
   * @param context {object} context of callback
   */
  getImagesSize: function(files, callback, context){

    var ret = '';
    var err = false;
    var cmd = spawn(phpCmd, [sizeCmd].concat(files), {cwd: __dirname});

    cmd.stdout.on('data', function cmdSuccess(data){
      ret += data.toString();
    });

    cmd.stderr.on('data', function cmdError(data){
      ret += data.toString();
      err = true;
    });

    cmd.on('exit', function cmdEnd(){
      context = context || this;
      ret = JSON.parse(ret);
      callback.apply(context, [err, ret]);
    });


  },

  /**
   * 调用拼图接口
   * @param conf {array} 传递给拼图算法的接口，数组第一个是css文件绝对路径，第二
   * 个是配置文件绝对路径
   */
  mergeImages: function(conf, callback, context){

    var ret = '';
    var err = false;
    conf[1] = JSON.stringify(conf[1]);
    var cmd = spawn(phpCmd, [combineCmd].concat(conf), {cwd: __dirname});

    callback = callback || function(err, ret){
      console.log(ret);
      if (err) throw Error(err);
    };

    cmd.stdout.on('data', function cmdSuccess(data){
      ret += data.toString();
    });

    cmd.stderr.on('data', function cmdError(data){
      ret += data.toString();
      err = true;
    });

    cmd.on('exit', function cmdEnd(){
      context = context || this;
      ret  = JSON.parse(ret);
      callback.apply(context, [err, ret]);
    });

  },

  config: function(cmd){
    phpCmd = cmd;
  }

};
module.exports = Api;

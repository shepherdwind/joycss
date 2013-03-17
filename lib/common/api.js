var utils  = require('../lib/utils');
/**
 * 多个文件执行，给其他程序的api
 * 参数形式：
 * [{
 *    "fileName":"{{appPath}}inits/index.css",
 *    "enable":true,
 *    "param":"-c"
 *  },
 *  {
 *    "fileName":"{{appPath}}inits/list.css",
 *    "enable":false,
 *    "param":"-n"
 * }]
 * @param datas {array} 多个参数的数组
 * @return {Joycss} joycss对象
 **/
var Joycss = require('./index');
function Api(datas){
  datas.forEach(function(data){
    var config = getFromParam(data);
    var params = [config['file'], config];
    Joycss.Mult.add(params, true);
  });
}

function getFromParam(data){
  var config = {
    file: data.fileName,
    global: {}
  };
  var argv = data.param.split(' ');
  var argu   = {global: []};

  argv.forEach(function(arg){
    if (arg[0] === '-'){

      if (arg.length > 2){
        var arg1 = arg[1];
        if (arg1 !== '-'){

          var i;
          //-us
          if (isNaN(+arg1)) {
            for (i = 1; i < arg.length; i++) argu.global.push(arg[i]);
          } else {
            //-0a -1c
            argu[arg1] = [];
            for (i = 2; i < arg.length; i++) argu[arg1].push(arg[i]);
          }

        } else {
          argu.global.push(arg.slice(2));
        }
      } else {
        //--alpha
        argu.global.push(arg[1]);
      }

    } else {
      //filename
      config.file = arg;
    }
  });


  utils.forEach(argu, function(args, key){
    args.forEach(function(arg){
      matchArg(arg, key, config);
    });
  });

  return config;
}


function matchArg(arg, key, config){
  key = key || 'global';
  if (!config[key]) config[key] = {};
  var msg = '';
  switch (arg) {

    case 'y':
    case 'vertical': {
      msg = ('use layout vertical');
      config[key].layout = 'vertical';
      break;
    }

    case 'x':
    case 'horizontal': {
      config[key].layout = 'horizontal';
      break;
    }

    //全部使用紧凑拼图
    case 'c':
    case 'close': {
      msg = ('use layout close');
      config[key].layout = 'close';
      break;
    }

    //使用png24
    case 'a':
    case 'alpha': {
      msg = ('use alpha mode, sprite image will be truecolor image, eg:png24');
      config[key].force8bit = false;
      break;
    }

    //重写文件名,使用source文件
    case 's':
    case 'source': {
      msg = ('rewrite css file, use .source.css file as input');
      config[key].writeFile = true;
      break;
    }

    //图片上传
    case 'u':
    case 'upload': {
      msg = ('upload image file an sprite finish');
      config[key].uploadImgs = true;
      break;
    }

    //重写文件名,使用source文件
    case 'i':
    case 'important': {
      msg = ('add important for sprite rule, improve background-image level');
      config[key].useImportant = true;
      break;
    }

    case 'n':
    case 'nochange':{
      msg = ('nochange for sprite image, use the backup url');
      config[key].nochange = true;
      break;
    }

    default: {
      msg = ('[error]unknow option ' + arg);
      break;
    }
  }

  //if (msg) console.log('[config ' + key + ']' + msg);
  return config;
}

module.exports = Api;

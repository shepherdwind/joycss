var config = require('../lib/common/config');
var util = require('util');
var program = require("commander");

function configUser(callback){
  program.prompt('Input you taobao login user name: ', function(name){
    name = util.format("_nk_=%s;", escapeIt(name));
    var headers = config.getJSON('./config.json', __dirname);
    headers['headers']['Cookie'] = name;
    config.joyrc('upload', headers);
    console.log('config success');
    console.log(JSON.stringify(headers, null, 2));
    process.stdin.destroy();
    callback && callback.call && callback();
  });
}

function escapeIt(str){
  var len = str.length;
  var ret = '';
  for (var i = 0; i < len; i++) {
    var bit = str.charCodeAt(i);
    if (bit < 0 || bit > 255){
      ret += '\\u' + bit.toString(16);
    } else {
      ret += str[i];
    }
  }
  return ret;
}

exports.configUser = configUser;

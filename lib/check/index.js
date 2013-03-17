require("shelljs/global");

var util = require('util');
var path = require('path');

var ok = '√';
var notok = '×';

function checkPhp(option){

  var log = console.log;

  if (option && option.silent) log = function(){};

  log();
  log('  Check PHP environment');

  if (!which('php')) {

    log('   %s  No php cli is installed!', notok);
    return false;

  } else {
    
    log('    %s PHP Command Line is ok', ok);

    var status = exec(util.format('php %s', path.join(__dirname, 'env.php')), {silent: true});

    var ret = JSON.parse(status.output);

    if (ret.gd) {
      log('    %s PHP GD Support is ok', ok);
      log();
      return true;
    } else {
      log('    %s PHP with no GD Support!', notok);
      log();
      return false;
    }

  }

}

function checkGD(option){

  var log = console.log;
  if (option && option.silent) log = function(){};
  
  log();
  log('  Check node-gd package status');

  try {

    var nodegd = require('node-gd');
    log('    %s Node-gd module is ok', ok);
    return true;

  } catch(e){

    if (e.code === 'MODULE_NOT_FOUND') {
      log('    %s node-gd module is not install, please install is use `npm install node-gd`!', notok);
    } else {
      log('     %s %s', notok, e);
    }

    log();

    return false;
  }
}

function checkAll(option){

  var log = console.log;
  if (option && option.silent) log = function(){};

  log();
  log("  Check Environment begin.");

  var php = checkPhp(option);
  var node_gd = checkGD(option);

  var pngquant = true;
  var optipng = true;

  // 非win系统，需要检测pngquant和optipng
  if (process.platform !== 'win32') {

    log();
    log("  Check if installed pngquant and optipng");

    if(which('pngquant')) {
      log("    %s pngquant is ok", ok) 
    } else {
      log("    %s pngquant is not ok", notok);
      pngquant = false;
    }

    if (which('optipng')) {
      log("    %s optipng is ok", ok) 
    } else {
      log("    %s optipng is not ok", notok);
      option = false;
    }

  }

  var isPass = (php || node_gd) && optipng && pngquant;
  log();

  if (isPass) {
    log("  %s Check Environment pass, all dependence is ok.", ok);
  } else {
    log("  %s Check Environment fail, you can get help from joycss.org.", notok);
  }

  log();

  return {isPass: isPass, php: php, node_gd: node_gd};
}

exports.checkGD = checkGD;
exports.checkPhp = checkPhp;
exports.checkAll = checkAll;

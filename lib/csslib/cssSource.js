var EventEmitter = require('events').EventEmitter;
var event = new EventEmitter();
var path      = require('path');
var fs        = require('fs');
var Log       = require('../common/log').Log;

var config = {
  '.less': 'less',
  '.scss': 'node-sass'
};
var parses = {
  '.less': lessc,
  '.scss': sass
};

function getCss(ext, file){
  checkMod(ext);
  parses[ext](file);
}

function lessc(file){

  var less = require('less');
  var parser = new(less.Parser)({
    paths: [path.dirname(file)], 
    filename: path.basename(file)
  });

  var css = fs.readFileSync(file);

  parser.parse(css.toString(), function lessc(err, tree){
    if (err){
      Log.error(err);
      process.exit(1);
    } else {
      var text = tree.toCSS();
      event.emit('success', {text: text});
    }
  });
}

function sass(file){

  var sass = require('node-sass');
  var css = fs.readFileSync(file);

  sass.render(css.toString(), function(err, text){

    if (err){
      Log.error(err);
      process.exit(0);
    } else {
      event.emit('success', {text: text});
    }

  }, {includePaths: [path.dirname(file)]});

}

function checkMod(ext){

  if (!config[ext]) {
    throw new Error("file type " + ext + " is no supported now.");
  }

  try {
    require(config[ext]);
  } catch (e) {
    Log.error('package ' + config[ext] + 'not install, run command `npm intall ' +
                config[ext] + ' -g`');
    process.exit(1);
  }
}

exports.exts = config;
exports.getCss = getCss;
exports.event = event;

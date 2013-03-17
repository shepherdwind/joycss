var fs = require('fs');
var path = require('path');
var systemConfig = getJSON('../../package.json', __dirname);

var osenv = require('osenv');
var joyrcPath = path.join(osenv.home(), '.joy.json');
var joyrcConfig = {};
if (fs.existsSync(joyrcPath)) joyrcConfig = getJSON(joyrcPath);

function getJSON(file, dir){
  if (dir) file = path.join(dir, file);
  return JSON.parse(fs.readFileSync(file).toString());
}

var system = function(key){
  return systemConfig[key];
};

function joyrc(key, value){
  if (!value) {
    return joyrcConfig[key];
  } else {

    if (key) {
      joyrcConfig[key] = value;
    } else {
      joyrcConfig = value;
    }

    fs.writeFileSync(joyrcPath, JSON.stringify(joyrcConfig, null, 2));
  }
}

exports.system = system;
exports.joyrc = joyrc;
exports.getJSON = getJSON;

var fs = require('fs');
var path = require('path');
var Exec = require('./exec');
var StdClass = require('../common/stdclass');

function quant(){
  this.init.apply(this, arguments);
}

StdClass.extend(quant, Exec, {

  attributes: {
    file: '',
    bin: 'pngquant',
    options: ['--ext', '8.png', '-f', '--iebug'],
    cwd: './'
  }
});
module.exports = quant;

var Exec = require('./exec');
var StdClass = require('../common/stdclass');

function optipng(){
  this.init.apply(this, arguments);
}

StdClass.extend(optipng, Exec, {

  attributes: {
    file: '',
    bin: 'optipng',
    options: ['-o3'],
    cwd: './'
  }
});
module.exports = optipng;

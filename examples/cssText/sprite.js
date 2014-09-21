'use strict';

process.env.DEBUG += ',joycss:Success';

var Joycss = require('../../index');
var fs = require('fs');
var path = require('path');
var base = path.join(__dirname, '../simple/');

var cssText = fs.readFileSync(base + '/base.css').toString();

new Joycss(base, {
  destCss: __dirname + '/build/base.css',
  destImg: __dirname + '/build/img/base.png',
  cssText: cssText
}).run(function(err, result){
  if (err) {
    throw new Error(err);
  }

  // result is the result of cssText
  console.log('build success');
});

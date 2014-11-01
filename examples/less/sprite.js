'use strict';

process.env.DEBUG += ',joycss:Success';

var Joycss = require('../../index');

new Joycss(__dirname + '/index.less', {
  destCss: __dirname + '/build/index.css',
  layout: 'close'
}).run(function(err, result){
  if (err) {
    throw new Error(err);
  }

  // result is the result of cssText
  console.log('build success');
});

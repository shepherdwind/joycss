'use strict';

process.env.DEBUG += ',joycss:Success';

var Joycss = require('../../index');

new Joycss(__dirname + '/icons', {
  destCss: __dirname + '/build/icons.css'
}).run(function(err, result){
  if (err) {
    throw new Error(err);
  }

  // result is the result of cssText
  console.log('build success');
});

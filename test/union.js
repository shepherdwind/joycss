'use strict';
var co = require('co');
var path = require('path');
var should = require('should');

var union = require('../src/union');

describe('union', function(){
  it('merge file', co(function*(){
    var file = path.join(__dirname, './css/style/normal.css');
    var destImg = path.join(__dirname, './css/img/normal.png');
    var destCss = path.join(__dirname, './css/out/normal.css');
    var ret = yield union.merge(file, destImg, destCss);
  }));
});

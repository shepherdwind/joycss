'use strict';
var co = require('co');
var path = require('path');
var should = require('should');

var position = require('../../src/css/position');
var slice = require('../../src/css/slice');
var read = require('../../src/read/index');

describe('postion', function(){
  it('simple', co(function*(){
    var file = path.join(__dirname, './style/normal.css');
    var css = yield read(file);
    var pieces = slice(css);
    var config = yield position(pieces, file);
    console.log(config);
  }));
});

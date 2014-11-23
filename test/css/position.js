'use strict';
var co = require('co');
var path = require('path');
var should = require('should');
var css = require('css');

var position = require('../../lib/css/position');
var slice = require('../../lib/css/slice');
var read = require('../../lib/read/index');

describe('postion', function(){
  it('simple', co(function*(){
    var file = path.join(__dirname, './style/normal.css');
    var style = yield read(file);
    var pieces = slice(css.parse(style));
    var config = yield position(pieces, file);
    config.width.should.eql(16);
    config.height.should.eql(78);
    config.images.length.should.eql(3);
  }));
});

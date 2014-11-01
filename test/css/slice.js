'use strict';
var co = require('co');
var path = require('path');
var should = require('should');
var css = require('css');

var slice = require('../../lib/css/slice');
var read = require('../../lib/read/index');

describe('read file frome dir', function(){
  it('get css from dir icons', co(function*(){
    var file = path.join(__dirname, './style/normal.css');
    var style = yield read(file);
    var imgs = slice(css.parse(style));
    imgs.length.should.equal(3);
  }));

  it('get slice ignore when image url has `?ecs`', co(function*(){
    var file = path.join(__dirname, '../../examples/simple/ignore.css');
    var style = yield read(file);
    var imgs = slice(css.parse(style));
    imgs.length.should.equal(2);

    var file = path.join(__dirname, '../../examples/simple/base.css');
    var style = yield read(file);
    var imgs = slice(css.parse(style));
    imgs.length.should.equal(3);
  }));
});

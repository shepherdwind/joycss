var co = require('co');
var path = require('path');
var should = require('should');

var slice = require('../../src/css/slice');
var read = require('../../src/read/index');

describe('read file frome dir', function(){
  it('get css from dir icons', co(function*(){
    var file = path.join(__dirname, './style/normal.css');
    var css = yield read(file);
    var imgs = slice(css);
    imgs.length.should.equal(3);
  }));
});

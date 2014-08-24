var co = require('co');
var read = require('../../src/read/index');
var path = require('path');
var should = require('should');

describe('read file', function(){

  it('should throw error', co(function*(){
    var file = path.join(__dirname, './css/nofile.less');
    var error = false;
    try {
      yield read(file);
    } catch (e) {
      error = true;
      e.toString().should.containEql('不存在');
    }
    error.should.be.true;
  }));

  it('should read css file ok', co(function*(){
    var file = path.join(__dirname, './css/a.css');
    var css = yield read(file);
    css.should.containEql('.hello');
    css.should.be.type('string');
  }));
});

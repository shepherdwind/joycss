var co = require('co');
var read = require('../../src/read/index');
var path = require('path');
var should = require('should');

describe('read file frome less', function(){

  it('should return less result', co(function*(){
    var file = path.join(__dirname, './css/a.less');
    var css = yield read(file);
    css.should.containEql('body .hello');
  }));

  it('should return parse error message', co(function*(){
    var file = path.join(__dirname, './css/error.less');
    var error = false;
    try {
      yield read(file);
    } catch(e) {
      error = true;
      e.toString().should.containEql('less 解析失败');
    }
    error.should.be.true;
  }));
});

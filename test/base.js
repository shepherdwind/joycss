var co = require('co');
var thunkify = require('thunkify');
var should = require('should');

function* read(){
  function A(name) {
    this.name = name;
  }
  A.prototype.say = function(name, callback){
    var self = this;
    setTimeout(function(){
      callback(null, name || self.name);
    }, 20);
  }

  var a = new A("hanwen");
  a.say = thunkify(a.say);
  return yield a.say(null);
}

describe('co context', function(){
  it('should keep context', co(function* (){
    //yield wait(100);
    var name = yield read();
    name.should.be.eql('hanwen');
  }));
});

function wait(ms) {
  return function (done) {
    setTimeout(done, ms)
  }
}

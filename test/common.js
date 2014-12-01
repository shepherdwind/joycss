'use strict';
var should = require('should');
var utils = require('../lib/common/utils');

describe('utils', function(){
  it('merge', function() {
    var a = { a: 1 };
    var b = { b: 1 };
    var o = utils.mixin(a, b);
    o.a.should.be.eql(1);
  });

  it('merge deep', function() {
    var a = { a: 1, c: { a: 1 , d: { a: 1 } } };
    var b = { b: 1, c: { b: 1 , d: { b: 1 } } };
    var o = utils.mixin(a, b);
    o.c.a.should.be.eql(1);
    o.c.b.should.be.eql(1);

    o.c.d.a.should.be.eql(1);
    o.c.d.b.should.be.eql(1);
  });

  it('merge null', function() {
    var a;
    var b = { b: 1 };
    var o = utils.mixin(a, b);
    o.b.should.eql(1);
  });
});

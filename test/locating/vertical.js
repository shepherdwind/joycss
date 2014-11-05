'use strict';
var co = require('co');
var Vertical = require('../../lib/locating/vertical');
require('should');
var layout = require('./layout.json');

describe('locating support', function() {
  it('get right position', co(function*(){
    var vertical = new Vertical(layout, 'auto');
    var height = layout.reduce(calc('height'));
    var end = layout[layout.length - 1];
    vertical.height.should.below(height);
    end.position.should.containEql(end.align);
  }));
});

function calc(type){
  return function(a, b){
    a = a[type] ? a[type] : a;
    b = b[type] ? b[type] : b;
    return a + b;
  };
}

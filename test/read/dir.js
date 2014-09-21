'use strict';
var co = require('co');
var read = require('../../lib/read/index');
var path = require('path');
var should = require('should');

describe('read file frome dir', function(){
  it('get css from dir icons', co(function*(){
    var file = path.join(__dirname, './css/icons/');
    var css = yield read(file);
    css.should.containEql('.justify-right');
    css.should.containEql('.formatter .bold');
  }));
});

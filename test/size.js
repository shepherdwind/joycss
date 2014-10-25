'use strict';
var co = require('co');
require('should');
var logger = require('../lib/common/logger');
var size = require('../lib/graph/size');

logger.error = function(err, msg){
  console.log(err, msg);
};

describe('image size read', function(){
  it('read success', co(function* (){
    var files = [
      './icons/justify-center.png',
      './icons/justify-left.png',
      './css/img/normal.png'
    ];
    var sizes = yield* size(__dirname, files);
    Object.keys(sizes).length.should.eql(3);
    sizes[files[0]].width.should.eql(16);
    sizes[files[2]].height.should.eql(78);
    // png类型
    sizes[files[0]].type.should.eql(3);
  }));
  it('read error, image not found', co(function* (){
    var files = [
      './icons/justify-center.png',
      './icons/justify-left1.png',
      './css/img/normal.png'
    ];

    var ret = yield* size(__dirname, files);
    (null === ret).should.eql(true);
  }));
});

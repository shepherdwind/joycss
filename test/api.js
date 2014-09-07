'use strict';
var co = require('co');
var path = require('path');
var should = require('should');
var readdir = require('fs').readdirSync;
var rmrf = require('rimraf').sync;
var fs = require('fs');

var Joycss = require('../src/index');
var Graph = require('../src/graph/index')();

/**
 * Tests
 */

describe('Joycss#api', function(){

  beforeEach(function(){
    cleanup();
  });

  it('simple merge file to build path', co(function*(){
    var file = path.join(__dirname, '../examples/simple/base.css');
    var destCss = path.join(__dirname, '../examples/simple/build/base.css');
    var joycss = Joycss(file, { destCss: destCss });
    var result = yield joycss.run();
    result.should.be.containEql('url(base-sprite.png)');
    fs.existsSync(destCss).should.be.true;
    fs.existsSync(joycss.option.destImg).should.be.true;
  }));

  it('set destImg path', co(function*(){
    var file = path.join(__dirname, '../examples/simple/base.css');
    var destImg = path.join(__dirname, '../examples/simple/build/base.png');
    var destCss = path.join(__dirname, '../examples/simple/build/base.css');
    var joycss = Joycss(file, { destImg: destImg, destCss: destCss});

    var result = yield joycss.run();
    result.should.be.containEql('url(base.png)');
    fs.existsSync(destCss).should.be.true;
    fs.existsSync(destImg).should.be.true;

  }));

  it('read file form less file', co(function*(){
    var file = path.join(__dirname, '../examples/less/index.less');
    var destCss = file.replace(/\.less$/, '.css');
    var destImg = file.replace(/\.less$/, '-sprite.png');
    var joycss = Joycss(file);

    var result = yield joycss.run();
    result.should.containEql('url(index-sprite.png)');
    fs.existsSync(destCss).should.be.true;
    fs.existsSync(destImg).should.be.true;

    var size = yield getSize(destImg);
    size.width.should.be.eql(210);
    size.height.should.be.eql(953);

    rmrf(destCss);
    rmrf(destImg);
  }));

  it('layout close support', co(function*(){
    var file = path.join(__dirname, '../examples/less/index.less');
    var destCss = file.replace(/(index)\.less$/, 'build/$1.css');
    var destImg = destCss.replace(/\.css$/, '-sprite.png');
    var joycss = Joycss(file, {
      destCss: destCss,
      destImg: destImg,
      layout: 'close'
    });

    var result = yield joycss.run();
    result.should.containEql('url(index-sprite.png)');
    fs.existsSync(destCss).should.be.true;
    fs.existsSync(destImg).should.be.true;

    var size = yield getSize(destImg);
    size.width.should.be.eql(260);
    size.height.should.be.eql(410);
  }));

  // 同一个文件被两次使用
  it('when one image used twice', co(function*(){
    var file = path.join(__dirname, '../examples/namesake/index.css');
    var joycss = Joycss(file);
    var result = yield joycss.run();
    var option = joycss.option;
    fs.existsSync(option.destImg).should.be.true;
    fs.existsSync(option.destCss).should.be.true;
  }));

  afterEach(function(){
    //cleanup();
  });
});

function cleanup(){
  var dir = path.join(__dirname, '../examples');
  var dirs = readdir(dir);
  dirs.forEach(function(name){
    if ('.' === name[0]) return;
    var build = path.join(dir, name, 'build');
    rmrf(build);
  });
}

function* getSize(imgPath){
  var img = path.basename(imgPath);
  var graph = new Graph(path.dirname(imgPath));
  var size = yield graph.size([img]);
  return size[img];
}

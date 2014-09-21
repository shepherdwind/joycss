'use strict';
var co = require('co');
var path = require('path');
var should = require('should');
var readdir = require('fs').readdirSync;
var rmrf = require('rimraf').sync;
var fs = require('fs');

var Joycss = require('..');
var Graph = require('../lib/graph/index')();

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

  // 同一个文件被两次使用，这种情况不好处理，暂时只支持每个图片使用相同的方式
  it.skip('when one image used twice', co(function*(){
    var file = path.join(__dirname, '../examples/namesake/index.css');
    var joycss = Joycss(file);
    var result = yield joycss.run();
    var option = joycss.option;
    fs.existsSync(option.destImg).should.be.true;
    fs.existsSync(option.destCss).should.be.true;
  }));

  // repeat-x支持
  it('repeat-x support', co(function*(){
    var file = path.join(__dirname, '../examples/repeat-x/repeat.css');
    var destCss = path.join(path.dirname(file), 'build/repeat.css');
    var joycss = Joycss(file, {
      destCss: destCss
    });
    var result = yield joycss.run();
    var option = joycss.option;
    fs.existsSync(option.destImg).should.be.true;
    fs.existsSync(destCss).should.be.true;
    result.should.containEql('background-repeat: repeat-x');
  }));

  // 水平布局支持
  it('horizontal support', co(function*(){
    var file = path.join(__dirname, '../examples/horizontal/detials.less');
    var destCss = path.join(path.dirname(file), 'build/index.css');
    var joycss = Joycss(file, {
      destCss: destCss,
      // 水平布局
      layout: 'horizontal'
    });
    var result = yield joycss.run();
    var option = joycss.option;
    fs.existsSync(option.destImg).should.be.true;
    fs.existsSync(destCss).should.be.true;

    var size = yield getSize(option.destImg);
    size.width.should.be.eql(253);
    size.height.should.be.eql(50);
  }));

  // 水平布局支持
  it('dir to css support', co(function*(){
    var file = path.join(__dirname, '../examples/dir/icons/');
    var destCss = path.join(path.dirname(file), 'build/icons.css');
    var joycss = Joycss(file, {
      destCss: destCss,
      layout: 'close'
    });
    var result = yield joycss.run();
    var option = joycss.option;
    fs.existsSync(option.destImg).should.be.true;
    fs.existsSync(destCss).should.be.true;
  }));

  it('only png24 support', co(function*() {
    var file = path.join(__dirname, '../examples/simple/base.css');
    var destCss = path.join(__dirname, '../examples/simple/build/base.css');
    var joycss = Joycss(file, { destCss: destCss, force8bit: false });
    var result = yield joycss.run();
    result.should.not.containEql('url(base-sprite8.png)');
    fs.existsSync(joycss.option.destImg.replace(/\.png$/, '8.png')).should.be.false;
  }));

  it('png8 support', co(function*() {
    var file = path.join(__dirname, '../examples/simple/base.css');
    var destCss = path.join(__dirname, '../examples/simple/build/base.css');
    var joycss = Joycss(file, { destCss: destCss });
    var result = yield joycss.run();
    result.should.be.containEql('url(base-sprite8.png)');
    fs.existsSync(joycss.option.destImg.replace(/\.png$/, '8.png')).should.be.true;
  }));

  it('base param support', co(function*() {
    var file = path.join(__dirname, '../examples/base/base.css');
    var destCss = path.join(__dirname, '../examples/base/build/base.css');
    var joycss = Joycss(file, { destCss: destCss });
    var result = yield joycss.run();
    result.should.be.containEql('background-image-inval');
  }));

  it('base param support in horizontal', co(function*() {
    var file = path.join(__dirname, '../examples/base/base.css');
    var destCss = path.join(__dirname, '../examples/base/build/base.css');
    var joycss = Joycss(file, {
      destCss: destCss,
      layout: 'horizontal'
    });
    var result = yield joycss.run();
    result.should.be.containEql('background-image-inval');
  }));

  afterEach(function(){
    cleanup();
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

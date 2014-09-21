'use strict';
var co = require('co');
var path = require('path');
var should = require('should');
var css = require('css');

var walk = require('../../lib/css/walk');
var read = require('../../lib/read/index');

describe('css语法树遍历', function(){
  it('@media、@keyframes嵌套情况', co(function*(){
    var file = path.join(__dirname, './style/media.css');
    var cssText = yield read(file);
    var ast = css.parse(cssText);
    var selectors = walk(ast, function(ast){
      return ast.selectors ? ast.selectors.join(',') : ast.values.join(',');
    });

    selectors.length.should.equal(6);
    selectors.should.containEql('68%,72%');
  }));

  it('css语法树修改', co(function*(){
    var file = path.join(__dirname, './style/media.css');
    var cssText = yield read(file);
    var ast = css.parse(cssText);

    var keyframes = walk(ast, function(ast){
      return ast.values ? ast.values[0]: undefined;
    });
    keyframes.join().should.equal('0%,30%,68%,100%');

    walk(ast, function(ast){
      if (ast.values) {
        var value = parseInt(ast.values[0]);
        ast.values[0] = value + 10 + '%';
      }
    });

    var keyframes = walk(ast, function(ast){
      return ast.values ? ast.values[0]: undefined;
    });
    keyframes.join().should.equal('10%,40%,78%,110%');
  }));

  it('大文件测试，walk递归不会导致堆栈溢出', co(function*(){
    var file = path.join(__dirname, './style/bootstrap.css');
    var cssText = yield read(file);
    var ast = css.parse(cssText);

    var keyframes = 0;
    var selectors = 0;
    var endLine = 0;

    walk(ast, function(ast){
      if (ast.type === 'keyframe') keyframes += 1;
      if (ast.selectors) selectors += 1;
      endLine = ast.position.end.line;
    });
    keyframes.should.equal(6);
    selectors.should.equal(1331);
    endLine.should.equal(6201);
  }));
});

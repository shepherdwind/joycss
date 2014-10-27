'use strict';
var co = require('co');
require('should');

var graph = require('../../lib/graph/index');
var IS_TRAVIS = process.env.TRAVIS;

describe('lib/graph/index.js', function(){
  it('auto select api', co(function* (){
    if (!IS_TRAVIS) {
      var api = graph();
      api.NAME.should.eql('php');
    }
  }));

  it('select php', co(function* (){
    global.joycssApi = 'php';
    var api = graph();
    api.NAME.should.eql('php');
  }));

  it('select java', co(function* (){
    global.joycssApi = 'java';
    var api = graph();
    api.NAME.should.eql('java');
  }));
});

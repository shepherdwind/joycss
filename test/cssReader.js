var assert = require('assert');
var CssReader = require('../lib/csslib/cssReader');
var util = require('util');
var path = require('path');
var fs = require('fs');

function getfile(file){
  file = path.join(__dirname, 'css/', file + '.css');
  return fs.readFileSync(file).toString();
}

describe("csslib/cssReader test", function(){

  describe('cssReader', function(){

    it("css base reader", function(){
      var reader = new CssReader({text: 'body {color: red}'}).parse();
      assert.equal(reader.getLen(), 1);
      assert.deepEqual(reader.getRule(0), {
        selector: ["body"],
        property: ["color"],
        value: ["red"],
        id: 0, line: 1
      });
    });

    it("css len count", function(){
      var cssText = '';
      var num = 60;
      for (var i = 0; i < num; i ++)
        cssText += util.format(".test%s { color: blue; }\n", i);

      var reader = new CssReader({text: cssText}).parse();
      assert.equal(num, reader.getLen());

      var reader1 = new CssReader().parse(getfile('p'));
      assert.equal(8, reader1.getLen());
    });

    it("@import should in the metas", function(){
      var meta = '@import url("booya.css") print, screen'
      var cssText = util.format('a {color: red}\n%s; body {font-size: 12px}', meta);
      var reader = new CssReader({text: cssText}).parse();
      assert.equal(reader.get("metas")[1][0], meta);
    });

    it("css selector support level2", function(){
      var reader = new CssReader().parse(getfile('selector'));
      var selectors = reader.get('selectors');
      var font = reader.getRule(10);
      assert.equal(12, reader.getLen());
      assert.equal('*', selectors[0][0]);
      assert.equal('h1 + *[rel=up]', selectors[5][0]);
    });

    it("Media Queries and keyframes support", function(){
      var cssText = getfile("nest");
      var len = new CssReader().parse(cssText).iterator(function(){
      }).getLen();
      assert.equal(2, len);
    });

  });
});

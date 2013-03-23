var assert = require('assert');
var CssReader = require('../lib/csslib/cssReader');
var CssWrite = require('../lib/csslib/cssWrite');
var util = require('util');
var path = require('path');
var fs = require('fs');

function getfile(file){
  file = path.join(__dirname, 'css/', file);
  return fs.readFileSync(file).toString();
}

function isEqual(text1, text2){
  text1 = text1.replace(/\s+/g, '');
  text2 = text2.replace(/\s+/g, '');
  assert.equal(text1, text2);
}

describe("csslib/cssWrite test", function(){

  describe("CssWrite", function(){

    it("cssWrite should equal the original cssText", function(){

      fs.readdirSync("./css/").forEach(function(file){

        var cssText = getfile(file);
        var cssWrite = new CssWrite({cssReader: new CssReader().parse(cssText)});
        var header = cssWrite._getHeader();
        cssWrite.write({}, {}, function(text){
          isEqual(text, header + cssText);
        });

      });

    });

    it("write cssReader with changedRule and extra rule", function(){

      var cssText = getfile("write-source.css");
      var ret     = getfile('change.css');
      var reader = new CssReader().parse(cssText);
      var changedRule = {
        0: { selector: ["body"], property: ["color"], value: ["blue"]},
        5: { selector: [".change"], property: ["position"], value: ["relative"]}
      };
      var extra = [{ selector: ["a"], property: ["color"], value: ["red"]}];
      var csswrite  = new CssWrite({cssReader: reader});
      var header = csswrite._getHeader();
      csswrite.write(changedRule, extra, function(text){
        isEqual(text, header + ret);
      });

    });



  });

});

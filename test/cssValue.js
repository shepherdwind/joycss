var assert = require('assert');
var Box = require('../lib/csslib/value/box');

describe("csslib/value test", function(){
  describe('box', function(){

    it("box size get from width and height", function(){
      var box = new Box(["width", "height"], ["10px", "10px"], 1);
      assert.equal(box.height, 10);
      assert.equal(box.width, 10);
    });

    it("box size should add padding", function(){
      var box = new Box(["width", "height", "padding"],
                        ["10px", "10px", "4px"], 1);
      assert.equal(box.height, 18);
      assert.equal(box.width, 18);

      var box1 = new Box(["width", "height", "padding"],
                         ["10px", "10px", "4px 5px"], 1);
      assert.equal(box1.height, 18);
      assert.equal(box1.width, 20);

      var box2 = new Box(["width", "height", "padding"], 
                         ["10px", "10px", "4px 5px 1px"], 1);
      assert.equal(box2.height, 15);
      assert.equal(box2.width, 20);

      var box3 = new Box(["width", "height", "padding-left", "padding-top"], 
                         ["10px", "10px", "4px", "7px"], 1);
      assert.equal(box3.height, 17);
      assert.equal(box3.width, 14);
    });

    it("box size get by em size", function(){
      var box = new Box(["width", "height", "font-size"], ["1em", "2em", "12px"], 1);
      assert.equal(box.height, 24);
      assert.equal(box.width, 12);

      var box1 = new Box(["width", "height", "line-height"], ["1em", "2em", "24px"], 1);
      assert.equal(box1.hasWidth, false);
      assert.equal(box1.hasHeight, false);
    });
  });
});

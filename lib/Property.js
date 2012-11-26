/**
 * Property 对一条属性进行分析，比如background: url(a.png) left right #eee;
 * 主要处理合模型，和背景图相关属性
 * [line-height|background|height|width|padding]
 */
var PropertyValuePart = require('./PropertyValuePart');
var url = require('url');

function Property(property, value){
  this.init.apply(this, arguments);
}

Property.prototype = {

  constructor: Property,

  supportType: [
    'line-height',
    'height',
    'width',
    'padding',
    'padding-left',
    'padding-right',
    'padding-top',
    'padding-bottom',
    'background',
    'background-position',
    'background-image'
  ],

  init: function(prop, value, line){
    this.prop = prop;
    this.value = value;
    this.line = line;
    if (this.supportType.indexOf(prop) == -1) return;
    this.attributes = {};
    //过滤多个空格
    this.multValue(value.replace(/\s+/g, ' ').split(' '));
  },

  multValue: function(values){
    var hander = this[this.prop];
    var args = [];
    values.forEach(function(val){
      args.push(new PropertyValuePart(val));
    });
    if (hander instanceof Function){
      hander.apply(this, args);
    } else {
      this.attributes = args[0];
    }
  },

  'padding': function(){
    var len = arguments.length;
    var data = [];
    //padding必须是像素或者0
    var isNotPx = [].some.call(arguments, function(val){
      data.push(val.value);
      return val.units !== 'px' && val.value !== 0;
    });

    if (isNotPx) return;

    if (len == 1){
      var val = arguments[0];
      this.attributes.padding = data.concat(data, data, data);
    } else if(len == 2){
      this.attributes.padding = data.concat(data);
    } else if(len == 3){
      this.attributes.padding = data.concat(data[1]);
    } else if(len == 4){
      this.attributes.padding = data;
    }
  },

  'background-position': function(x, y){
    this.attributes.position = {};
    if (!x || !y) throw new Error( this.value + ' background-position reader error.');
    this._setPos(x, 'x');
    this._setPos(y, 'y');
  },

  "background-image": function(img){
    if (img.type == 'uri'){
      var imgUrl = url.parse(img.uri, true);
      this.attributes.uri = imgUrl.pathname;
      this.attributes.params = imgUrl.query;
    }
  },

  "background": function(){
    var args = [].slice.call(arguments);
    var isPos = false;
    var breakNum;
    args.forEach(function(val, i){

      if (breakNum === i) return;
      if (val.type == 'uri'){
        //image
        this["background-image"](val);
      } else if(val.type == 'color' || val.value == 'transparent') {
        //color
        this.attributes['color'] = val.value;
      } else if(val.value.indexOf && val.value.indexOf('repeat') > -1) {
        //repeat
        this.attributes['repeat'] = val.value;
      } else if (!isPos){
        //position
        isPos = (val.type == 'percentage' || 
          val.type == 'length' || val.type == 'integer' ||
          ['left', 'center', 'right', 'top'].indexOf(val.value) > -1);

        if(isPos){ 
          this['background-position'](val, args[i + 1]);
          breakNum = i + 1;
        }
      }

    }, this);
  },

  _setPos: function(obj, redict){
    if (obj.value === 0) obj.type = 'percentage';
    if (obj.type == 'length' && obj.units == 'px') {
      this.attributes.position[redict] =  !obj.value ? 'left' : '' + obj.value;
    } else if(obj.type == 'identifier') {
      this.attributes.position[redict] = obj.value;
    } else if(obj.type == 'percentage'){
      if (obj.value === 0 || obj.value === 100) {
        if (redict == 'x')
          this.attributes.position[redict] = obj.value ? 'right' : 'left';
        else
          this.attributes.position[redict] = obj.value ? 'bottom' : 'top';
      } else if (obj.value === 50){
        this.attributes.position[redict] = 'center';
      } else {
        console.log('[Error info:@' + this.line +
          '] percentage in background-position only can support 0 50 100. ' + 
          obj.value + '% is just a relatively units.');
      }
    } 
  }

};

module.exports = Property;

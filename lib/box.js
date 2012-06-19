var Property = require('./Property');
var forEach = require('./utils').forEach;

function Box(property, value){
  this.property = property;
  this.value = value;
  this.width = 0;
  this.height = 0;
  this.hasWidth = false;
  this.hasHeight = false;

  this.background = {};
  //设置行高
  this.EM = 0;

  this.setEM();

  property.forEach(this.getProp, this);

  if (!this.hasWidth) this.width = 0;
  if (!this.hasHeight) this.height = 0;
}

Box.prototype.setEM = function(){
  var lineH = this.property.indexOf('line-height');
  if (lineH > -1){
    var property = new Property('line-height', this.value[lineH]);
    if (property.attributes.units == 'px'){
      this.EM = property.attributes.value;
      this.hasHeight = true;
    }
  }
};

Box.prototype.replaceEM = function(val){

  var EM = this.EM;
  if (!EM) return val;

  var tmp = val.split(' ');
  var ret = [];

  tmp.forEach(function(v){
    if (/(\d+)em/.test(v)){
      var num = parseFloat(v, 10) * EM;
      ret.push('' + num + 'px');
    } else {
      ret.push(v);
    }
  });

  return ret.join(' ');
};

Box.prototype.getProp = function(prop, i){

  if (prop === 'line-height') return;

  var val = this.replaceEM(this.value[i]);
  var property = new Property(prop, val);
  var attr = property.attributes;

  switch(prop) {
    case 'width': {
      this.width += attr.value;
      this.hasWidth = true;
      break;
    }

    case 'padding-left':
    case 'padding-right': {
      this.width += attr.value;
      break;
    }

    case 'padding': {
      this.width += attr.padding[2] + attr.padding[3];
      this.height += attr.padding[0] + attr.padding[2];
      break;
    }

    case 'padding-bottom':
    case 'padding-top': {
      this.height += attr.value;
      break;
    }

    case 'height': {
      this.hasHeight = true;
      this.height += attr.value > this.EM? attr.value : this.EM;
      break;
    }

    case 'background': {
      this.background = attr;
      break;
    }

    case 'background-repeat': {
      this.background.repeat = attr.value;
      break;
    }

    case 'background-position': {
      this.background.position = attr.position;
      break;
    }

    default:
      break;
  }
};

module.exports = Box;

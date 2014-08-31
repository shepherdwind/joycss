var Colors = {
  aliceblue       :"#f0f8ff",
  antiquewhite    :"#faebd7",
  aqua            :"#00ffff",
  aquamarine      :"#7fffd4",
  azure           :"#f0ffff",
  beige           :"#f5f5dc",
  bisque          :"#ffe4c4",
  black           :"#000000",
  blanchedalmond  :"#ffebcd",
  blue            :"#0000ff",
  blueviolet      :"#8a2be2",
  brown           :"#a52a2a",
  burlywood       :"#deb887",
  cadetblue       :"#5f9ea0",
  chartreuse      :"#7fff00",
  chocolate       :"#d2691e",
  coral           :"#ff7f50",
  cornflowerblue  :"#6495ed",
  cornsilk        :"#fff8dc",
  crimson         :"#dc143c",
  cyan            :"#00ffff",
  darkblue        :"#00008b",
  darkcyan        :"#008b8b",
  darkgoldenrod   :"#b8860b",
  darkgray        :"#a9a9a9",
  darkgreen       :"#006400",
  darkkhaki       :"#bdb76b",
  darkmagenta     :"#8b008b",
  darkolivegreen  :"#556b2f",
  darkorange      :"#ff8c00",
  darkorchid      :"#9932cc",
  darkred         :"#8b0000",
  darksalmon      :"#e9967a",
  darkseagreen    :"#8fbc8f",
  darkslateblue   :"#483d8b",
  darkslategray   :"#2f4f4f",
  darkturquoise   :"#00ced1",
  darkviolet      :"#9400d3",
  deeppink        :"#ff1493",
  deepskyblue     :"#00bfff",
  dimgray         :"#696969",
  dodgerblue      :"#1e90ff",
  firebrick       :"#b22222",
  floralwhite     :"#fffaf0",
  forestgreen     :"#228b22",
  fuchsia         :"#ff00ff",
  gainsboro       :"#dcdcdc",
  ghostwhite      :"#f8f8ff",
  gold            :"#ffd700",
  goldenrod       :"#daa520",
  gray            :"#808080",
  green           :"#008000",
  greenyellow     :"#adff2f",
  honeydew        :"#f0fff0",
  hotpink         :"#ff69b4",
  indianred       :"#cd5c5c",
  indigo          :"#4b0082",
  ivory           :"#fffff0",
  khaki           :"#f0e68c",
  lavender        :"#e6e6fa",
  lavenderblush   :"#fff0f5",
  lawngreen       :"#7cfc00",
  lemonchiffon    :"#fffacd",
  lightblue       :"#add8e6",
  lightcoral      :"#f08080",
  lightcyan       :"#e0ffff",
  lightgoldenrodyellow  :"#fafad2",
  lightgray       :"#d3d3d3",
  lightgreen      :"#90ee90",
  lightpink       :"#ffb6c1",
  lightsalmon     :"#ffa07a",
  lightseagreen   :"#20b2aa",
  lightskyblue    :"#87cefa",
  lightslategray  :"#778899",
  lightsteelblue  :"#b0c4de",
  lightyellow     :"#ffffe0",
  lime            :"#00ff00",
  limegreen       :"#32cd32",
  linen           :"#faf0e6",
  magenta         :"#ff00ff",
  maroon          :"#800000",
  mediumaquamarine:"#66cdaa",
  mediumblue      :"#0000cd",
  mediumorchid    :"#ba55d3",
  mediumpurple    :"#9370d8",
  mediumseagreen  :"#3cb371",
  mediumslateblue :"#7b68ee",
  mediumspringgreen   :"#00fa9a",
  mediumturquoise :"#48d1cc",
  mediumvioletred :"#c71585",
  midnightblue    :"#191970",
  mintcream       :"#f5fffa",
  mistyrose       :"#ffe4e1",
  moccasin        :"#ffe4b5",
  navajowhite     :"#ffdead",
  navy            :"#000080",
  oldlace         :"#fdf5e6",
  olive           :"#808000",
  olivedrab       :"#6b8e23",
  orange          :"#ffa500",
  orangered       :"#ff4500",
  orchid          :"#da70d6",
  palegoldenrod   :"#eee8aa",
  palegreen       :"#98fb98",
  paleturquoise   :"#afeeee",
  palevioletred   :"#d87093",
  papayawhip      :"#ffefd5",
  peachpuff       :"#ffdab9",
  peru            :"#cd853f",
  pink            :"#ffc0cb",
  plum            :"#dda0dd",
  powderblue      :"#b0e0e6",
  purple          :"#800080",
  red             :"#ff0000",
  rosybrown       :"#bc8f8f",
  royalblue       :"#4169e1",
  saddlebrown     :"#8b4513",
  salmon          :"#fa8072",
  sandybrown      :"#f4a460",
  seagreen        :"#2e8b57",
  seashell        :"#fff5ee",
  sienna          :"#a0522d",
  silver          :"#c0c0c0",
  skyblue         :"#87ceeb",
  slateblue       :"#6a5acd",
  slategray       :"#708090",
  snow            :"#fffafa",
  springgreen     :"#00ff7f",
  steelblue       :"#4682b4",
  tan             :"#d2b48c",
  teal            :"#008080",
  thistle         :"#d8bfd8",
  tomato          :"#ff6347",
  turquoise       :"#40e0d0",
  violet          :"#ee82ee",
  wheat           :"#f5deb3",
  white           :"#ffffff",
  whitesmoke      :"#f5f5f5",
  yellow          :"#ffff00",
  yellowgreen     :"#9acd32"
};
/**
 * Represents a single part of a CSS property value, meaning that it represents
 * just one part of the data between ":" and ";".
 * @param {String} text The text representation of the unit.
 * @param {int} line The line of text on which the unit resides.
 * @param {int} col The column of text on which the unit resides.
 * @namespace parserlib.css
 * @class PropertyValuePart
 * @extends parserlib.util.SyntaxUnit
 * @constructor
 */
function PropertyValuePart(text){

  /**
   * Indicates the type of value unit.
   * @type String
   * @property type
   */
  this.type = "unknown";

  //figure out what type of data it is

  var temp;

  //it is a measurement?
  if (/^([+\-]?[\d\.]+)([a-z]+)$/i.test(text)){  //dimension
    this.type = "dimension";
    this.value = +RegExp.$1;
    this.units = RegExp.$2;

    //try to narrow down
    switch(this.units.toLowerCase()){

      case "em":
      case "rem":
      case "ex":
      case "px":
      case "cm":
      case "mm":
      case "in":
      case "pt":
      case "pc":
      case "ch":
        this.type = "length";
        break;

      case "deg":
      case "rad":
      case "grad":
        this.type = "angle";
        break;

      case "ms":
      case "s":
        this.type = "time";
        break;

      case "hz":
      case "khz":
        this.type = "frequency";
        break;

      case "dpi":
      case "dpcm":
        this.type = "resolution";
        break;

      default:
      this.type = 'unknown';
      break;

    }

  } else if (/^([+\-]?[\d\.]+)%$/i.test(text)){  //percentage
    this.type = "percentage";
    this.value = +RegExp.$1;
  } else if (/^([+\-]?[\d\.]+)%$/i.test(text)){  //percentage
    this.type = "percentage";
    this.value = +RegExp.$1;
  } else if (/^([+\-]?\d+)$/i.test(text)){  //integer
    this.type = "integer";
    this.value = +RegExp.$1;
  } else if (/^([+\-]?[\d\.]+)$/i.test(text)){  //number
    this.type = "number";
    this.value = +RegExp.$1;

  } else if (/^#([a-f0-9]{3,6})/i.test(text)){  //hexcolor
    this.type = "color";
    temp = RegExp.$1;
    if (temp.length == 3){
      this.red    = parseInt(temp.charAt(0)+temp.charAt(0),16);
      this.green  = parseInt(temp.charAt(1)+temp.charAt(1),16);
      this.blue   = parseInt(temp.charAt(2)+temp.charAt(2),16);            
    } else {
      this.red    = parseInt(temp.substring(0,2),16);
      this.green  = parseInt(temp.substring(2,4),16);
      this.blue   = parseInt(temp.substring(4,6),16);            
    }
    this.value  = text;
  } else if (/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i.test(text)){ //rgb() color with absolute numbers
    this.type   = "color";
    this.red    = +RegExp.$1;
    this.green  = +RegExp.$2;
    this.blue   = +RegExp.$3;
  } else if (/^rgb\(\s*(\d+)%\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/i.test(text)){ //rgb() color with percentages
    this.type   = "color";
    this.red    = +RegExp.$1 * 255 / 100;
    this.green  = +RegExp.$2 * 255 / 100;
    this.blue   = +RegExp.$3 * 255 / 100;
  } else if (/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d\.]+)\s*\)/i.test(text)){ //rgba() color with absolute numbers
    this.type   = "color";
    this.red    = +RegExp.$1;
    this.green  = +RegExp.$2;
    this.blue   = +RegExp.$3;
    this.alpha  = +RegExp.$4;
    this.value  = text;
  } else if (/^rgba\(\s*(\d+)%\s*,\s*(\d+)%\s*,\s*(\d+)%\s*,\s*([\d\.]+)\s*\)/i.test(text)){ //rgba() color with percentages
    this.type   = "color";
    this.red    = +RegExp.$1 * 255 / 100;
    this.green  = +RegExp.$2 * 255 / 100;
    this.blue   = +RegExp.$3 * 255 / 100;
    this.alpha  = +RegExp.$4;        
    this.value  = text;
  } else if (/^hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/i.test(text)){ //hsl()
    this.type       = "color";
    this.hue        = +RegExp.$1;
    this.saturation = +RegExp.$2 / 100;
    this.lightness  = +RegExp.$3 / 100;
    this.value      = text;
  } else if (/^hsla\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*,\s*([\d\.]+)\s*\)/i.test(text)){ //hsla() color with percentages
    this.type   = "color";
    this.hue    = +RegExp.$1;
    this.saturation = +RegExp.$2 / 100;
    this.lightness  = +RegExp.$3 / 100;        
    this.alpha  = +RegExp.$4;        
    this.value  = text;
  } else if (/^url\(["']?([^\)"']+)["']?\)/i.test(text)){ //URI
    this.type   = "uri";
    this.uri    = RegExp.$1;
  } else if (/^([^\(]+)\(/i.test(text)){
    this.type   = "function";
    this.name   = RegExp.$1;
    this.value  = text;
  } else if (/^["'][^"']*["']/.test(text)){    //string
    this.type   = "string";
    this.value  = eval(text);
  } else if (Colors[text.toLowerCase()]){  //named color
    this.type   = "color";
    temp        = Colors[text.toLowerCase()].substring(1);
    this.red    = parseInt(temp.substring(0,2),16);
    this.green  = parseInt(temp.substring(2,4),16);
    this.blue   = parseInt(temp.substring(4,6),16);         
    this.value  = text;
  } else if (/^[\,\/]$/.test(text)){
    this.type   = "operator";
    this.value  = text;
  } else if (/^[a-z\-\u0080-\uFFFF][a-z0-9\-\u0080-\uFFFF]*$/i.test(text)){
    this.type   = "identifier";
    this.value  = text;
  }

}
module.exports = PropertyValuePart;

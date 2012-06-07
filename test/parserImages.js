var SpriteDef = require('../src/spriteDef');
var path = require('path');
var cssPath = path.resolve(__dirname, '../demo/css/');
new SpriteDef({
  file: cssPath + '/test.css'
});

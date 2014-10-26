/**!
 * graph工厂
 *
 * Copyright(c) Eward.song Limited.
 * MIT Licensed
 *
 * Authors:
 *   Eward <eward.song@gmail.com> (http://shepherdwind.com)
 */

'use strict';

//var php = require('./php/index');
var java = require('./java/index');
module.exports = function(){
  return java;
};

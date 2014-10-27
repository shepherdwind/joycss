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

var shell = require("shelljs");
var logger = require('../common/logger');

var php = function() {
  return require('./php/index');
};

var java = function() {
  return require('./java/index');
};

module.exports = function(){
  var api = global.joycssApi;
  if (api === 'java') {
    logger.debug('use java command');
    return java();
  }

  if (api === 'php') {
    logger.debug('use php command');
    return php();
  }

  return autoSelect();
};

function autoSelect(){
  if (shell.which('php')) {
    logger.debug('use php command');
    return php();
  }

  if (shell.which('java')) {
    logger.debug('use java command');
    return java();
  }

  // 错误情况
  require('./check/java');
}

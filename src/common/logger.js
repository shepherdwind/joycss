/**!
 * Logger
 *
 * Copyright(c) Eward.song Limited.
 * MIT Licensed
 *
 * Authors:
 *   Eward <eward.song@gmail.com> (http://shepherdwind.com)
 */
var debug = require('debug')('joycss:Debug');
var error = require('debug')('joycss:Error!!');
var success = require('debug')('joycss:Success');

var Logger = {
  'debug': debug,
  'error': error,
  'success': success
};

module.exports = Logger;

/**!
 * Logger
 *
 * Copyright(c) Eward.song Limited.
 * MIT Licensed
 *
 * Authors:
 *   Eward <eward.song@gmail.com> (http://shepherdwind.com)
 */

// 错误信息始终抛出
if (!process.env['DEBUG']) {
  process.env['DEBUG'] = 'joycss:Error!!';
} else {
  process.env['DEBUG'] += ',joycss:Error!!';
}

var debug = require('debug')('joycss:Debug');
var error = require('debug')('joycss:Error!!');
var success = require('debug')('joycss:Success');

var Logger = {
  'debug': debug,
  'error': error,
  'success': success
};

module.exports = Logger;

var shell = require("shelljs");
var path = require('path');
var util = require('util');
var logger = require('../../common/logger');

var help = 'https://github.com/shepherdwind/joycss/wiki/how-to-install';

logger.debug('php 环境检测');

if (!shell.which('php')) {
  logger.error('需要php环境支持, 请首先安装php，需要更多帮助情况\n   %s', help);
}

logger.debug('php gd包检测');

var stat = shell.exec(util.format('php %s', path.join(__dirname, 'env.php')), {silent: true});
var ret = JSON.parse(stat.output);

if (ret.gd) {
  logger.debug('php环境正常, gd版本%s', ret.gd);
} else {
  logger.error('php 需要gd支持，需要更多帮助请看:  %s', help);
}

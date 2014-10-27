var shell = require("shelljs");
var logger = require('../../common/logger');

var help = 'https://github.com/shepherdwind/joycss/wiki/how-to-install';

logger.debug('java环境检测');

if (!shell.which('java')) {
  logger.error('需要java环境支持, 请首先安装java虚拟机，需要更多帮助情况\n   %s', help);
  return;
}

logger.debug('java检测正常');

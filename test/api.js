var Api= require('../src/api');
var datas = [
  {
    "fileName":"{{appPath}}inits/index.css",
    "enable":true,
    "param":"-ca"
  },
  {
    "fileName":"{{appPath}}inits/list.css",
    "enable":false,
    "param":"-n"
  }];

Api(datas);

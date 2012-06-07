var Api= require('../src/graph/api');
var path = require('path');

var getImagesSize = Api.getImagesSize;
var mergeImages = Api.mergeImages;

var baseDir = path.resolve(__dirname, '../demo/img/');
var files = ['bangpai', 'carton', 'dapei'].map(function(file){
  return baseDir + '/' + file + '.png';
});

//getImagesSize(files, function(err, data){
  //console.log(JSON.parse(data));
  //console.log(err);
//});

var cssDir = path.resolve(baseDir, '../css/');
mergeImages([cssDir, cssDir + '/tpl.json'], function(err, data){
  console.log(data);
});

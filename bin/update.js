var http         = require('https');
var fs           = require('fs');
var EventEmitter = require('events').EventEmitter;
var util         = require('util');

var AdmZip = require('../lib/adm-zip/');

var lisener      = new EventEmitter();
var config = {
  filename: 'joycss.zip',
  host: 'nodeload.github.com',
  path: '/shepherdwind/joycss/zipball/master'
};

function download(filename, host, path){
  var begin = Date.now();
  http.get({
    host: host,
    method: 'GET',
    port: 443,
    path: path
  }, function(ret){
    var str = '..';
    var loading = '';
    console.log('download data begin!');

    ret.on('data', function(data){
      fs.appendFile(filename, data);
      loading += str;
      console.log(loading);
    });
    ret.on('end', function(){
      console.log('download file ' + filename + ' success! ' + 
        (Date.now() - begin) + 'ms in all.');
      setTimeout(function(){
        lisener.emit('download:success', filename);
      }, 10);
    });
  }).on('error', function(e){
    console.log(e);
  });
}

function unzip(filename){
  var zip = new AdmZip(filename);
  var zipEntries = zip.getEntries();
  var dirname = zipEntries[0].entryName;
  zip.extractEntryTo(dirname, '../', true);
  console.log('update success!');
}

function update(){
  console.log('update begin, fetch data from sever.');
  download(config.filename, config.host, config.path);
  lisener.on('download:success', unzip);
  //lisener.emit('download:success', config.filename);
}

module.exports = update;

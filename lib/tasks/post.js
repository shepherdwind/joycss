"use strict";
var http     = require('http');
var fs       = require('fs');
var path     = require('path');
var stdclass = require('../common/stdclass');
var utils    = require('../common/utils');
var forEach  = utils.forEach;

var mime = {
  ".js"   : "application/x-javascript",
  ".css"  : "text/css",
  ".txt"  : "text/plain",
  ".png"  : "image/png",
  ".gif"  : "image/gif",
  ".jpg"  : "image/jpeg",
  ".swf"  : "application/x-shockwave-flash",
  ".html" : "text/html",
  ".ico"  : "image/x-icon",
  ".php"  : "text/html",
  ".htm"  : "text/html"
};

function Post(){
  this.init.apply(this, arguments);
}

stdclass.extend(Post, stdclass, {

  attributes: {
    file     : '',
    host     : '',
    path     : '',
    filekey  : '',
    headers  : {},
    data     : {},
    len      : 0,
    method   : 'POST',
    port     : 80,
    boundary : '',
    encoding : 'utf8'
  },

  CONSIT: {},

  _init: function(){

    if (!this.get('host') || ! this.get('file')){
      throw new Error('no file or host defined!');
    }
    this.postData = [];

    this.setBoundary();
    this.setPostData();

  },

  doUpload: function(){
    var options = {
      host     : this.get('host'),
      port     : this.get('port'),
      path     : this.get('path'),
      method   : this.get('method'),
      headers  : this.get('headers')
    };
    //console.log(options);

    var _this = this;

    var request = http.request(options, function(response) {

      debugger;

      response.body = '';

      response.setEncoding(_this.get('encoding'));

      response.on('data', function(chunk){
        response.body += chunk;
      });

      response.on('end', function() {
        _this.fire('uploadEnd', {success: response.body});
      });

    });

    request.on('error', function(err){
      _this.fire('uploadEnd', {err: err});
    });

    forEach(this.postData, function(data){
      //console.log(data.toString());
      request.write(data);
    });
    //console.log(requet);

    request.end();

  },

  setBoundary: function(){
    var boundary = this.get('boundary');
    boundary = Math.random();
    this.set('boundary', boundary);
  },

  setHeaders: function(){
    var headers = this.get('headers');
    var boundary = this.get('boundary');
    headers = utils.mixin(headers, {
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': this.get('len')
    });
    this.set('headers', headers);
  },

  setPostData: function(){
    var file = this.get('file');
    var _this = this;
    fs.readFile(file, function(err, data){
      if (err) throw new Error(err);

      _this.getFileData(data);

      _this.setHeaders();

      _this.doUpload();
    });
  },

  getFileData: function(imgBuf){

    var data = this.get('data');
    var boundary = this.get('boundary');
    var postData = this.postData;

    utils.forEach(data, this.encodePostData, this);
    if (postData.length){
      this.postData.push(new Buffer("\r\n--" + boundary + "--"));
    }

    this.encodePostImg();
    this.postData.push(imgBuf);
    this.postData.push(new Buffer("\r\n--" + boundary + "--"));

    forEach(this.postData, function(buf){
      var len = this.get('len');
      len += buf.length;
      this.set('len', len);
    }, this);

  },

  encodePostImg: function(){
    var file = this.get('file');
    var type = mime[path.extname(file)];
    var ret = "--" + this.get('boundary')+ "\r\n";
    ret += "Content-Disposition: form-data;name=\"" + this.get('filekey') + 
           "\";filename=\"" + path.basename(file) + "\"\r\n";
    ret += "Content-Type: " + type + "\r\n\r\n";
    this.postData.push(new Buffer(ret));
  },

  encodePostData: function(val, key){
    var boundary = this.get('boundary');
    var ret = "--" + boundary + "\r\n";
    ret += "Content-Disposition: form-data;name=\"" + key + "\"\r\n\r\n";
    ret += val + "\r\n";
    this.postData.push(new Buffer(ret));
  }

});

module.exports = Post;

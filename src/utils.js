"use strict";
var utils = {
  noop: function noop(){}
};

['forEach', 'some', 'every'].forEach(function(fnName){
  utils[fnName] = function(arr, fn){
    if (arr[fnName]){
      return arr[fnName](fn);
    } else {
      var keys = Object.keys(arr);
      return keys[fnName](function(key, i){
        return fn(arr[key], key, arr);
      });
    }
  };
});

utils.walks = function walks(arr, fn, callback){
  var rets = [];
  var num = 0;
  var len = arr.length;

  this.forEach(arr, function(val, i){

    fn(val, cb);
    function cb(err, ret){
      if (num === len) return;
      if (err){
        callback(err, rets);
        num = len;
      } else {
        num++;
        rets[i] = ret;
        if (num === len) callback(null, rets);
      }
    }

  });
};

module.exports = utils;

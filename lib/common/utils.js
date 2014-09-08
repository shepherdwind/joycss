"use strict";
var utils = {};

['forEach', 'some', 'every'].forEach(function(fnName){
  utils[fnName] = function(arr, fn, context){
    context = context || this;
    if (arr === undefined) return;
    if (arr[fnName]){
      return arr[fnName](fn, context);
    } else {
      //var keys = Object.keys(arr);
      var keys = [];
      for (var x in arr)
        arr.hasOwnProperty(x) && keys.push(x);
      return keys[fnName](function(key, i){
        return fn.call(context, arr[key], key, arr);
      }, context);
    }
  };
});

utils.mixin = function (from, to){
  utils.forEach(from, function(val, key){
    var toString = {}.toString.call(val);
    if (toString == '[object Array]' || toString == '[object Object]') {
      to[key] = utils.mixin(val, to[key] || {});
    } else {
      to[key] = val;
    }
  });
  return to;
};

module.exports = utils;

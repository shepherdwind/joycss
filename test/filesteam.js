var fs = require('fs');
var path = require('path');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var file = '../demo/css/test.css';
//var file = '../demo/css/index.css';//巨大压力
//var file = '../demo/css/bootstrap.css';
//var file = '../demo/css/t.css';
var CssReader = require('../src/cssReader');
//var file = '../demo/css/index.css';

var p = new CssReader({
    file: file
});
p.on(p.get('RULE_END_EVT'), function(e){
    //console.log(e);
    //console.log(e.property);
});
p.on('change:timeEnd', function(e){
    //console.log(p.get('values'));
    //console.log(p.get('selectors'));
});

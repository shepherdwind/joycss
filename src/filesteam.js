var fs = require('fs');
var path = require('path');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
//var file = '../demo/css/test.css';
var file = '../demo/css/t.css';
//var file = '../demo/css/index.css';

var readstream = fs.createReadStream(file);

var i = 0;
readstream.on('data', function(data){
    i++;
    if (i < 2){
        //console.log(data.toString());
        for (var j = 0; j < 30 && j < data.length; j++){
            console.log(data[j]);
        }
    }
});

readstream.on('error', function(err){
    console.log(err);
});

readstream.on('end', function(){
    console.log("\nend");
});

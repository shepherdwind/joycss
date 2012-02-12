var fs        = require('fs');
var path      = require('path');
var cssfile   = '../css/test.css';
var CssParser = require('./cssParesr');
var log = console && console.log ;

var cssParser = new CssParser();
fs.readFile(cssfile, 'utf-8', function (err, data) {
    if (err) throw err;

    //var cssFileSprite = cssfile.replace(/(\.css)$/, ".sprite$1");
    //fs.writeFile(cssFileSprite, result, function(){
    //    var util  = require('util');
    //    var spawn = require('child_process').spawn;
    //});

    cssParser.on('change:cssText', function(e){
        log(e.now);
    });
    cssParser.parse(data);
});

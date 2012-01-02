var fs        = require('fs');
var path      = require('path');
var cssfile   = '../css/default.css';
var CssParser = require('./cssParesr');

var parserlib = require('../lib/node-parserlib');
var _ = require('../lib/underscore');

var parser = new parserlib.css.Parser({ 
  starHack:       true,
  underscoreHack: true,
  ieFilters:      true 
});
//var cssParser = new CssParser();
var cssParser = new CssParser();

fs.readFile(cssfile, 'utf-8', function (err, data) {
    if (err) throw err;

    var property = {};

    parser.addListener("startrule", function(event){

        property = {};
        var selectors = [];

        _.each(event.selectors, function(selector){
            selectors.push(selector.text);
        });

        cssParser.addRule(selectors);

    });

    parser.addListener("property", function(event){
        //对于ie hack会引起样式覆盖
        property[event.property.text] = event.value.text;
    });

    parser.addListener("endrule", function(event){
        cssParser.addRule(property);
    });

    parser.addListener("endstylesheet", function(event){
        console.log(cssParser.get('rules'));
    });

    parser.parse(data);
});

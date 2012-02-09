var fs        = require('fs');
var path      = require('path');
var cssfile   = '../css/flower.css';
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

function sprintf(text,obj) {
    return text.replace(/\{(\w+)\}/g, function (i,key) { 
        if( obj[key] instanceof Function ) 
            return obj[key]();
        else
            return obj[key] || ''; 
    });
}

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
        var propertyName = event.property.text;
        var propertyVal  = property[propertyName];
        var value        = event.value.text;

        //如果不是背景，或者不包含背景图
        if (propertyName != 'background' || value.indexOf('url') === -1){
            //对于ie hack会引起样式覆盖
            if (!propertyVal) {
                property[propertyName] = value;
            } else {
                property[propertyName] += ';' + value;
            }
        } else {
            var parts = event.value.parts;
            var i = 0;

            property['background'] = {};
            propertyVal = property['background'];
            propertyVal['position'] = [];

            for(i; i<parts.length; i++) {

                var part = parts[i];
                switch(part['type']) {

                    case 'uri': {
                        propertyVal['image'] = part.uri;
                        break;
                    }

                    case 'color': {
                        propertyVal['color'] = part.text;
                        break;
                    }
                    
                    default : {
                        var text = part.text;

                        if (text.indexOf('repeat') !== -1) {
                            propertyVal['repeat'] = text;
                        } else {
                            propertyVal['position'].push({
                                type : part.type,
                                value : part.value,
                                text  : part.text
                            });
                        }

                        break;
                    }

                }
            }
        }
        
    });

    parser.addListener("endrule", function(event){
        cssParser.addRule(property);
        property = {};
    });

    parser.addListener("endstylesheet", function(event){
        var rules = cssParser.get('rules');
        var cssFileSprite = cssfile.replace(/(\.css)$/, ".sprite$1");
        var data          = {
            spriteImg : 'mysprite',
            imgBase   : '../img/',
            layout    : 'vertical',
            color     : '#ffffff'
        };
        var tpl           = '/** sprite: {spriteImg}; sprite-image: url({imgBase}' +
                            '{spriteImg}); sprite-layout: {layout};sprite-matte-color: {color}; */';
        var result        = sprintf(tpl, data) + "\n";

        _.each(rules, function(rule){

            var selectors = rule.selectors;
            var propertys = rule.property;

            _.each(selectors, function(seletor, i){
                result += selectors[i + 1] ? (seletor + ',\n') : (seletor + ' {\n');
            });

            _.each(propertys, function(val, key){

                if (key !== 'background' || typeof val === 'string'){
                    result += '  ' + key + ': ' + val + ';\n';
                } else {

                    if (val.color) {
                        result += '  background-color: ' + val.color + ';\n';
                    } else if (val.repeat) {
                        result += '  background-repeat: ' + val.repeat + ';\n';
                    }

                    //注视
                    var comment = '/** sprite-ref: ' + data.spriteImg ;

                    //定位
                    var position = val.position;
                    if (position.length) {

                        var horizontal = position[0];
                        var vertical   = position[1];

                        if (horizontal.text == 'right' || horizontal.text == "100%") {
                            comment += ';sprite-alignment: right';
                        } else {

                            if (vertical.type == 'length') {
                                //上下使用同样的高度
                                comment += ';sprite-margin-top: ' + vertical.text + 
                                           ';sprite-margin-bottom: ' + vertical.text;
                            }

                            if (horizontal.type == 'length') {
                                comment += ';sprite-margin-left: ' + horizontal.text;
                            }

                            if (val.repeat === 'repeat-x'){
                                comment += ';sprite-alignment: repeat ' ;
                            }
                        }

                    }

                    result += '  background-image: url(' + val.image + ');' + comment + ';*/\n'; 
                }
            });

            result += '}\n';

        });

        fs.writeFile(cssFileSprite, result, function(){
            var util  = require('util');
            var spawn = require('child_process').spawn;
        });
    });

    parser.parse(data);
});

var Events  = require('events').EventEmitter;
var util    = require('util');
var LIBPATH = '../lib/';
var _       = require(LIBPATH + 'underscore.js');
var StdClass = require('./stdclass');
var parserlib = require('../lib/node-parserlib');

//curl commend
var CURLCMD = 'curl -F userfile=@\'{fileName};type=image/{fileType}\' {url}';
//curl commend add tarcefile
var CURLCMDDEBUG = 'curl -F userfile=@\'{fileName};type=image/{fileType}\' --trace-ascii {tarcefie} {url}';
//match too much empty space
var EMPTYREG = /\s+/g;
//match url end with 'png?10'
var POSREG   = /\?(\d+)$/g;
//图片url以问好结尾，不合并
var NOT_SPRITE = /\.(png|jpg|gif)\?\)\s+/g;

/**
 * simple template function, replace {key} in a tpl
 * @param {String} text tpl text
 * @param {Object} obj  data object
 * @example 
 * var mytpl = 'hello {name}';
 * sprintf(mytpl, {name: 'Eward');//return 'hello Eward'
 */
function sprintf(text,obj) {

    return text.replace(/\{(\w+)\}/g, function (i,key) { 
        if( obj[key] instanceof Function ) 
            return obj[key]();
        else
            return obj[key] || ''; 
    });

}


/**
 * css parser
 * @class CssParser
 * @extends StdClass
 * @constructor
 * @bugs
 * \@media can't recognize buy parserlib
 * parserlib may not recognize the ie hack of suffix such as '\9'
 */
function CssParser(){
    StdClass.apply(this, arguments);
}

StdClass.extend(CssParser, StdClass, {

    attributes : {

        debug      : false,
        imgs       : {},
        //items like this: {selectors : [], property : {}}
        rules      : [],
        cssText    : ''

    },

    _init      : function(){
        /**
         * 记录当前规则下的selector
         * @type array 
         * @property _selector
         * @private
         */
        this._selector = [];
        this._parser   = new parserlib.css.Parser({
            starHack:       true,
            underscoreHack: true,
            ieFilters:      true 
        });

        this._bind();
    },

    uploadFile : function(){
    },

    /**
     * 添加css规则，贮存在rules属性中
     * @param {Array|Object} rule selectors or css property,if the rule's type
     * is is is array, set this._selector = rule, else the rule
     */
    addRule    : function(rule){

        var selector = this._selector;
        var ruleType = 'property';
        var rules    = this.get('rules');

        if(util.isArray(rule)){
            //更新selector
            this._selector = selector = rule;
            ruleType = 'selector';
        }

        if(!selector){
            throw new Error('selector is empty');
        }

        if(ruleType === 'selector'){

            rules.push({ selectors: _.clone(rule), property: {} });

        } else {

            var len = rules.length;
            var last = rules[len - 1];

            for (var key in rule){

                if (key in last.property) {

                    if (typeof last.property[key] == 'string') {
                        last.property[key] = [last.property[key], rule[key]];
                    } else if(util.isArray(last.property[key])) {
                        last.property[key].push(rule[key]);
                    }

                } else {

                    last.property[key] = rule[key];

                }
            }
        }
    },

    //parser css string
    parse: function(str) {
        this._parser.parse(str);
    },

    _bind: function(){
        this._parser.addListener('property', this._addProperty.bind(this));
        this._parser.addListener('startrule', this._addSeletor.bind(this));
        this._parser.addListener('endrule', this._addRule.bind(this));
        this._parser.addListener('endstylesheet', this._end.bind(this));
    },

    _addProperty: function(event){

        var property     = {};
        var propertyName = event.property.text;
        var propertyVal  = property[propertyName];
        var value        = event.value.text;
        var isSprite     = propertyName === 'background' &&//propertyName equal background
                           value.indexOf('url') !== -1  &&//has url in value
                           value.indexOf('http') === -1 &&//url is relative path
                           !NOT_SPRITE.test(value);//default images are merged, but if image url end with '?'

        //如果不是背景，或者不包含背景图
        if (!isSprite) {
            property[propertyName] = value;
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
                        } else if(text === 'transparent') {
                            //parser-lib无法识别transparent
                            propertyVal['color'] = 'transparent';
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

        this.addRule(property);

    },

    _addSeletor: function(event){

        var selectors = [];

        _.each(event.selectors, function(selector){
            //trim empty string
            selectors.push(selector.text.replace(EMPTYREG, ' '));
        });

        this.addRule(selectors);

    },

    _addRule: function(){
    },

    _end: function(){

        var rules = this.get('rules');
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

                    if (!util.isArray(val)){
                        result += '  ' + key + ': ' + val + ';\n';
                    } else {
                        _.each(val, function(valsub){
                            result += '  ' + key + ': ' + valsub + ';\n';
                        });
                    }
                } else {

                    if (val.color) {
                        result += '  background-color: ' + val.color + ';\n';
                    } else if (val.repeat) {
                        result += '  background-repeat: ' + val.repeat + ';\n';
                    }

                    //注视
                    var comment = '/** sprite-ref: ' + data.spriteImg ;
                    var img     = val.image;

                    //定位
                    var position = val.position;
                    if (position.length) {

                        var horizontal = position[0];
                        var vertical   = position[1];

                        result += '  background-position: ' + horizontal.text + ', ' +
                                  vertical.text + ';\n';

                        if (horizontal.text == 'right' || horizontal.text == "100%") {
                            comment += ';sprite-alignment: right';
                        } else {

                            if (horizontal.type == 'length') {
                                comment += ';sprite-margin-left: ' + horizontal.text;
                            }

                            if (val.repeat === 'repeat-x'){
                                comment += ';sprite-alignment: repeat ' ;
                            }
                        }

                        if (vertical.type == 'length') {
                            //上下使用同样的高度
                            comment += ';sprite-margin-top: ' + vertical.text ;
                        }

                        var marginBottom = POSREG.exec(img);

                        //处理margin-bottom
                        if (marginBottom) {
                            comment += ';sprite-margin-bottom: ' + marginBottom[1] + 'px';
                            img = img.replace(POSREG, '');
                        }


                    }

                    result += '  background-image: url(' + img + ');' + comment + ';*/\n'; 
                }
            });

            result += '}\n';

        });

        var cssText = result;
        this.set('cssText', cssText);
    }

});

module.exports = CssParser;

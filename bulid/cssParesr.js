var Events  = require('events').EventEmitter;
var util    = require('util');
var LIBPATH = '../lib/';
var _       = require(LIBPATH + 'underscore.js');

//curl commend
var CURLCMD = 'curl -F userfile=@\'{fileName};type=image/{fileType}\' {url}';
//curl commend add tarcefile
var CURLCMDDEBUG = 'curl -F userfile=@\'{fileName};type=image/{fileType}\' --trace-ascii {tarcefie} {url}';
/**
 * 原型继承方法,调用util.inherits
 * @param {Function} constructor 构造器
 * @param {Function} superConstructor 父构造器
 * @param {Object} methods 自定义方法或属性
 */
function extend(constructor, superConstructor, methods){
    util.inherits(constructor, superConstructor);

    for (var i in methods){
        constructor.prototype[i] = methods[i];
    }
}

/**
 * StdClass include method get,set and init
 * @class StdClass
 * @extends EventEmitter
 * @constructor
 */
var StdClass = function(){
    Events.call(this);
    this.initialize.apply(this, arguments);
};

extend(StdClass, Events, {

    /**
     * 属性集合，在每个子对象中，相对独立
     */
    attributes: {},

    /**
     * 共有属性集合
     */
    CONSIT: {
        NOOP : function () {}
    },

    /**
     * @param force {Bool}
     */
    set: function(key, value, force){

        var old = this.attributes[key];
        this.attributes[key] = value;

        //只对是字符串的变量修改触发change事件 同时增加强制触发事件参数
        //一般字符串用于状态描述 2011年11月24日
        var isFire = false;

        if (util.isString(value) || util.isNumber(value)){
            if (value != old){
                isFire = true;
            }
        } else {
            if (force){
                isFire = 1;
            }
        }

        if (isFire && force !== false) {
            this.emit('change:'+key, { old: old, now: value, target: this});
            isFire === true && this.emit('change:'+key+':'+value, { old: old,
                now: value, target: this} );
        }

        return this;
    },

    get: function(key, isconsit){ 
        return isconsit ? this.CONSIT[key] :this.attributes[key] ; 
    },

    initialize: function (cfg) {
        //建立相对独立的attributes属性表
        this.attributes = _.clone(this.attributes);
        _.extend(this.attributes, cfg);

        this._init && this._init();
    }
});

/**
 * css parser
 * @class CssParser
 * @extends StdClass
 * @constructor
 */
var CssParser = function(){
    StdClass.call(this);
};

extend(CssParser, StdClass, {

    attributes : {

        debug      : false,
        imgs       : {},
        //items like this: {selectors : [], property : {}}
        rules      : []

    },

    _init      : function(){
        /**
         * 记录当前规则下的selector
         * @type array 
         * @property _selector
         * @private
         */
        this._selector = [];
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
            //copy rule to property
            _.extend(last.property, rule);
        }
    }

});

module.exports = CssParser;

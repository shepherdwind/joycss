/**
 * StdClass include method get,set and init
 * abstruct class
 * @class StdClass
 * @author hanwen
 * [+] 2011-12-1
 * 修改set方法，增加change:xxx:xxx时间，对应与某个属性值的变化
 * [+] set方法增加force强制不触发事件的配置
 */
var Events  = require('events').EventEmitter;
var util    = require('util');

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

function StdClass(){
    this.init.apply(this, arguments);
}
StdClass.extend = extend;
//如果使用extend方法，会有问题
extend(StdClass, Events, {

    //属性集合，在每个子对象中，相对独立
    attributes : {},

    //共有属性集合
    CONSIT : {
    },

    //node集合
    nodes : {
    },

    /**
     * 对于attributes下的都进行触发事件，其他对象的修改，不触发事件，除非
     * 强制设置force为true
     * @param force {Bool}
     */
    set: function(key, value, force) {

        var type   = this.getType(key);
        var old    = this[type][key];
        var isFire = false;

        //设置value
        if (type === 'nodes'){
            this._setNode(key, value);
        } else{
            this[type][key] = value;
        }

        //判断时候触发事件
        if (type === 'attributes'){
            if (value != old || force === true) isFire = true;
        } else {
            if (force) isFire = 1;
        }

        //触发事件
        if (isFire && force !== false){

            this.emit('change:' + key, { old: old, now: value, target: this });
            isFire === true && this.emit('change:' + key + ':'+value, 
                {old: old, now: value, target: this});

        }

        return this;
    },

    //判断属性对象的类型
    //node | attr | consit
    //依次从attributes>nodes>CONSIT中查找
    getType: function(key){

        var o = {
            attributes : this.attributes, 
            CONSIT     : this.CONSIT,
            nodes      : this.nodes
        };
        var ret = false;

        for (var i in o){

            if (key in o[i]){
                ret = i;
                break;
            }

        }

        return ret;

    },

    /**
     * 获取属性，如果属性位于nodes中，在第一次获取对象时，如果不是Node
     * 则使用S.all获取之，并且返回获得的node
     * @param {String} key
     */
    get: function(key){ 
        var type = this.getType(key);
        var ret  = this[type][key];

        //对于node集合，如果是string，则设置node
        if (type === 'nodes' && util.isString(ret)) {
            ret = this._setNode(key);
        } 

        return ret;
    },

    _setNode: function(key, value){

        var node;
        var Node = S && S.Node;

        //如果不存在node对象
        if (!Node) return false;

        //如果已经是node
        if (value instanceof S.Node){

            node = value;

        } else {

            var seletor = this.nodes[key];

            if (key === 'base'){
                node = S.one(seletor);
            } else {
                node = S.all(seletor, this.get('base'));
            }
        }

        //如果node对象的length为空，不进行设值，保留以便手
        //动设置,对于动态创建的node对象，刚开始的时候是没有
        //dom对象的
        if (node.length > 0){
            this.nodes[key] = node;
        } 

        return node;

    },

    init: function(cfg){

        //建立相对独立的attributes属性表
        var attributes = {};
        for (var i in this.attributes){
            attributes[i] = this.attributes[i];
        }
        this.attributes = attributes;

        //初始化自定义配置
        for (var j in cfg) {
            this.attributes[j] = cfg[j];
        }

        this._init && this._init();
    },

    //事件执行一次
    once: function(event, fn, context){

        context = context || this;

        function __fn(e){
            fn.call(context, e);
            this.removeListener(event, __fn);
        }

        this.on(event, __fn, context);
    }

});

module.exports = StdClass;

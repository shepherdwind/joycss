/**
 * StdClass include method get,set and init
 * abstruct class
 * @class StdClass
 * @author hanwen
 * @TODO
 * 1. 事件组合
 * 2. 多属性管理
 * 3. debug控制
 * [+] 2011-12-1
 * 修改set方法，增加change:xxx:xxx时间，对应与某个属性值的变化
 * [+] set方法增加force强制不触发事件的配置
 */
var Events  = require('events').EventEmitter;
var util    = require('util');
var TRIM_REG = /(^\s+)|(\s+$)/g;

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
extend(StdClass, Events, {

  //属性集合，在每个子对象中，相对独立
  attributes: {},

  //共有属性集合
  CONSIT: {},

  //node集合
  nodes: {},

  /**
   * 对于attributes下的都进行触发事件，其他对象的修改，不触发事件，除非
   * 强制设置force为true
   * @param opt_force {bool}
   * @param opt_data  {object} data to event
   */
  set: function set(key, value, opt_force, opt_data) {

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
      if (value != old || opt_force === true) isFire = true;
    } else {
      if (opt_force) isFire = 1;
    }

    //触发事件
    if (isFire && opt_force !== false){

      opt_data = opt_data || {};
      opt_data.old = old;
      opt_data.now = value;
      opt_data.target = this;

      this.emit('change:' + key, opt_data);
      isFire === true && this.emit('change:' + key + ':'+value, opt_data);

    }

    return this;
  },

  //判断属性对象的类型
  //node | attr | consit
  //依次从attributes>nodes>CONSIT中查找
  getType: function getType(key){

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
  get: function get(key){ 
    var type = this.getType(key);
    var ret  = this[type][key];

    //对于node集合，如果是string，则设置node
    if (type === 'nodes' && util.isString(ret)) {
      ret = this._setNode(key);
    } 

    return ret;
  },

  _setNode: function setNode(key, value){

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

  init: function initialize(cfg){

    if (!this.__attrs) {
      this.__attrs = {};
      for (var _i in this.attributes){
        this.__attrs[_i] = this.attributes[_i];
      }
      this.attributes = {};
    }
    //建立相对独立的attributes属性表
    for (var i in this.__attrs){
      var val = this.__attrs[i];
      //对于数组，使用slice 克隆一份
      this.attributes[i] = val.slice ? val.slice(): val;
    }

    //初始化自定义配置
    for (var j in cfg) {
      this.attributes[j] = cfg[j];
    }

    this._init && this._init();
  },

  /**
   * the same to function on, bind event on self, the only
   * change is add the ability of bind mult event 
   * @example this.on('a, b, c', fn);
   * @note the dismember is ', ', do not lost the blank space
   * @param ev {string} event string, dismember by ', ',semicolon add an
   * blank space
   * @param fn {function} function executed when the event is emit
   * @return fn {function} the callback function would be change, so you should
   * get the handle of the callback function by the return value
   */
  on: function on(ev, fn, context){
    var arg = arguments;
    var slice = [].slice;
    var evs = ev.split(',');
    var i = 0;
    var evt = '';
    var __fn = fn;
    fn = function wrapOn(e){
      context = context || this;
      __fn.apply(context, [e].concat(slice.call(arg, 3)));
    };

    while(evs[i]){
      evt = evs[i].replace(TRIM_REG, '');
      if (evt) Events.prototype.on.call(this, evt, fn);
      i++;
    }

    return fn;
  },

  once: function once(ev, fn){
    var __fn = fn;
    var self = this;
    fn = function wrapOnce(){
      self.removeListener(ev, cb);
      __fn.apply(this, arguments);
    };

    var cb = this.on.apply(this, arguments);
  },

  fire: Events.prototype.emit

});

module.exports = StdClass;

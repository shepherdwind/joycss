var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var assert = require('assert').ok;

var StdClass = require('./stdclass');

function Composite(){
  StdClass.apply(this, arguments);
}

StdClass.extend(Composite, StdClass, {

  attributes: {
    name: ''
  },

  CONSIT: {
    bin: 'gm'
  },

  _init: function(){
    this._identify = {};
    var img = this.get('name');
    var begin = Date.now();
    this.identify(img, function(o){
      console.log(Date.now() - begin);
      console.log(o.size);
    });
  },

  /**
   * identify image info
   * @param img {string} the path of the img file
   * @param success {function} callback of success identify it, the first
   * arguments is an object, which identify the info of the img
   * @param opt_error {function} callback function when error happen, this is
   * optional, if opt_error is null, when error happen, an Error while throwed
   */
  identify: function identify(img, success, opt_error){
    var bin = this.get('bin');
    var _identify = this._identify;
    var _getter = this._getter;

    if (_identify[img]){
      success.call(this, _identify[img]);
    } else {

      this.exec({
        bin: bin,
        option: ['identify', '-verbose', img],
        success: function(data){
          data = _getter(data);
          _identify[img] = data;
          success.apply(this, arguments);
          return data;
        },
        error: opt_error,
        context: this
      });

    }
  },

  /**
   * exec a commend, use spawn
   * @param {object} obj, 
   * { bin: '', option: [], success: fn, error: fn, * context: {}, arg: [] }, 
   * default the error callback is throw an Error();
   */
  exec: function exec(obj){

    if (typeof obj.success !== 'function'){
      throw new Error('the arguments obj must has callback of success');
    }

    if (typeof obj.error !== 'function'){
      obj.error = function execError (data){
        throw new Error('Commend Error:' + 
          [obj.bin].concat(obj.option).join(' ') + "\nError message:"+
          data);
      };
    }

    try {
      var cmd = spawn(obj.bin, obj.option);
      var ret = '';
      var err = false;

      cmd.stdout.on('data', function cmdSuccess(data){
        ret += data.toString();
      });
      cmd.stderr.on('data', function cmdError(data){
        ret += data.toString();
        err = true;
      });

      cmd.on('exit', function cmdEnd(){
        var context = obj.context || this;
        var arg = obj.arg || [];
        err ?  obj.error.apply(context, [ret].concat(arg)):
        obj.success.apply(context, [ret].concat(arg));
      });

    } catch(e) {
      throw Error(e);
    }
  },

  /**
   * return the identify -verbose info of an img
   * @see https://github.com/aheckmann/gm/blob/master/lib/getters.js#L45
   */
  _getter: function getter(stdout){

    stdout = (stdout||"").trim().replace(/\r\n|\r/g, "\n");

    var parts = stdout.split("\n");

    // skip the first line (its just the filename)
    parts.shift();

    try {
      var len = parts.length ,
          rgx = /^( *)([^:]+): *(.*)$/ ,
          out = { indent: {} } ,
          level = null ,
          lastkey ,
          i = 0 ,
          res ,
          o = {};

      for (; i < len; ++i) {
        res = rgx.exec(parts[i]);
        if (!res) continue;

        var indent = res[1].length ,
            key = res[2] ? res[2].trim() : '';

        if ('Image' == key) continue;

        var val = res[3] ? res[3].trim() : null;

        // first iteration?
        if (null === level) {
          level = indent;
          //o = out.root = out.indent[level];
        } else if (indent < level) {
          // outdent
          o = out.indent[indent];
        } else if (indent > level) {
          // dropping into a nested object
          out.indent[level] = o;
          // wierd format, key/val pair with nested children. discard the val
          o = o[lastkey] = {};
        }

        level = indent;

        if (val) {
          o[key] = val;

          if (key in helper) {
            helper[key](o, val);
          }
        }

        lastkey = key;
      }

    } catch(e){
      throw Error(e);
    }

    return o;
  }

});

var helper = {};
helper.Geometry = function Geometry (o, val) {
  var split = val.split("x");
  o.size = {
    width:  parseInt(split[0], 10) , height: parseInt(split[1], 10)
  };
};

helper.Format = function Format (o, val) {
  o.format = val.split(" ")[0];
};

helper.Depth = function Depth (o, val) {
  o.depth = parseInt(val, 10);
};

module.exports = Composite;

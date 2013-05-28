var red, blue, reset;
red   = '\033[31m';
blue  = '\033[34m';
reset = '\033[0m';

var Log = {

  debug: function(msg){
    if (this.DEBUG) {
      console.log.apply(console, arguments);
    }
  },

  error: function(msg, title){
    title = title || 'Error';
    console.log.call(console, red + '[' + title + '] ' + reset + msg);
  },

  success: function(msg, title){
    title = title || 'Success';
    console.log.call(console, blue + '[' + title + '] ' + reset + msg);
  },

  DEBUG: false

};

module.exports = Log;

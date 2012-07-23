var EventEmitter = require('events').EventEmitter;
var forEach   = require('../../lib/utils').forEach;

/**
 * var task = {
 *   task: 'quant',
 *   files: ['a.png']
 * };
 */
function Tasks(tasks, cwd){
  this.num = 0;
  this.finish = 0;
  var _this = this;
  forEach(tasks, function(task){
    var exec = require('./' + task.task);
    forEach(task.files, function(file){
      var cmd = new exec({'file': file, cwd: cwd});
      this.num = this.num + 1;
      cmd.on('finish', function(e){
        _this.emit('finish', {ret: e, file: file, task: task.task});
      });
    }, this);
  }, this);
  this._bind();
}

Tasks.prototype = new EventEmitter;

Tasks.prototype._bind = function(){
  this.on('finish', function(e){
    this.finish = this.finish + 1;
    console.log('[task ' + e.task + '] on file' + e.file + ' finish');
    if (this.finish === this.num){
      this.emit('success');
    }
  });
};

Tasks.prototype.constructor =  Tasks;
module.exports = Tasks;

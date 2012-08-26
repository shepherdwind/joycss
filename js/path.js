(function(){
  /**
   * 11 12 13 14 15
   * 21 22 23 24 25
   * 31 32 33 34 56
   * 41 42 43 44 45
   * 51 52 53 54 55
   */
  //var maps = [];
  var log = console && console.log;

  var util = {
    hasOwn: {}.hasOwnProperty,
    each: function(){
    },

    getPrime: function (num){
      var i, k, line;
      var arr = [];

      for(i = 2; i <= num; i++){
        arr.push(i);
      }

      for(i = 0; i < arr.length; i++){
        for(k = i + 1; k < arr.length; k++){
          if(arr[k]%arr[i] === 0){
            arr.splice(k, 1);
          }
        }
      }

      return arr;
    },
    /**
     * @param {array} arrCd [4, 4, 5, 6, 3]
     * @param {number} opt_nums  
     * @return {array} array of condition
     */
    getMaps: function(arrCd, opt_nums){
      var i, j = 0, ret = [];
      var time = Date.now();
      opt_primes = this.getPrime(opt_nums) || this.getPrime(300);

      for (i = 0; i < arrCd.length; i++) {
        var n = 0;
        ret.push([]);
        while(n < arrCd[i]){
          ret[i].push(opt_primes[j]);
          j++;
          n++;
        }
      }

      return ret;
    },
    /**
     * support two level array clone
     */
    cloneTwo: function(o){
      var ret = [];
      for (var j = 0; j < o.length; j++) {
        var i = o[j];
        ret.push(i.slice ? i.slice() : i);
      }
      return ret;
    },

    /**
     * sort the array given, and push soem zore in is, that means you may do not
     * choose any item of an array. the number of zero rest with the max len and
     * the length of array. At the end, the return array's length equal to the
     * numble max
     * @param {array} arr  the arry to sort randum
     */
    sortRand: function(arr, max){
      var arrTmp = this.cloneTwo(arr);

      var i = max - arrTmp.length;
      while(i){
        arrTmp.push(0);
        i--;
      }

      function rsort(){
        return Math.random() - 0.5;
      }

      arrTmp.sort(rsort);
      //delete one item
      arrTmp.splice(Math.floor(max / 2), 1);
      arrTmp.push(0);
      arrTmp.sort(rsort);

      return arrTmp;
    }
  };

  /**
   * get the way can path throught
   * @param {array} points the points can select
   * @return {array} a list of opened way
   */
  function openWay(points){
    var ret = [], i, col, line;
    var max = 7;

    for (var j = 0; j < 5; j++) {
      for (i = 0; i < points.length; i++) {
        col = points[i];
        line = util.sortRand(col);
        for (var k = 0; k < max; k++) {
          var n = k + j * max;
          ret[n] = ret[n] || [];
          if (line[k]) ret[n].push(line[k]);
        }
      }
    }

    var r = [];
    for (i = 0; i < ret.length; i++) {
      line = ret[i];
      if (line.length ==  points.length) r.push(line.slice());
    }

    return r;
  }

  function PathFinder(maps, openway, useReg){
    this.openway = openway || [];
    //map of primes
    this.maps = maps || [];
    this.useReg = useReg;

    this._way = {};
    //light of array, 0 mean not availabe, 1 mean availabe, map to the this.maps
    this.light = [];
    this.selected = [];
    //计数器
    this.count = 0;

    this.init();
  }


  PathFinder.prototype = {

    constructor: PathFinder,

    init: function(){
      this.light = util.cloneTwo(this.maps);
      var light = this.light;

      for (var i = 0; i < light.length; i++) {
        var l = light[i];
        for (var j = 0; j < l.length; j++) {
          this._way[l[j]] = [i, j]; 
          l[j] = 1;
        }
      }

      for (i = 0; i < this.openway.length; i++) {
        this.openway[i] = this.useReg ? 
        this.openway[i].join(':') : eval(this.openway[i].join('*'));
      }

      this._check();
    },

    _check: function(isAdd){
      var light = this.light;
      var maps  = this.maps;
      this.count = 0;
      var time = Date.now();
      this.time = time;

      for (var i = 0; i < light.length; i++) {

        var li = light[i];
        var selected = this._getSelected(i);

        for (var j = 0; j < li.length; j++) {
          if (li[j] !== 2){
            //如果是加一个条件，只在是light值为1的点进行选择
            if (isAdd){
              if (li[j]){
                light[i][j] = this._checkItem(maps[i][j], selected);
                this.count++;
              }
            } else {
              light[i][j] = this._checkItem(maps[i][j], selected);
              this.count++;
            }
          }
        }
      }

      this.time = Date.now() - time;
      return this.light;
    },

    _checkItem: function(item, selected){
      var openway = this.openway;
      var val;
      if (!this.useReg){
        val = item * selected;
        for (var i = 0; i < openway.length; i++) {
          this.count++;
          if (openway[i] % val === 0){
            return 1;
          }
        }

      } else {
        val = [item].concat(selected);
        val.sort(function(a, b){ return a - b; });
        var reg = new RegExp(val.map(function(i){
          return '(' + i + ')';
        }).join('[:0-9]*'));

        for (var j = 0; j < openway.length; j++) {
          this.count++;
          if (reg.test(openway[j])){
            return 1;
          }
        }
      }

      return 0;
    },

    _getSelected: function(xpath){
      var selected = this.selected;
      var _way = this._way;
      var x = 0;
      var ret = 1;
      var retArr = [];

      if (selected.length){
        for (var j = 0; j < selected.length; j++) {
          var s = selected[j];
          //xpath表示同一行，当已经被选择的和当前检测的项目再同一行的时候
          //需要忽略。
          //必须选择了 [1, 2],检测的项目是[1, 3]，不可能存在[1, 2]和[1, 3]
          //的组合，他们在同一行
          if (_way[s][0] !== xpath) {
            ret = ret * s;
            retArr.push(s);
          }
        }
      }

      return this.useReg? retArr: ret;
    },

    /**
     * @param {array} point [x, y]
     */
    add: function(point){
      point = (point instanceof Array) ? point : this._way[point];
      var val = this.maps[point[0]][point[1]];

      if (!this.light[point[0]][point[1]]){
        throw new Error('this point [' + point + 
          '] is no availabe, place choose an other');
      }

      if (val in this.selected) return;

      var isAdd = this._dealChange(point, val);
      this.selected.push(val);
      this.light[point[0]][point[1]] = 2;
      this._check(!isAdd);
    },

    _dealChange: function(point, val){
      var selected = this.selected;
      var maps = this.maps;
      for (var i = 0; i < selected.length; i++) {
        var line = this._way[selected[i]];
        if (line[0] === point[0]){
          this.light[line[0]][line[1]] = 1;
          selected.splice(i, 1);
          return true;
        }
      }

      return false;
    },

    remove: function(point){

      point = (point instanceof Array) ? point : this._way[point];

      try{
        var val = this.maps[point[0]][point[1]];
      }catch(e){}

      if (val){
        for (var i = 0; i < this.selected.length; i++) {
          if (this.selected[i] == val){
            var line = this._way[this.selected[i]];
            this.light[line[0]][line[1]] = 1;
            this.selected.splice(i, 1);
          }
        }

        this._check();
      }
    },

    getWay: function(){
      var light = this.light;
      var way = util.cloneTwo(light);
      for (var i = 0; i < light.length; i++) {
        var line = light[i];
        for (var j = 0; j < line.length; j++) {
          if (line[j]) way[i][j] = this.maps[i][j];
        }
      }

      return way;
    }
  };

  function FastFinder(){
    this.init.apply(this, arguments);
  }

  FastFinder.prototype = {
    constructor: FastFinder,
    init: function(){
    }
  };

  var Demo = function(){
    this.init.apply(this, arguments);
  };

  Demo.prototype = {
    init: function(maps, openway, useReg, uiEl){

      uiEl = uiEl || 'J_demo';
      this.uiEl = document.getElementById(uiEl);
      this.wayEl = document.getElementById('J_open_way');
      this.maps = maps;
      var ways = openway;
      this.ways = ways;
      if (uiEl == 'J_demo') this.rendWays(ways);

      this.initPath(useReg);
      this.bind();
    },
    bind: function(){
      var _this = this;
      this.uiEl.onclick = function(e){
        var target = e.target;
        var classname = target.className;
        var val = target.dataset['id'];
        if (classname.indexOf('btn') > -1){
          if (classname.indexOf('active') > -1){
            _this.PathFinder.remove(val);
            _this.rendUi(_this.maps);
          } else {
            _this.PathFinder.add(val);
            _this.rendUi(_this.maps);
          }
        }
      };
    },
    rendUi: function(maps){
      var html = '共进行' + this.PathFinder.count + '次运算，耗时' +
                 this.PathFinder.time + 'ms';
      var light = this.PathFinder.light;
      var useReg = this.PathFinder.useReg;
      if (!useReg) { html += '. result乘积最大为' + this.maxNum; }
      maps.forEach(function(amap, i){
        html += '<div class="group"><span class="text">属性' + (i + 1) + '：</span>';
        amap.forEach(function(num, j){
          if (num < 10) numV = '00' + num;
          else if (num < 100) numV = '0' + num;
          else numV = num;

          if (light[i][j] == 1){
            html += '<button data-id="' + num + '" class="btn">' + numV + '</button>';
          } else if(light[i][j] == 2) {
            html += '<button data-id="' + num + '" class="btn active btn-warning">' + numV + '</button>';
          } else {
            html += '<button data-id="' + num + '" class="btn disabled">' + numV + '</button>';
          }
        });
        html += '</div>';
      });
      this.uiEl.innerHTML = html;
    },
    rendWays: function(ways){
      var html = '可选择的路线: <br>';
      this.ways = ways;
      ways.forEach(function(way){
        html += '<div class="way ui-inline-block" id="' + way.join(':') + '">';
        html += way.join(':');
        /*
        way.forEach(function(item){
          html += '<button class="btn">' + item + '</button>';
        });
        */
        html += '</div>';
      });
      this.wayEl.innerHTML = html;
    },
    initPath: function(useReg){
      this.PathFinder = new PathFinder(this.maps, this.ways, useReg);
      var ways = this.PathFinder.getWay();
      if (!useReg){ 
        this.maxNum = Math.max.apply(null, this.PathFinder.openway); 
      }
      this.rendUi(this.maps, ways);
    }
  };

  var mapsEl = document.getElementById('J_input');
  var numsEl = document.getElementById('J_nums');
  function render(){
    var mapStr = mapsEl.value;
    var maps = util.getMaps(eval(mapStr), numsEl.value);
    var openway = openWay(maps);
    new Demo(maps, util.cloneTwo(openway), true);
    new Demo(maps, util.cloneTwo(openway), false, 'J_demo_imporve');
  }
  render();
  document.getElementById('J_sub').onclick = render;
})();

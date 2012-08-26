/**
 * Created by hanwen.sah@taobao.com.
 * Date: 2012-06-04
 * Time: 13:40
 * Desc: 自动跟随
 */
KISSY.add('market/scrollFollow', function(S){
  var D = S.DOM;
  var E = S.Event;

  /**
   * 滚动函数出发时间间隔，默认情况下，ie6 50ms，其他浏览器10ms
   */
  var FLUSH_TIME = S.UA.ie === 6 ? 50: 10;
  var cfg = {
    /**
     * 跟随的元素选择器或者dom
     */
    followEl: '',
    /**
     * 是否更新高度，有时候高度是变化的，需要每次重新计算高度
     */
    fixTop: false
  };

  /**
   * 构造器，ScrollFollow，高度自动跟随
   * @class ScrollFollow
   * @example:
   * new ScrollFollow('#J_id');
   * new ScrollFollow({followEl: '#J_id .class', fixTop: true});
   */
  function ScrollFollow(conf){

    conf = conf || {};

    if (S.isString(conf)){
      this.followEl = conf;
    } else {
      S.each(cfg, function(val, attr){
        this[attr] = conf[attr] || val;
      }, this);
    }

    this.init();
  }

  ScrollFollow.prototype = {

    constructor: ScrollFollow,

    init: function(){

      this.followEl = S.one(this.followEl);
      if (!this.followEl) return;

      if (!this.top) this.top = this.followEl.offset().top;

      this.cssPosition = this.followEl.css('position');
      this.cssWidth = this.followEl.css('width');
      this.hander = {};
      this._bind();

    },

    _bind: function(){
      E.on(window, "scroll", function(){
        var hander = this.hander;
        hander.cancel && hander.cancel();
        this.hander = S.later(this.resetPosition, FLUSH_TIME, false, this);
      }, this);
    },

    resetPosition: function(){
      var winTop = parseInt(D.scrollTop(window), 10);
      var followEl = this.followEl;
      var top = +this.top;

      if (winTop > top){
        this.fixIt(winTop);
      } else if(winTop < top && this.status !== 'auto') {

        followEl.css({
          position: this.cssPosition,
          top: top,
          width: ''
        });

        //如果高度需要修复
        if (this.fixTop) this.top = followEl.offset().top;
        this.status = 'auto';

      }
    },

    fixIt: function(winTop){

      var followEl = this.followEl;
      var top = this.top;

      if (S.UA.ie === 6){
        followEl.css({
          position: 'absolute',
          top: winTop,
          width: this.cssWidth
        });
      } else if(this.status !== 'follow'){

        followEl.css({
          position: 'fixed',
          top: 0
        });

      }
      this.status = 'follow';
    }
  };

  return ScrollFollow;

});

KISSY.add('run', function(S){
  var config = {
    runEl: '.J_run'
  };
  var DOM = S.DOM;
  function init (){
    var els = S.all(config.runEl).each(function(el){
      var html = DOM.html(el);
      var wrapEl = DOM.create('<div class="alert alert-info">');
      DOM.html(wrapEl, S.unEscapeHTML(html));
      DOM.insertBefore(wrapEl, el);
      var js = DOM.attr(el, 'data-js');
      var css = DOM.attr(el, 'data-css');
      if (js) S.getScript(js);
      if (css) S.getScript(css);
      DOM.remove(el);
    });
  }

  return init;
});

KISSY.use('market/scrollFollow, run', function(S, follow, run){
  var el = S.one('#J_nav');
  var data = {};
  S.all('h3').each(function(el){
    data[el.attr('id')] = {
      'html': el.html()
    };
  });

  /*
  S.all('h4').each(function(el){
    var id = el.attr('id');
    var id1 = id.slice(0, -2);
    if (data[id1]){
      data[id1]['subs'] = data[id1]['subs'] || {};
      data[id1]['subs'][id] = {html: el.html()};
    }
  });
  */

  var tpl = '<li><a href="#{id}">{text}</a></li>';
  var html = '';
  function addHtml(data){
    html += '<ul>';
    S.each(data, function(obj, id){
      html += S.substitute(tpl, {id: id, text: obj.html});
      if (obj.subs) addHtml(obj.subs);
    });
    html += '</ul>';
  }
  addHtml(data);
  el.append(html);
  //console.log(el.offset());
  new follow('#J_nav');

  S.later(function(){
    KISSY.EventTarget.fire('inited');
  }, 310);
  run();
});

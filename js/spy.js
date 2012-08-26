/**
 * @fileoverview KISSY版的Scroll Spy，根据当前窗口滚动的位置，高亮相应的导航
 * @author: 七念<qinian.wmq@taobao.com>
 **/
KISSY.add('gallery/scrollspy',function(S){
    var $ = S.all, $1 = S.one;
    
    function ScrollSpy (config) {
        this.init(config);
        this.refresh();
    }
    
    S.augment(ScrollSpy, {
        constructor: ScrollSpy,
        refresh: function _refresh() {
            this.targets = [];
            this.offsets = [];
            $(this.navSelector).each(function (item) {
              var dataHref = item.attr("href").replace(/\./g, '\\.'),
                    targetContent = $1(dataHref);
                
                if (/^#\w/.test(dataHref) && targetContent.length) {
                    this.targets.push(dataHref);
                    this.offsets.push(targetContent.offset().top);
                }
            }, this);
            this.process();
        },
        process: function _process() {
          var scrollTop = S.DOM.scrollTop(document) + this.$scrollElement.scrollTop() + this.offset ,
              offsets = this.offsets ,
              targets = this.targets ,
              activeTarget = this.activeTarget , i;
            
            scrollTop += offsets[0];
            for (i = offsets.length; i--;) {
              activeTarget != targets[i] && 
                              scrollTop >= offsets[i] && 
                              (!offsets[i + 1] || scrollTop <= offsets[i + 1]) &&
                              this.activate( targets[i] );
            }
        },
        activate: function _activate(target) {
            var active;
            this.activeTarget = target;

            active = $(".active", this.navContainer);
            active && active.removeClass("active");

            $(this.activerSelector + ":[href=" + target + "]").addClass("active");
        },
        init: function _init(config) {
            var conf = config;
            
            this.offset = conf.offset;
            this.navSelector = conf.navSelector;
            this.navContainer = conf.navContainer;
            this.activerSelector = conf.activerSelector;
            
            var process = S.bind(this.process, this),
                $element = $(conf.scrollArea);
            this.$scrollElement = $element.on('scroll', process);
            S.Event.on(document, 'scroll', process);
        }
    });
    
    return ScrollSpy;
}, {
    requires : [ "sizzle"]
});

KISSY.use('gallery/scrollspy, anim', function(S, Spy, Anim){
  var E = S.Event;
  var D = S.DOM;
  S.EventTarget.on('inited', function(){
    var spy = new Spy({
      offset: 0,
      navContainer: '#J_nav',
      activerSelector: 'ul a',
      scrollArea: '.content-main',
      navSelector: '#J_nav ul a'
    });
    E.delegate('#J_nav', 'click', 'a', function(e){
      e.halt();
      var target = e.currentTarget;
      var el = D.attr(target, 'href').replace(/\./g, '\\.');
      var top = D.offset(el).top;
      new Anim(window, {
        scrollTop: top - 20
      }, 0.5).run();
    });
  });
});

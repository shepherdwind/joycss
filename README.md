cssPaser
--------

###什么是cssParser

说明：详细文档，请看：[文档](http://git.shepherdwind.com/cssParser.html) 

cssParser是一个基于nodejs和php的自动拼图工具。

cssParser的目标：*使用尽可能简单，功能尽可能强大* 。

首先来个例子体验一下吧：
example:: [test.css](https://github.com/shepherdwind/cssParser/blob/master/demo/css/test.css) vs [tes.sprite.css](https://github.com/shepherdwind/cssParser/blob/master/demo/css/test.sprite.css) 
###支持的特性

根据现有的需求，主要实现以下特性：
- sprite分组支持，可以在同一个css文件合并成多个sprite图片
- sprite支持垂直和水平两种布局方式，使用非紧密拼图，和smartsprite效果一致
- x或者y方向图片平铺支持，图片水平排列支持y方向拼图，垂直排列则相反
- 支持png8和png24背景透明，默认情况下，使用png8透明
- 支持通过在css规则中的line-height或者height，width等属性，定位图片应该的位置
- sprite图片位置自定义设置，所有的配置都通过背景图url参数方式，比如：`a.png?id=1`

计划中需要实现的功能
- 开发模式到发布过程的简单切换——通过结合Plum实现
- 支持在已有sprite图片上增加或修改sprite图片
- 自动计算布局方式，使用最有布局

###如何使用

第一步，按照正常方式书写css规则，比如

```
.main-right .jieri h2 {
  background: url(../img/jieri.png) no-repeat;
  width: 80px;
}
.main-left .hunli h2 {
  background: url(../img/hunli.png) no-repeat;
  width: 80px;
}
.main-right .huabao h2 {
  background: url(../img/huabao.png) no-repeat;
  width: 80px;
}
```
  
background可以分开(position, image, repeat)写或者写在一起，不过，还是推荐使用写
在一起比较好。如何写是没有什么限制的，不过需要确定的是，background-position不要写
相对位置，那样就没法确定css的位置了，对于百分号，只支持0,50,100三个数。

第二步，对图片进行分组，去除不需要拼图的图片。

####分组规则

默认情况下，所有的图片分在同一个组，合成一张图片，需要额外分组，则在相应背景图图
片加上一个`id=\d`的参数，`\d`表示数字，从1开始计数，默认的sprite图片，id等于0，
不需要写

####url参数使用说明

cssParser的所有与开发者交互，都是通过背景图url参数来实现的，比如

```
.main-right .tese h2 {
  background: url(../img/fenlei.png?id=1&way=h) repeat-y 0 0;
  width: 480px;
}
```
  
url参数指的是上面css中，background的url中那一段`?id=1&way=h`，表示第二组sprite
图，排列方式way为水平horizontal
  
参数以及对应的意义

```
| 参数名 | 参数全名   | 参数的值   | 意义与作用                   | 使用实例    |
|--------|------------|------------|------------------------------|-------------|
| esc    | escape     | ''         | 图片无需拼图                 | a.png?esc   |
| way    | h          | horizontal | 排列方式水平排列 [g]         | a.png?way=h |
| way    | v          | vertical   | 垂直排列，默认方式[g]        | a.png?way=v |
| id     | id         | 0-9        | 分组id，id相同的图片合并一起 | a.png?id=1  |
| color  | truecolor  | ''         | 使用png24 [g]                | a.png?color |
| bg     | background | color      | 背景色，默认值是ffffff7f[g]  |             |
| b      | bottom     | \d         | 图片设置margin bottom[v]     | a.png?b=10  |
| r      | right      | \d         | 图片设置margin right[h]      | a.ong?r=10  |
```

说明：表格中，[g]标志表示为组范围内定义，一组只需定义定一个出现的图片。[h]标
志说明，只有在水平布局[horizontal]下才有效，[v]表示只在垂直布局[vertical]有
效。其他都是针对单个图片设置的

###url参数的位置说明

url参数中，在[g]下的参数，默认情况下，是读取页面第一次出现相应图片的时候。比如

```
.main-left .fenlei h2 {
  background: url(../img/fenlei.png?id=1&way=h) repeat-y 0 0;
  width: 180px;
  height: 180px;
}
.main-right .tese h2 {
  background: url(../img/tese.png?id=1) no-repeat 0 10px;
  width: 480px;
}
```
  
以上css规则中，*必须*把参数`way=h`写在第一个选择器的背景图中，不能写在第二个图片
上面，这一点规则非常重要。

####背景图片定位规则说明

背景图的位置信息，经过3个步骤的判断计算来确定的：

- 首先是从background-position中获取到top，和left的位置，position 如果没有写top，
  left，默认都是0。top和left定义不明确，比如使用相对位置也可能导致图片位置不对。
  position识别一下属性`left, 0, 100%, 50%, right, top, bottom,\dpx` \d表示数字。

- 第二步，根据图片本身的宽高，加上top和left的偏移，获得当前图片应该占有的空间

- 第三步，修正图片的大小，图片所占有的空间，应该等于背景图所在的盒子的大小，图片
  大小的修正，分两种方式，第一，使用手动设置`b=xx||r=xx`，标明底部或右边需要的空
  间。第二种，根据当前图片所在css规则的`height, width, line-height`来设置，比如
  上面一个例子中，有个css规则`width: 180px; height: 180px;`，可以确定背景图高宽。

前面两步确定了三个方向的位置，最后一步确定最后一个方向的间距。因为拼图是垂直或水
平方式，有一个方向是无需控制的。在垂直布局下，第三步只确定底部空间高度，水平布局
，第三步确定右边间距。

####背景图repeat

repeat不能同时和定位使用，也就是，有repeat，必须是position:0 0，这样的形式。

####sprite图片合并规则

sprite图片名是文件名加上spriteId加上-sprite组成的，比如文件a.css，拼图后生成的
图片地址是`a-sprite.png, a1-sprite.png`。

第三步：通过node调用

###依赖

需要nodejs和php支持，php需要有gd库支持。

###其他

非常感谢Alexander Kaupp提供的php版本
[smartsprite](http://www.tanila.de/smartsprite/index.php), 如果没有这个拼图过程
的api，cssParser还是在摸索如何拼图中，smartsprite提供了很好的拼图功能
，`src/graph/smartsprite.php`中，把smartsprite的拼图功能独立出来，通过
`src/graph/tpl.json`这样的json文件作为数据源，php版的smartsprite完成图片处理过程
， node执行css分析过程。

此外,`lib/PropertyValuePart.js`使用了
[nzakas/parser-lib](https://github.com/nzakas/parser-lib) 中的
`src/css/PropertyValuePart.js`，一个很好的css value读取代码。

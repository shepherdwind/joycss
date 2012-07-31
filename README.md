JoyCss
--------

###什么是joycss

joycss是一个基于nodejs和php的自动拼图工具。
joycss的目标：*使用简单，功能强大* 。

css生成后的效果：[test.css](https://github.com/shepherdwind/joycss/blob/master/demo/css/test.css) vs [tes.sprite.css](https://github.com/shepherdwind/joycss/blob/master/demo/css/test.sprite.css) 
###使用

```
npm install -g joycss
joycss -h
//nochange，只重重新编译css，不生成图片，当只修改css，不涉及图片修改时使用
joycss -n a.css
//-s source使用source文件，覆盖a.css，生成a.source.css
//-0c第一张图片使用紧凑拼图(close), 第二张图使用alpah模式，png24
joycss -s -0c -1a a.css
```

###依赖

* 使用php拼图，依赖gd库，要求PATH下能执行php
* 使用[pngquant](http://pngquant.org/)转换png24为png8图
* 使用[optipng](http://optipng.sourceforge.net)压缩png24图片
* pngquant和optipng都是跨平台的命令行工具，在win平台下，exe文件已经和joycss打包
  在一起，其他平台请自行安装、编译

###支持的特性

根据现有的需求，主要实现以下特点

- 支持垂直，水平和紧凑拼图三者布局方式
  - `joycss -c xx.css` 紧凑拼图
  - `joycss -y xx.css` 垂直布局
  - 水平布局也支持，不过不建议使用，使用url参数声明。请看文档。
- 三种拼图布局可以混合使用，默认情况下，紧凑拼图和垂直布局同时使用，当可以通过
  css规则确定合模型宽度，使用紧凑拼图，否则使用垂直布局方式。
- 背景图定位自定义支持，默认布局形式下，背景图bottom和right是无法确定的，如果css
  没有定义高度或宽度，默认bottom和right留10px间距。同时，可以使用url参数方式自定
  义。
- 支持多sprite图片，可以在同一个css文件合并成多个sprite图片
- x或者y方向图片平铺支持，图片水平排列支持y方向拼图，垂直排列则相反
- 支持在已有sprite图片上增加或修改sprite图片，支持追加和覆盖两种形式
- 支持png8和png24背景透明，默认情况下，使用png8透明。`joycss -a xx.css`使用png24
  在png24模式下，同时会生成png8的图片，用于兼容ie6。

###使用方式

使用非常简单，只要给我一个需要拼图的css文件，然后执行`joycss xx.css`，就好了
。joycss会自动做好改完成的，生成sprite图片，重写background-position，生成新的
sprite css文件。然后，检查一下，以下的情况，可能导致拼图出现异常的：

* 背景图中本身就有sprite图片，这个最容易引起问题，本身已经做过一次拼图的，使用
  background-position来定位的样式，如果只有一个sprite图，可以在此图后面追加，请
  在图片url中声明`?base`, 这样sprite图所定义的背景定位保持原有状态，新的往后面追加
  。如果，是有两个sprite，暂时无法支持同时修改两个sprite图片，请把这两个sprite增
  加到过滤的图片范围，在图片的url中增加参数`?esc`。

* css中没有声明高度，这种情况下，top和left定位是可以通过background-position来定位
  的，而right可以通过宽度来定位，如果没有宽度，图片独自占有一行，所以不会有问题，
  只有bottom的空隙定位，如果没有高度没法定位，此时，joycss会默认设置10px的间距，
  如果，10px间距不够，自行在背景图url中增加参数设置`?bottom=100`
  
* 背景定位使用相对定位，比如10%，这种情况无法计算，对于百分号定位，只支持0 50
  100 三种。背景图使用负值，同样会有问题，如果使用负值，可能出现sprite图片相互覆
  盖的情况。
  
* 背景图可能会被覆盖，这种情况很难被发现。sprite的样式会最终被写在页面顶部，图片
  所在的css样式中，只写了background-position，和repeat，在这中间，如果有使用
  background，background样式会被覆盖。比如：
  
  ```
    .comment-hd .sort .active,
    .comment-hd .sort .disable {
      background:#fff;
      ...
    }
    .comment-hd .sort .active{
      background:#fff url(../img/sort.png) 67px 4px no-repeat;
      color:#666;
    }
    ```
    
  在这里，`.comment-hd .sort .active`中的background将被替换为
  background-position, 而前面的一个background定义将覆盖sprite样式中定义的
  background-image,最终效果没有背景图。这种情况很难发现，尽量不要使用background
  来定义背景色吧。使用命令 `joycss xx.css -i`或者 `joycss xx.css --important`设
  置sprite规则增加important，这样可以避免背景图被重写。
 
* 背景图的repeat属性没有写，没有写repeat，安装正常情况下，css解析为repeat，但是
  大多数情况下，背景图是不会用repeat的，不写repeat只是因为box本身大小和图片一样，
  repeat和没有repeat一样，这时候，默认设置为no-repeat，如果有些图片确实需要使用
  repeat，请不要省略。垂直布局支持repeat-x，水平布局支持repeat-y。
  
好了，还有什么问题，可以查看[文档](http://git.shepherdwind.com/joycss.html) ，
或者可以直接联系我，欢迎使用。

###change

####0.4.0

- 完成css分析和css回写分离
- 增加css背景图压缩功能
- 优化css回写规则，在没有需要修改图片的时候，保存上一次命令参数
- 优化url参数范围，png24和png8兼容处理优化
- 增加命令行配置单个图片方式

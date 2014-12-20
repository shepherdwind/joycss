joycss 
======

[![Build Status](https://img.shields.io/travis/shepherdwind/joycss.svg?style=flat)](https://travis-ci.org/shepherdwind/joycss)
[![Coverage Status](https://img.shields.io/coveralls/shepherdwind/joycss/master.svg?style=flat)](https://coveralls.io/r/shepherdwind/joycss)

[![NPM](https://nodei.co/npm/joycss.png?downloads=true)](https://nodei.co/npm/joycss/)

joycss是一个基于nodejs的自动拼图工具, 目标：<strong>使用简单，功能强大</strong> 。

### 图片处理

图片处理部分，现在有两种方案可以使用

1. php, 需要命令行有php命令，并且php需要开启gd库扩展(默认是开启的)
2. java 需要有jre就可以了，java图片处理比php要慢不少，默认使用的是php

没有采用node c++扩展的方式，主要考虑到跨平台编译c++扩展，尤其是windows，太麻烦了。

###安装

```sh
npm install -g joycss
//update
npm update joycss -g
```

如果依赖有问题，查看[安装指南](https://github.com/shepherdwind/joycss/wiki/how-to-install)

###使用

```sh
$ joycss a.css
$ joycss a.less
$ joycss a.less -o out
```

#### 命令行参数

|参数|全称|含义|
|---|---|----|
|-c| --close | 紧凑拼图 |
|-x| --horizontal	| 水平布局 |
|-a| --alpha | 只生成png24图片(默认情况同时png8和png24)|
|-o| --output| 输出文件夹, 默认是`build` |
|| --api| 调用拼图api，支持php和java，默认使用php(java图片处理要慢3倍的样子) |
|| --debug| 输出debug信息 |

上面参数中，`-o,--output`，用于存放输出的文件，包括图片和css，生成文件命名规则
是如下:

```
$ joycss base.css -o out

out
|-- base-sprite.png
|-- base-sprite8.png
`-- base.css
```

#### 拼图方式

支持3种拼图方式，上面命令行参数中配置的`-x, -h`两个配置，用于选择拼图算法，默认
情况是垂直布局，close表示紧凑拼图，-x表示水平布局拼图。

在默认算法中，如果可以通过当前样式活动选择器的高宽，会自动使用紧凑算法。

### API使用

```js
var Joycss = require('joycss');
var options = {
  destCss: __dirname + '/build/base.css'
};

new Joycss(__dirname + '/base.css', options)
  .run(function(err, result){
    if (err) {
      throw new Error(err);
    }

    // result is the result of cssText
    console.log('build success');
  });

// or
var joycss = new Joycss(__dirname + '/base.css', options);
var cssText = yield joycss.run();
console.log('build success');

var destImg = joycss.options.destImg;
```

#### options 配置

```
{
  /**
   * 图片目标地址，如果没有指定，默认图片和生成的css地址一致
   */
  destImg: null,
  /**
   * 生成css地址，如果不指定，和源css路径一致
   */
  destCss: null,
  /**
   * cssText，css字符串，当存在cssText，不需要从文件中读取css字符串，第一参数
   * filename用于查找css中图片路径，比如css中图片../size.png，filename是/a/b/
   * 那么图片的绝对路径就是/a/size.png
   */
  cssText: null,
  /**
   * 使用png8模式，如果设置为false，生成png24图
   */
  force8bit : true,
  /**
   * 拼图算法，支持三种'auto | close | vertical | horizontal'
   * auto自动拼图，如果知道图片所在的盒子大小，使用紧凑拼图，否则独占一行
   * close: 紧凑拼图，搜有图片使用紧凑拼图
   * vertical: 垂直布局,
   * horizontal: 水平布局
   */
  layout : 'auto',

  // 是否保存css文件到destCss, 用在gulp这样的工具时可以用上
  save: true,

  // 图片命令行工具，支持php或者java，如果没有尝试执行php和java，自动选择
  api: 'auto'
}
```

##Questions

提问有几种方式

1. 新建[issue](https://github.com/shepherdwind/velocity.js/issues/new)
2. 邮件到eward.song at gmail.com
3. 阿里内部员工，可以通过hanwen.sah搜到我的旺旺

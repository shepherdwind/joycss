joycss 
======
[![NPM version](https://badge.fury.io/js/joycss.png)](http://badge.fury.io/js/joycss)

joycss是一个基于nodejs的自动拼图工具, 目标：<strong>使用简单，功能强大</strong> 。

文档：[joycss.org](http://joycss.org) 。

###安装

```sh
npm install -g joycss
//update
npm update joycss -g
```

####依赖

每次运行时，joycss会自动检测依赖是否满足，如果检测通过，则没有问题，如果没有通过，
会提示需要安装相关的依赖。

joycss使用php cli或者node-gd处理图片，两个随便有一个都行。php安装需要有gd库，默认
情况下，php是自带安装gd的。

####node-gd安装

以mac为例：

```sh
brew install gd
npm install node-gyp -g
npm install -g node-gd
```

linux下差不多，不过把brew换成apt-get即可。win下还在研究中，可能有点麻烦，还是装
php来来的简单得多。

###使用

```sh
$ joycss -h
$ joycss a.css
$ joycss a.less
$ joycss a.scss
$ lessc a.less | joycss -p a.css
$ joycss *.less
```

拼图后，生成一个图片文件，图片文件命名规则是css文件名+'-sprite8.png'，文件位置由
css中第一个需要拼图的图片路径相同。css命名规则是，css文件名+'.sprite.css'，如果
输入源为less文件，则生产文件名+'.css'。或者使用，`joycss --source a.css`，生成文
件为`a.css`，并且产生一个`a.source.css`文件，以后执行`joycss -s a.css`，读取css
都是`a.source.css`，生成文件为`a.css`。

###作为node模块使用

`require('joycss')`返回joycss对象，joycss上有两个对象，`joycss.Event`和`joycss.Mult`，
Event对象用于事件发布，成功后，发布一个事件`run:end`。Mult用于处理一组队列，joycss
使用php处理图片，如果一次执行多个请求需要使用Mult对象，`Mult.add`方法把一个拼图
任务加入队列，add方法接受两个参数，`args, isAutoRun`。

```
var Joycss = require('path/to/joycss');
new Joycss(filename, config, text);

//处理多个任务队列
config.each(function(){
  Joycss.Mult.add([filename, config, text]);
});
Joycss.Mult.run();
```

第一个参数必须传递，后两个可以为空

- `filename` {string} 文件名，绝对路径，css路径地址。
- `config` 配置方式，参考`./src/index.js`中的defaults对象，用于配置拼图方式和是
  否使用图片上传等。
- `text` cssText，如果传入cssText，那么不从文件中读取，并且`filename`为生成的文
  件名。如果不传递text参数，从filename中读取文件作为css输入。

![joycss](http://joycss.org/joycss.png)

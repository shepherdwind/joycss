Joycss
--------

joycss是一个基于nodejs和php的自动拼图工具。

joycss的目标：*使用简单，功能强大* 。

文档：[joycss.org](http://joycss.org)，github托管似乎会被墙，或者访问http://shepherdwind.com/joycss/ 。
![joycss](http://joycss.org/joycss.png)

###安装

```sh
npm install -g joycss
//update
npm update joycss -g
```

####依赖

joycss依赖php cli，请在cmd或者shell中运行`php -v`确定php cli在PATH下可以执行，并
且，需要安装gd库，php的依赖，只是为了处理图片——获取图片大小，并且拼图，这些操
作在nodejs还是很麻烦的。joycss把这一块对立在`src/graph/api.js`中，方便以后引进
其他方式，暂时只支持php。

此外，在非win下，需要自行安装pngquant和optipng两个命令行工具，brew或者apt-get就行。
win下自带了exe文件，无需处理。

###使用

```
joycss -h

//nochange，只重重新编译css，不生成图片，当只修改css，不涉及图片修改时使用
joycss -n a.css

//-s source使用source文件，覆盖a.css，生成a.source.css
joycss a.less

//-0c第一张图片使用紧凑拼图(close), 第二张图使用alpah模式，png24
joycss -s -0c -1a a.css
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
  Joycss.Mult.add([filename, config, text], isAutoRun);
});
```

第一个参数必须传递，后两个可以为空

- `filename` {string} 文件名，绝对路径，css路径地址。
- `config` 配置方式，参考`./src/index.js`中的defaults对象，用于配置拼图方式和是
  否使用图片上传等。
- `text` cssText，如果传入cssText，那么不从文件中读取，并且`filename`为生成的文
  件名。如果不传递text参数，从filename中读取文件作为css输入。

Joycss
--------

joycss是一个基于nodejs和php的自动拼图工具。

joycss的目标：*使用简单，功能强大* 。

文档：[joycss.org](http://joycss.org)

![joycss](http://joycss.org/joycss.png)



###使用

```sh
npm install -g joycss
joycss -h
//nochange，只重重新编译css，不生成图片，当只修改css，不涉及图片修改时使用
joycss -n a.css
joycss a.less
//-s source使用source文件，覆盖a.css，生成a.source.css
//-0c第一张图片使用紧凑拼图(close), 第二张图使用alpah模式，png24
joycss -s -0c -1a a.css
```

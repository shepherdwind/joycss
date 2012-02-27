#! /bin/sh
#定义当前路径
MYPATH=`pwd`
#定义smartsprites路径
SMARTPATH=/d/tools/smartsprites/
cd $SMARTPATH
smartsprites.sh $MYPATH/index.css
read -p "此处暂停，防止smartsprites有错误，可以看到提示."
mv $MYPATH/index.css $MYPATH/index.source.css
#修改文件路径地址
mv $MYPATH/index-sprite.css $MYPATH/index.css
# 把文件路径改/www/dogs/形式
sed -i 's/\.\.\/img/\/www\/dogs\/assets\/img/g' $MYPATH/index.css

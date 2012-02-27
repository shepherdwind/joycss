#! /bin/sh
#定义当前路径
MYPATH=`pwd`
#定义smartsprites路径
SMARTPATH=/d/tools/smartsprites/
#发布的文件
FILENAME=index
cd $SMARTPATH
./smartsprites.sh $MYPATH/$FILENAME.css
read -p "此处暂停，防止smartsprites有错误，可以看到提示."
mv $MYPATH/$FILENAME.css $MYPATH/$FILENAME.source.css
#修改文件路径地址
mv $MYPATH/$FILENAME-sprite.css $MYPATH/$FILENAME.css
# 把文件路径改/www/dogs/形式
sed -i 's/\.\.\/img/\/www\/dogs\/assets\/img/g' $MYPATH/$FILENAME.css

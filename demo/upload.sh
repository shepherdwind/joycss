#!/bin/sh

cd ../
IMGPATH = `pwd`
IMG = $IMGPATH/active_03.png
URL = http://localhost/ci/index.php?c=upload&m=do_upload
#需要增加type=image/png来设置content-type属性
curl -F userfile=@'more.png;type=image/png' --trace-ascii tarcefie http://10.13.32.27/ci/index.php?c=upload\&m=do_upload

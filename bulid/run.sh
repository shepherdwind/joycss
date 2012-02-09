#!/bin/sh

node parser.js

read -p "此处暂停，防止smartsprites有错误，可以看到提示."
vim ../css/flower.sprite.css

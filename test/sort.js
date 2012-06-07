var a = { 
  '../img/fenlei.png': { width: 80, height: 46, type: 3 },
  '../img/tese.png': { width: 80, height: 46, type: 3 },
  '../img/zhuti.png': { width: 148, height: 46, type: 3 },
  '../img/jieri.png': { width: 80, height: 46, type: 3 },
  '../img/hunli.png': { width: 80, height: 46, type: 3 },
  '../img/huabao.png': { width: 80, height: 46, type: 3 },
  '../img/jiaju.png': { width: 80, height: 46, type: 3 },
  '../img/dapei.png': { width: 120, height: 46, type: 3 },
  '../img/diy.png': { width: 106, height: 46, type: 3 },
  '../img/shenghuo.png': { width: 80, height: 46, type: 3 },
  '../img/radius.png': { width: 139, height: 21, type: 3 },
  '../img/close.png': { width: 8, height: 8, type: 3 },
  '../img/search.png': { width: 66, height: 24, type: 3 },
  '../img/tes-list.png': { width: 7, height: 9, type: 3 },
  '../img/list1.png': { width: 18, height: 18, type: 3 },
  '../img/list2.png': { width: 18, height: 21, type: 3 },
  '../img/left-list.png': { width: 41, height: 130, type: 3 },
  '../img/right-list.png': { width: 41, height: 130, type: 3 },
  '../img/festival-bg.png': { width: 270, height: 24, type: 3 },
  '../img/zixun.png': { width: 43, height: 37, type: 3 },
  '../img/weibo.png': { width: 108, height: 37, type: 3 },
  '../img/bangpai.png': { width: 99, height: 37, type: 3 } 
};
var ks = Object.keys(a);
console.log(ks);
ks.sort(function(a1, a2){
  return +a[a1].width - a[a2].width;
});
ks.forEach(function(val){
  console.log(a[val].width);
});

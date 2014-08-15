//先确保simple/build目录存在，再用 node 在当前目录执行这个文件

var process = require('child_process');
process.exec('node ../../bin/joycss base.css --dest build/base.css --imgPath ./build/', function(err){  //--imgPath是目标图片相对原css文件的路径
	if(err){ 
		throw err;
	}else{
		console.log('build succesfully');
	}
});

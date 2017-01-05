var express = require('express');

var app = express();

//幸运句
var fortune = require('./lib/fortune.js')

//指定端口号，这样可以在启动服务器前通过设置环境变量覆盖端口
//如果运行时不时3000，检查一下是否设置了环境变量PORT
app.set('port', process.env.port || 3000);

//static中间件可以将一个或者多个目录指派为包含静态资源的目录，其中资源不经过任何特殊处理直接发送到客户端
//可以在里面放图片、css文件、客户端javascript文件之类的资源
//比如在public文件夹下有一个img文件夹，引用里面图片可以直接：/img/logo.png
app.use(express.static(__dirname + '/public'))

// 设置handlebars视图引擎,默认视图为main
var handlebars = require('express3-handlebars').create({ defaultLayout: 'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

//使用中间件来检测查询字符串中的test=1.应该放在定义的所有的路由之前
//这里访问http://localhost:3000?test=1 将加载包含测试的首页
app.use(function (req, res, next) {
	// 不是运行在生产服务器上，这里会反回一个false或true
	res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
	next();
})


//配置路由，get方式请求,首页
app.get('/', function (req, res) {
	// res.type('text/plain');
	// //res.send在node的res.end上的封装的方法
	// //还用res.set和res.status替换了node的res.writeHead
	// res.send('Meadowlark Travel');
	res.render('home');
})

app.get('/about', function (req, res) {
	// res.type('text/plain');
	// res.send('About Meadowlark Travel');
	
	//渲染到页面
	res.render('about', { 
		fortune: fortune.getFortune(),
		pageTestScript: '/qa/tests-about.js'
	});

})

app.get('/tours/hood-river', function (req, res) {
	res.render('tours/hood-river');
})

app.get('/tours/request-group-rate', function (req, res) {
	res.render('tours/request-group-rate');
})


//定制404页面
//app.use是express添加中间件的一种方式
//要注意顺序，如果把404放在其他页面之前，那么404下面的都匹配不到
app.use(function (req, res, next) {
	// res.type('text/plain');
	// res.status('404');
	// res.send('404 - Not Found');
	res.status('404');
	res.render('404');
})

//定制500页面
app.use(function (err, req, res, next) {
	console.log(err.stack);
	// res.type('text/plain');
	// res.status('500');
	// res.send('500 - Server Error');
	res.status('500');
	res.render('500');
})

app.listen(app.get('port'), function () {
	console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate');
});
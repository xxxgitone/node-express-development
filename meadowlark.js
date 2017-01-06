var express = require('express');

var app = express();

//幸运句
var fortune = require('./lib/fortune.js')

//上传文件，图片
var formidable = require('formidable');


//指定端口号，这样可以在启动服务器前通过设置环境变量覆盖端口
//如果运行时不时3000，检查一下是否设置了环境变量PORT
app.set('port', process.env.port || 3000);

//static中间件可以将一个或者多个目录指派为包含静态资源的目录，其中资源不经过任何特殊处理直接发送到客户端
//可以在里面放图片、css文件、客户端javascript文件之类的资源
//比如在public文件夹下有一个img文件夹，引用里面图片可以直接：/img/logo.png
app.use(express.static(__dirname + '/public'))

//post提交，解析url编码体
app.use(require('body-parser')());

// 设置handlebars视图引擎,默认视图为main
var handlebars = require('express3-handlebars').create({ 
	defaultLayout: 'main',
	helpers: {//添加一个section辅助方法
		section: function (name, options) {
			if(!this._sections) this._sections = {};
			this._sections[name] = options.fn(this);
			return null;
		}
	}
});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

//使用中间件来检测查询字符串中的test=1.应该放在定义的所有的路由之前
//这里访问http://localhost:3000?test=1 将加载包含测试的首页
app.use(function (req, res, next) {
	// 不是运行在生产服务器上，这里会反回一个false或true
	res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
	next();
})

// 天气数据
function getWeatherData(){
    return {
        locations: [
            {
                name: 'Portland',
                forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
                weather: 'Overcast',
                temp: '54.1 F (12.3 C)',
            },
            {
                name: 'Bend',
                forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/partlycloudy.gif',
                weather: 'Partly Cloudy',
                temp: '55.0 F (12.8 C)',
            },
            {
                name: 'Manzanita',
                forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/rain.gif',
                weather: 'Light Rain',
                temp: '55.0 F (12.8 C)',
            },
        ],
    };
}

app.use(function (req, res, next) {
	if(!res.locals.partials) res.locals.partials = {};
	res.locals.partials.weather = getWeatherData();
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

app.get('/jquery-test', function(req, res){
	res.render('jquery-test');
});

app.get('/nursery-rhyme', function(req, res){
	res.render('nursery-rhyme');
});

app.get('/data/nursery-rhyme', function(req, res){
	res.json({
		animal: 'squirrel',
		bodyPart: 'tail',
		adjective: 'bushy',
		noun: 'heck',
	});
});

app.get('/newsletter', function(req, res){
	res.render('newsletter', {
		csrf: 'CSRF token goes here'
	})
})

app.post('/process', function (req, res) {
	// console.log('form (form querystring): ' + req.query.form);
	// console.log('CSRF token (form hidden form field): ' + req.body._csrf);
	// console.log('Name (form visible form field): ' + req.body.name);
	// console.log('Email (form visible form field): ' + req.body.email);
	// res.redirect(303, '/thank-you');
	//req.xhr和req.accepts是express提供的两个方便的属性，
	//如果是ajax请求，xhr是XML HTTP请求的简称，此时req.xhr为true
	//req.accepts('json,html') === 'json'表示返回的数据的最佳格式为json
	if (req.xhr || req.accepts('json,html') === 'json') {
		// 如果发生错误，应该发送{error: 'error description'}
		res.send({success: true})
	}else{
		//如果反生错误，应该重定向到错误页面
		res.redirect(303, '/thank-you');
	}
})

app.get('/contest/vacation-photo', function(req, res){
	var now = new Date();
	res.render('contest/vacation-photo', {
		year: now.getFullYear(),
		month: now.getMonth() + 1
	})
})

app.post('/contest/vacation-photo/:year/:month', function(req, res){
	var form = new formidable.IncomingForm();
	form.parse(req, function (err, fields, files) {
		if (err) {
			return res.redirect(303,'/error');
		}

		console.log('receive fields:');
		console.log(fields);
		console.log('receive files:');
		console.log(files);
		res.redirect(303,'/thank-you');
	})
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
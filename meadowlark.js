var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');

var Vacation = require('./models/vacation.js');


var app = express();

var urlencodedParser = bodyParser.urlencoded({ extended: false });
//幸运句
var fortune = require('./lib/fortune.js')

//上传文件，图片
var formidable = require('formidable');

// cookie密钥,还有其他私密信息
var credentials = require('./credentials.js');

// //发送邮件
// var nodemailer = require('nodemailer');

// var mailTransport = nodemailer.createTransport('SMTP',{
// 	srevice: 'Gmail',
// 	auth: {
// 		user: credentials.gmail.user,
// 		pass: credentials.gmail.password
// 	}
// })


// mailTransport.sendMail({
// 	from: '"Meadowlark Travel" <info@,meadowlark.com>',
// 	to: 'xxxgit@sina.com',
// 	subject: 'Your Meadowlark Travel Tour',
// 	text: 'Thank you for booking you trip with Meadowlark Travel.' + 'We look forward to you visited',
// },function (err) {
// 	if (err) {
// 		console.log('Unable to send email: ' + err);
// 	}
// })


//指定端口号，这样可以在启动服务器前通过设置环境变量覆盖端口
//如果运行时不时3000，检查一下是否设置了环境变量PORT
app.set('port', process.env.port || 3000);

//生成cookie密钥
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
    resave: false,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
}));

//static中间件可以将一个或者多个目录指派为包含静态资源的目录，其中资源不经过任何特殊处理直接发送到客户端
//可以在里面放图片、css文件、客户端javascript文件之类的资源
//比如在public文件夹下有一个img文件夹，引用里面图片可以直接：/img/logo.png
app.use(express.static(__dirname + '/public'))

//post提交，解析url编码体
//app.use(require('body-parser')());

var mongoose = require('mongoose');
var opts = {
	server: {
		socketOptions:{
			keepAlive: 1
		}
	}
};

switch(app.get('env')){
	case 'development':
		mongoose.connect(credentials.mongo.development.connectionString, opts);
		break;
	case 'production'
		mongoose.connect(credentials.mongo.development.connectionString, opts);
		break;
	default:
	 throw new Error('Unknow execution environment: ' + app.get('env'));
};

// initialize vacations
Vacation.find(function(err, vacations){
    if(vacations.length) return;

    new Vacation({
        name: 'Hood River Day Trip',
        slug: 'hood-river-day-trip',
        category: 'Day Trip',
        sku: 'HR199',
        description: 'Spend a day sailing on the Columbia and ' + 
            'enjoying craft beers in Hood River!',
        priceInCents: 9995,
        tags: ['day trip', 'hood river', 'sailing', 'windsurfing', 'breweries'],
        inSeason: true,
        maximumGuests: 16,
        available: true,
        packagesSold: 0,
    }).save();

    new Vacation({
        name: 'Oregon Coast Getaway',
        slug: 'oregon-coast-getaway',
        category: 'Weekend Getaway',
        sku: 'OC39',
        description: 'Enjoy the ocean air and quaint coastal towns!',
        priceInCents: 269995,
        tags: ['weekend getaway', 'oregon coast', 'beachcombing'],
        inSeason: false,
        maximumGuests: 8,
        available: true,
        packagesSold: 0,
    }).save();

    new Vacation({
        name: 'Rock Climbing in Bend',
        slug: 'rock-climbing-in-bend',
        category: 'Adventure',
        sku: 'B99',
        description: 'Experience the thrill of rock climbing in the high desert.',
        priceInCents: 289995,
        tags: ['weekend getaway', 'bend', 'high desert', 'rock climbing', 'hiking', 'skiing'],
        inSeason: true,
        requiresWaiver: true,
        maximumGuests: 4,
        available: false,
        packagesSold: 0,
        notes: 'The tour guide is currently recovering from a skiing accident.',
    }).save();
});


//flash即时消息
app.use(function (req, res, next) {
	//如果有即时消息，把它传到上下文，然后请出它
	res.locals.flash = req.session.flash;
	delete req.session.flash;
	next();
})

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

app.get('/thank-you', function (req, res) {
	res.render('thank-you');
})

app.get('/newsletter', function(req, res){
	// res.render('newsletter', {
	// 	csrf: 'CSRF token goes here'
	// })
	res.render('newsletter');
})

// for now, we're mocking NewsletterSignup:
function NewsletterSignup(){
}
NewsletterSignup.prototype.save = function(cb){
	cb();
};

var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;


//假设订阅简报
app.post('/newsletter', function (req, res) {
	var name = req.body.name || '', email = req.body.email || '';
	if (! email.match(VALID_EMAIL_REGEX)) {
		if (req.xhr) {
			return res.json({
				error: 'Invalid name email address'
			})
		};
		req.session.flash = {
				type: 'danger',
				intro: 'Validation error',
				message: 'The email address you entered was not valid'
		};
		return res.res.redirect(303, '/newsletter/archive');
	}
	new NewsletterSignup({ name: name, email: email }).save(function(err){
		if(err) {
			if(req.xhr) return res.json({ error: 'Database error.' });
			req.session.flash = {
				type: 'danger',
				intro: 'Database error!',
				message: 'There was a database error; please try again later.',
			};
			return res.redirect(303, '/newsletter/archive');
		}
		if(req.xhr) return res.json({ success: true });
		req.session.flash = {
			type: 'success',
			intro: 'Thank you!',
			message: 'You have now been signed up for the newsletter.',
		};
		return res.redirect(303, '/newsletter/archive');
	});
})

// 注册
// app.post('/process', urlencodedParser, function (req, res) {
// 	// console.log('form (form querystring): ' + req.query.form);
// 	// console.log('CSRF token (form hidden form field): ' + req.body._csrf);
// 	// console.log('Name (form visible form field): ' + req.body.name);
// 	// console.log('Email (form visible form field): ' + req.body.email);
// 	// res.redirect(303, '/thank-you');
// 	//req.xhr和req.accepts是express提供的两个方便的属性，
// 	//如果是ajax请求，xhr是XML HTTP请求的简称，此时req.xhr为true
// 	//req.accepts('json,html') === 'json'表示返回的数据的最佳格式为json
// 	if (req.xhr || req.accepts('json,html') === 'json') {
// 		// 如果发生错误，应该发送{error: 'error description'}
// 		res.send({success: true})
// 	}else{
// 		//如果反生错误，应该重定向到错误页面
// 		res.redirect(303, '/thank-you');
// 	}
// })

app.get('/vacations', function(req, res){
    Vacation.find({ available: true }, function(err, vacations){
        var context = {
            currency: currency,
            vacations: vacations.map(function(vacation){
                return {
                    sku: vacation.sku,
                    name: vacation.name,
                    description: vacation.description,
                    inSeason: vacation.inSeason,
                    price: convertFromUSD(vacation.priceInCents/100, currency),
                    qty: vacation.qty,
                };
            })
        };
        res.render('vacations', context);
    });
});


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

app.get('/newsletter/archive', function (req, res) {
	res.render('newsletter/archive');
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

//日志
switch(app.get('env')){
	case 'development':
		app.use(require('morgan')('dev'));
		break;
	case 'production':
		app.use(require('express-logger')({
			path:__dirname + '/log/request/log'
		}));
		break;
}

http.createServer(app).listen(app.get('port'), function () {
	console.log('Express started in ' + app.get('env') +' mode on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate');
})

// app.listen(app.get('port'), function () {
// 	console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate');
// });
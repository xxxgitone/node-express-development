//在about也页面上显示的幸运话
var fortuneCookies = [
	"Conquer your fears or they will conquer you.",
	"Rivers need springs.",
	"Do not fear what you don't konow",
	"You will have a pleasant surprise",
	"wheneven possible, keep is simple"
];

exports.getFortune = function () {
	var idx = Math.floor(Math.random() * fortuneCookies.length);
	return fortuneCookies[idx];
}
//确保关于页面上总是有有一个指向联系我们页面的链接
suite('"About" Page Test', function () {
	test('page should contain link to contact page', function () {
		assert($('a[href="/contact"]').length);
	});
})
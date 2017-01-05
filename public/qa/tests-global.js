//确保页面具有有效的标题,这里针对每一个页面
suite('Global Tests', function () {
	test('page has a valid title', function () {
		assert(document.title && document.title.match(/\S/) && 
				document.title.toUpperCase() !== 'TODO');
	})
})
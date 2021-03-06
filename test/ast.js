'use strict';
var assert = require("assert")
var fs = require('fs')
var SELF_CLOSE_REG = /\{%[\s\S]+?\/%\}/
var CLOSE_REG = /\{%\/[\s\S]+?%\}/

var parser = require('../index')(
	function operator () {
		return /\{%[\s\S]+?%\}/g
	},
	// first match self-close tag
	// this judge condition is base on the condition of operator match
	function isSelfCloseTag (c) {
		return SELF_CLOSE_REG.test(c)
	},
	// secondary match block-open tag
	// this judge condition is base on the condition of operator match
	function isOpenTag (c) {
		return !CLOSE_REG.test(c)
	},
	{
		strict: true
	}
)


function walk(node, scope) {
	var html = ''
	switch (node.nodeType) {
		case 1:
			html += node.childNodes.map(function (n) {
				return walk(n)
			}).join('')
			break
		case 2:
			html += node.openHTML
			html += node.childNodes.map(function (n) {
				return walk(n)
			}).join('')
			html += node.closeHTML
			break
		case 3:
			html += node.outerHTML
			break
		case 4:
			html += node.nodeValue
			break
	}
	return html
}
describe('AST Parser', function () {
	it('Walk then render', function () {
		var tpl = fs.readFileSync(__dirname + '/c.tpl', 'utf-8')
		var ast = parser(tpl)
		var html = walk(ast)
		assert.equal(html, tpl)
	})
	it('Render without any tag', function () {
		var tpl = '<div></div>'
		var ast = parser(tpl)
		var html = walk(ast)
		assert.equal(html, tpl)
	})
	it('Unclosing tag will throw error', function () {
		var tpl = '<div>\n{%component/%}</div> \n{%component%}'
		try {
			var ast = parser(tpl)
		} catch (e) {
			assert(/Line:3$/im.test(e.message))
			return assert(true)
		}
		assert(false)
	}),
	it('toString', function() {
		var tpl = '<div>{%component/%}</div><div>{%component%}{%component/%}{%/component%}</div>'
		var ast = parser(tpl)
		assert.equal(ast.toString(), tpl)
	})
})


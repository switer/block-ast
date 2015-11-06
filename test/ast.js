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
	}
)

var tpl = fs.readFileSync(__dirname + '/c.tpl', 'utf-8')
var ast = parser(tpl)

var NODE_FRAGMENT = 'FRAGMENT'
var NODE_SCS = 'SCS'
var NODE_TEXT = 'TEXT'
var NODE_BLOCK = 'BLOCK'

function walk(node, scope) {
	var html = ''
	switch (node.nodeType) {
		case 'FRAGMENT':
			html += node.childNodes.map(function (n) {
				return walk(n)
			}).join('')
			break
		case 'BLOCK':
			html += node.open
			html += node.childNodes.map(function (n) {
				return walk(n)
			}).join('')
			html += node.close
			break
		case 'SCS':
			html += node.nodeValue
			break
		case 'TEXT':
			html += node.nodeValue
			break
	}
	return html
}
describe('AST Parser', function () {
	it('Walk then render', function () {
		var html = walk(ast)
		assert.equal(html, tpl)
	})
})


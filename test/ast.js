'use strict';

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

var ast = parser(fs.readFileSync(__dirname + '/c.tpl', 'utf-8'))

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
			html += node.nodeValue[0]
			html += node.childNodes.map(function (n) {
				return walk(n)
			}).join('')
			html += node.nodeValue[1]
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
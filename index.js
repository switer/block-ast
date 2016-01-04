'use strict';

var NODE = 0
var NODE_FRAGMENT = 1
var NODE_BLOCK = 2
var NODE_SCS = 3
var NODE_TEXT = 4
/**
 * join arr2's items to arr
 * @param  {Array} arr1  odd number index items
 * @param  {Array} arr2  even number index items
 * @return {Array}       new array with join result
 */
function _join(arr1, arr2) {
	var len = arr1.length > arr2 ? arr1.length : arr2.length
	var joinedArr = []
	while(len --) {
		joinedArr.push(arr1.shift())
		joinedArr.push(arr2.shift())
	}
	// merge remains
	return joinedArr.concat(arr1).concat(arr2)
}
/**
 * Prototype inherit
 */
function _inherit(Ctor, Parent) {
	function Dummy () {}
	Dummy.prototype = Parent.prototype
	Ctor.prototype = new Dummy()
	Ctor.prototype.supper = function () {
		Parent.apply(this, arguments)
	}
	Ctor.prototype.constructor = Ctor
	return Ctor
}
var _id = 1
function Node() {
	this.id = _id ++
	this.nodeType = NODE
	this.nodeValue = null
	this.childNodes = []
	this.parentNode = null
}
Node.prototype.appendChild = function (n) {
	this.childNodes.push(n)
	n.parentNode = this
}
function TextNode(t) {
	this.supper()
	this.nodeType = NODE_TEXT
	this.nodeValue = t
	this.toString = TextNode2String
}
function SCSNode(o) {
	this.supper()
	this.nodeType = NODE_SCS
	this.outerHTML = o
	this.toString = SCSNode2String
}
function FragmentNode() {
	this.supper()
	this.nodeType = NODE_FRAGMENT
	this.toString = FragmentNode2String
}
function BlockNode(o) {
	this.supper()
	this.nodeType = NODE_BLOCK
	this.openHTML = o
	this.closeHTML = ''
	this.toString = BlockNode2String
}
function TextNode2String() {
	return this.nodeValue
}
function SCSNode2String() {
	return this.outerHTML
}
function FragmentNode2String() {
	return this.childNodes.map(function (node) {
		return node.toString()
	}).join('')
}
function BlockNode2String() {
	return this.openHTML + this.childNodes.map(function (node) {
		return node.toString()
	}).join('') + this.closeHTML
}
/**
 * All Nodes are inherit Node 
 */
_inherit(TextNode, Node)
_inherit(SCSNode, Node)
_inherit(FragmentNode, Node)
_inherit(BlockNode, Node)


/**
 * handle block template syntax
 * @param  {String}  text        Template string
 * @param  {RegExp}  operator Tag match regexp
 * @param  {Function} isOpen     Function return true if the part is a open tag
 * @param  {Function}  handler   Block content handler
 * @return {string}              Parsed content
 */
module.exports = function (operator, isSelfCloseTag, isOpen, options) {
	options = options || {}
	function _opertor () {
		return typeof operator == 'function' 
			? operator() 
			: operator
	}
	function _isOperator (token) {
		return !!(token && token.match(_opertor()))
	}
	return function (text) {
		var opr = _opertor()
		var tokens = _join(text.split(opr), text.match(opr) || [])
		var root = new FragmentNode()
		var pointer = root
		var unclose = {}
		var n

		function process(c, i) {
			if (!c) return
			if (_isOperator(c)) {
				if (isSelfCloseTag(c, pointer)) {
					// self-close tag
					n = new SCSNode(c)
					pointer.appendChild(n)
				} else if (isOpen(c, pointer)) {
					// block tag open
					n = new BlockNode(c)
					pointer.appendChild(n)
					// deep into
					pointer = n
					pointer._index = i
					unclose[n.id] = pointer
				} else {
					// exit, tag close
					pointer.closeHTML = c
					delete unclose[pointer.id]
					pointer = pointer.parentNode
				}
			} else {
				pointer.appendChild(new TextNode(c))
			}
		}
		tokens.forEach(process)
		for (var k in unclose) {
			if (unclose.hasOwnProperty(k) && unclose[k]) {
				var tag = unclose[k]
				var line = tokens.slice(0, tag._index).join('').split(/\r?\n/).length
				var msg = '"' + tag.openHTML + '" is not closing. Line:' + line
				if (options.strict) {
					throw new Error(msg)
				} else {
					console.log('[WARNING] ' + msg)
				}
				break
			}
		}
		return root
	}
}

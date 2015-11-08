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
function Node() {
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
}
function SCSNode(o) {
	this.supper()
	this.nodeType = NODE_SCS
	this.outerHTML = o
}
function FragmentNode() {
	this.supper()
	this.nodeType = NODE_FRAGMENT
}
function BlockNode(o) {
	this.supper()
	this.nodeType = NODE_BLOCK
	this.openHTML = o
	this.closeHTML = ''
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
module.exports = function (operator, isSelfCloseTag, isOpen) {
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
		var n

		function process(c) {
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
				} else {
					// exit, tag close
					pointer.closeHTML = c
					pointer = pointer.parentNode
				}
			} else {
				pointer.appendChild(new TextNode(c))
			}
		}
		tokens.forEach(process)
		return root
	}
}

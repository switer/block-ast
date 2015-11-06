'use strict';

var NODE_FRAGMENT = 'FRAGMENT'
var NODE_SCS = 'SCS'
var NODE_TEXT = 'TEXT'
var NODE_BLOCK = 'BLOCK'

/**
 * Get top item of the stack
 * @param  {Array} stack  stack
 */
function _stackTop (stack) {
	return stack[stack.length - 1]
}
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
function Node (t, v) {
	this.nodeType = t
	this.nodeValue = v || null
	this.childNodes = []
	this.parentNode = null
	this.closeTag = null
}
var nproto = Node.prototype
nproto.appendChild = function (n) {
	this.childNodes.push(n)
	n.parentNode = this
}

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
		var tokens = _join(text.split(opr), text.match(opr))
		var stack = []
		var root = new Node(NODE_FRAGMENT)
		var pointer = root
		var n

		function process(c) {
			if (!c) return
			if (_isOperator(c)) {
				if (isSelfCloseTag(c)) {
					// self-close tag
					n = new Node(NODE_SCS, c)
					pointer.appendChild(n)
				} else if (isOpen(c)) {
					// block tag open
					n = new Node(NODE_BLOCK, c)
					pointer.appendChild(n)
					// deep into
					pointer = n
				} else {
					pointer.closeTag = c
					// exit, close tag
					pointer = pointer.parentNode
				}
			} else {
				pointer.appendChild(new Node(NODE_TEXT, c))
			}
		}
		tokens.forEach(process)
		return root
	}
}

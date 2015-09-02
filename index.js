'use strict';

var NODE_FRAGMENT = 1
var NODE_SELF_CLOSE = 2
var NODE_TEXT = 3
var NODE_BLOCK = 4

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
module.exports = function (operator, isSelfCloseTag, isOpen, handler) {
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
			console.log(c)
			if (_isOperator(c)) {
				if (isSelfCloseTag(c)) {
					// self-close tag
					c = handler({
						type: 'close',
						tag: c
					})
					n = new Node(NODE_SELF_CLOSE, c)
					pointer.appendChild(n)
				} else if (isOpen(c)) {
					// block tag open
					stack.push(c)
					n = new Node(NODE_BLOCK)
					pointer.appendChild(n)
					// deep into
					pointer = n
					return
				} else {
					// block tag close
					// pop conent
					var v = stack.pop()
					// pop open tag
					var o = stack.pop()
					// only open tag push to stack
					if (!_isOperator(o)) {
						throw new Error('Unmatch token "' + c + '"')
					}
					// handler content
					c = handler({
						type: 'block',
						open: o,
						content: v, 
						close: c
					})
					pointer.nodeValue = c
					// exit
					pointer = pointer.parentNode
				}
			}
			var topItem = _stackTop(stack)
			if ( !_isOperator(topItem) || !isOpen(topItem)) {
				// merge result
				c = (stack.pop() || '') + '' + c
			}
			stack.push(c)
			pointer.appendChild(new Node(NODE_TEXT, c))
		}
		tokens.forEach(process)
		// return stack.join('')
		return root
	}
}

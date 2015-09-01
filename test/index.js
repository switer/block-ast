'use strict';

var assert = require("assert")
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
	function handler(ast) {
		switch (ast.type) {
			case 'close':
				return '<component />'
			case 'block':
				return '<component-block>'+ ast.content + '</component-block>'
		}
	}
)

var MAX_LENGTH = 30
function genDesc (spec) {
	var i = spec.i.length > MAX_LENGTH ? spec.i.slice(0, MAX_LENGTH) + '...' : spec.i
	var o = spec.o.length > MAX_LENGTH ? spec.o.slice(0, MAX_LENGTH) + '...' : spec.o
	return '"%s" => "%s"'
				.replace('%s', i)
				.replace('%s', o)
}

describe('#self-close tag', function () {
	var specs = [{
		i: '{%abc/%}',
		o: '<component />'
	}, {
		i: 'a{%b/%}c',
		o: 'a<component />c'
	}, {
		i: '{%a/%}{% b /%}{%c/%}',
		o: '<component /><component /><component />'
	}]
	specs.forEach(function (spec) {
		it(genDesc(spec), function () {
			var result = parser(spec.i)
			assert.equal(result, spec.o)
		})
	})
})
describe('#block tag', function () {
	var specs = [{
		i: '{%a%}{%/a%}',
		o: '<component-block></component-block>'
	}, {
		i: 'a{%a%}b{%/a%}c',
		o: 'a<component-block>b</component-block>c'
	}, {
		i: '{%a%}{%a%}{%/a%}{%a%}{%/a%}{%/a%}',
		o: '<component-block><component-block></component-block><component-block></component-block></component-block>'
	}]
	specs.forEach(function (spec) {
		it(genDesc(spec), function () {
			var result = parser(spec.i)
			assert.equal(result, spec.o)
		})
	})
})

var hybridSpecs = [{
		i: '{%a%}{%b/%}{%/a%}',
		o: '<component-block><component /></component-block>'
	}, {
		i: '{%a%}{%b/%}{%b/%}{%/a%}',
		o: '<component-block><component /><component /></component-block>'
	}, {
		i: '{%b/%}{%a%}{%b/%}{%/a%}{%b/%}',
		o: '<component /><component-block><component /></component-block><component />'
	}, {
		i: '{%a%}{%a%}{%b/%}{%/a%}{%/a%}',
		o: '<component-block><component-block><component /></component-block></component-block>'
	}]
describe('#Hybrid', function () {
	hybridSpecs.forEach(function (spec) {
		it(genDesc(spec), function () {
			var result = parser(spec.i)
			assert.equal(result, spec.o)
		})
	})
})



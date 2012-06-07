var stdclass = require('./stdclass');
var assert = require('assert').ok;

var A = function A(){
    stdclass.apply(this, arguments);
};

stdclass.extend(A, stdclass, {
    attributes : {
        a : ''
    },
    CONSIT : {
        TEST : 'consit string'
    }
});

var a1 = new A({a: 1});
var a2 = new A({a: 2});

assert.equal(a1.get('a'), 1);
assert.equal(a2.get('a'), 2);
assert.equal(a1.get('TEST'), 'consit string');
assert.equal(a1.get('TEST'), a2.get('TEST'));

a2.set('a', 3);
assert.equal(a2.get('a'), 3);
assert.equal(a1.get('a'), 1);
a2.set('TEST', 'new string');
assert(a1.get('TEST'), 'new string');

//event test
var d = 1;
a2.on('change:a', function(e){
    d = e.now;
});

assert.equal(d, 1);
a2.set('a', 4);
assert.equal(d, 4);

a1.once('change:a', function(e){
    d = e.now;
});
a1.set('a', 6);
assert.equal(d, 6);
a1.set('a', 8);
assert.equal(d, 6);

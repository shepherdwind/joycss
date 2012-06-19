var Property = require('../lib/property');
var b = new Property('background', 'url(a.png?id=1&v=3&no) no-repeat 100% 0 transparent');
var pd = new Property('padding', '10px 1px 20px 1px');
//console.log(pd.valueObj);
console.log(b.attributes);

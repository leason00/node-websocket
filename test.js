/**
 *
 * Created by leason on 2017/6/6.
 */
const crypto = require('crypto');
const hash = crypto.createHash('md5');

// 可任意多次调用update():
hash.update('Hello, world!');
// hash.update('Hello, nodejs!');

// console.log(hash.update('Hello, nodejs!'));
console.log(hash.digest('hex'));
const path = require('path');

const options = require(path.resolve('webpack.config.js'));
const Compiler = require('./Compiler');

const compiler = new Compiler(options);
compiler.run();

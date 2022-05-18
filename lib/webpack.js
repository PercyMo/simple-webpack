const path = require('path');

const config = require(path.resolve('webpack.config.js'));
const Compiler = require('./Compiler');

const compiler = new Compiler(config);
compiler.run();

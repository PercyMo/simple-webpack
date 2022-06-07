const path = require('path')

class MyPlugin {
  constructor(options) {
    console.log('MyPlugin - options', options);
  }
  apply(compiler) {
    compiler.hooks.afterCompiler.tapAsync('MyPlugin', (name, callback) => {
      setTimeout(() => {
        console.log('MyPlugin - apply', name);
        callback();
      }, 1000);
    })
  }
}

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'main.js',
  },
  module: {
    roules: [
      {
        test: /\.coffee$/,
        use: [
          path.join(__dirname, './loader/coffee-loader.js'),
        ],
      }
    ],
  },
  plugins: [
    new MyPlugin({
      name: '哈哈'
    })
  ],
};
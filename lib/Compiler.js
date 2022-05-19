const path = require('path');
const fs = require('fs');
const t = require('@babel/types')
const traverse = require('@babel/traverse').default;
const { transform, transformFromAst } = require('@babel/core');

const { SyncHook, AsyncSeriesHook } = require('./tapable');

class Compiler {
  constructor(options) {
    this.hooks = {
      // webpack 源码中貌似没有这个钩子
      entryInit: new SyncHook(),
      beforeCompiler: new AsyncSeriesHook(),
      afterCompiler: new AsyncSeriesHook(),
      afterPlugins: new SyncHook(),
      afterEmit: new AsyncSeriesHook(),
    };

    this.options = options;
    this.root = process.cwd();
    this.entry = options.entry;

    const plugins = this.options.plugins;
    if (Array.isArray(plugins)) {
      for (const plugin of plugins) {
        plugin.apply(this);
      }
    }
  }

  run() {
    this.hooks.entryInit.call();
    this.buildMoudle(path.resolve(this.root, this.entry), true);
    this.hooks.afterCompiler.callAsync('afterCompiler', () => {
      console.log('afterCompiler 异步回调执行');
    });
    this.emitFile();
  }

  getSource(modulePath) {
    const content = fs.readFileSync(modulePath, 'utf-8');
    return content;
  }

  buildMoudle(modulePath, isEntry) {
    const source = this.getSource(modulePath);
    const moduleContent = this.parse(source, modulePath);
    console.log('test', moduleContent);
  }

  // 分析模块内容
  parse(source, parentPath) {
    // 这里是偷个懒，利用 preset-env 将 ES6 import 语法先转成 require，否则处理起来太麻烦
    const { ast } = transform(source, {
      ast: true,
      presets: ['@babel/preset-env'],
      sourceType: 'module',
    })

    const dependencies = [];

    traverse(ast, {
      CallExpression({ node }) {
        if (node.callee.name === 'require') {
          const dirname = path.dirname(parentPath);
          // 拼接完整的模块路径
          let modulePath = path.join(dirname, node.arguments[0].value);
          // 补全后缀名，默认 .js
          modulePath = path.extname(modulePath) ?
            modulePath : 
            modulePath + '.js';
          
          // 加入依赖数组
          dependencies.push(modulePath);
          
          // 对 require 方法名进行改写
          node.callee.name = '__webpack_require__';
          // 替换源码中路径
          node.arguments = [t.stringLiteral(modulePath)];
        }
      }
    })

    // 处理内容，转成 AST
    const { code } = transformFromAst(ast);

    return {
      dependencies,
      code,
    };
  }

  emitFile() {}
}

module.exports = Compiler;

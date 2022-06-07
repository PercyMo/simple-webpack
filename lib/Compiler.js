const path = require('path');
const fs = require('fs');
const t = require('@babel/types')
const traverse = require('@babel/traverse').default;
const { transform, transformFromAst } = require('@babel/core');
const ejs = require('ejs');

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
    this.modules = {};
    this.entryId = '';

    const plugins = this.options.plugins;
    if (Array.isArray(plugins)) {
      for (const plugin of plugins) {
        plugin.apply(this);
      }
    }
  }

  run() {
    this.hooks.entryInit.call();
    this.entryId = this.entry;
    this.buildMoudle(this.entry);
    this.hooks.afterCompiler.callAsync('afterCompiler', () => {
      console.log('afterCompiler 异步回调执行');
    });
    this.emitFile();
  }

  getSource(modulePath) {
    const roules = this.options.module.roules;
    let content = fs.readFileSync(modulePath, 'utf-8');

    roules.forEach(roule => {
      const { test, use } = roule;

      if (test.test(modulePath)) {
        // loader 从后向前执行
        let current = use.length - 1;
        while (current >= 0) {
          const loader = require(use[current]);
          content = loader(content);
          current--;
        }
      }
    })

    return content;
  }

  buildMoudle(modulePath) {
    // 解析模块源代码
    const { code, dependencies } = this.parse(modulePath);

    this.modules[modulePath] = code;

    // 递归解析模块依赖
    dependencies.forEach(dependencie => {
      this.buildMoudle(dependencie);
    })
  }

  // 分析模块内容
  parse(modulePath) {
    const source = this.getSource(path.resolve(this.root, modulePath));

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
          const dirname = path.dirname(modulePath);
          // 拼接完整的模块路径
          let completePath = './' + path.join(dirname, node.arguments[0].value);
          // 补全后缀名，默认 .js
          completePath = path.extname(completePath) ?
            completePath : 
            completePath + '.js';
          
          // 加入依赖数组
          dependencies.push(completePath);
          
          // 对 require 方法名进行改写
          node.callee.name = '__webpack_require__';
          // 替换源码中路径
          node.arguments = [t.stringLiteral(completePath)];
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

  // 生成 bundle
  emitFile() {
    const outPath = path.join(this.options.output.path, this.options.output.filename);

    const template = this.getSource(path.join(__dirname, 'MainTemplate.ejs'));
    const bundle = ejs.render(template, {
      entryId: this.entryId,
      modules: this.modules,
    });

    fs.writeFileSync(outPath, bundle, 'utf-8');
  }
}

module.exports = Compiler;

const { SyncHook, AsyncSeriesHook } = require('./tapable');

class Compiler {
  constructor(options) {
    console.log('options');
    this.hooks = {
      // webpack 源码中貌似没有这个钩子
      entryInit: new SyncHook(),
      beforeCompiler: new AsyncSeriesHook(),
      afterCompiler: new AsyncSeriesHook(),
      afterPlugins: new SyncHook(),
      afterEmit: new AsyncSeriesHook(),
    };
    this.options = options;

    const plugins = this.options.plugins;
    if (Array.isArray(plugins)) {
      for (const plugin of plugins) {
        plugin.apply(this);
      }
    }
  }
  run() {
    this.hooks.entryInit.call();
    this.buildMoudle();
    this.hooks.afterCompiler.callAsync('afterCompiler', () => {
      console.log('afterCompiler 异步回调执行');
    });
    this.emitFile();
  }
  buildMoudle() {}
  emitFile() {}
}

module.exports = Compiler;

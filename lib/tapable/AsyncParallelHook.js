class AsyncParallelHook {
  constructor() {
    this.tasks = [];
  }
  tapAsync(name, cb) {
    this.tasks.push({ name, cb });
  }
  callAsync(...args) {
    const lastCb = args.pop();
    let index = 0;

    // resolve 函数来判断是否要去执行 lastCb，类似于 Promise.all
    const resolve = () => {
      index++;
      if (index === this.tasks.length) {
        lastCb();
      }
    };

    this.tasks.forEach(task => task.cb(...args, resolve));
  }
}

module.exports = AsyncParallelHook;
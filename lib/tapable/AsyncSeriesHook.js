class AsyncSeriesHook {
  constructor() {
    this.tasks = [];
  }
  tapAsync(name, cb) {
    this.tasks.push({ name, cb });
  }
  callAsync(...args) {
    const lastCb = args.pop();
    let index = 0;

    const next = () => {
      if (index === this.tasks.length) {
        return lastCb();
      }
      this.tasks[index].cb(...args, next);
      index++;
    };
    next();
  }
}

module.exports = AsyncSeriesHook;
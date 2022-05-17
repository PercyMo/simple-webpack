class SyncWaterfallHook {
  constructor() {
    this.tasks = [];
  }
  tap(name, cb) {
    this.tasks.push({ name, cb });
  }
  call(...arg) {
    const [first, ...others] = this.tasks;
    const ret = first.cb(...arg) || arg[0];
    others.reduce((pre, next) => {
      return next.cb(pre) || pre;
    }, ret);
  }
}

module.exports = SyncWaterfallHook;
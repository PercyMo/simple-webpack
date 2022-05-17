class SyncWaterfallHook {
  constructor() {
    this.tasks = [];
  }
  tap(name, cb) {
    this.tasks.push({ name, cb });
  }
  call(...arg) {
    let index = 0;
    while (index < this.tasks.length) {
      const result = this.tasks[index].cb(...arg);
      result !== undefined ?
        index = 0 :
        index++;
    }
  }
}

module.exports = SyncWaterfallHook;
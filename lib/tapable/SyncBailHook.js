class SyncBailHook {
  constructor() {
    this.tasks = [];
  }
  tap(name, cb) {
    this.tasks.push({ name, cb });
  }
  call(...arg) {
    for (let i = 0; i < this.tasks.length; i++) {
      const result = this.tasks[i].cb(...arg);
      if (result !== undefined) break;
    }
  }
}

module.exports = SyncBailHook;
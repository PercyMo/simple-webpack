class SyncHook {
  constructor() {
    this.tasks = [];
  }
  tap(name, cb) {
    this.tasks.push({ name, cb });
  }
  call(...arg) {
    this.tasks.forEach(task => {
      task.cb(...arg);
    })
  }
}

module.exports = SyncHook;
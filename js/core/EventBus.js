export class EventBus {
  constructor() {
    this.events = {};
  }

  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    this.events[eventName].push(callback);
  }

  emit(eventName, data = null) {
    const eventCallbacks = this.events[eventName];

    if (!eventCallbacks) {
      return;
    }

    eventCallbacks.forEach((callback) => callback(data));
  }

  off(eventName, callback) {
    if (!this.events[eventName]) {
      return;
    }

    this.events[eventName] = this.events[eventName].filter(
      (eventCallback) => eventCallback !== callback
    );
  }
}
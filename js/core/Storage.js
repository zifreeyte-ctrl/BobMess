export class Storage {
  constructor(storageKey) {
    this.storageKey = storageKey;
  }

  initialize(defaultData) {
    const existingData = localStorage.getItem(this.storageKey);

    if (!existingData) {
      this.save(defaultData);
    }
  }

  getDatabase() {
    const data = localStorage.getItem(this.storageKey);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  save(database) {
    localStorage.setItem(this.storageKey, JSON.stringify(database));
  }

  get(collectionName) {
    const database = this.getDatabase();

    return database[collectionName];
  }

  set(collectionName, value) {
    const database = this.getDatabase();

    database[collectionName] = value;

    this.save(database);
  }

  update(callback) {
    const database = this.getDatabase();

    callback(database);

    this.save(database);
  }

  clear() {
    localStorage.removeItem(this.storageKey);
  }
}
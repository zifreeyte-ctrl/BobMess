export class Storage {
  constructor(storageKey) {
    this.storageKey = storageKey;
  }

  initialize(defaultData) {
    const existingData = localStorage.getItem(this.storageKey);

    if (!existingData) {
      this.save(defaultData);
      return;
    }

    try {
      JSON.parse(existingData);
    } catch (error) {
      console.warn("BOB database is corrupted. Resetting database.");
      this.save(defaultData);
    }
  }

  getDatabase() {
    const data = localStorage.getItem(this.storageKey);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error("Cannot parse BOB database:", error);
      return null;
    }
  }

  save(database) {
    localStorage.setItem(this.storageKey, JSON.stringify(database));
  }

  get(collectionName) {
    const database = this.getDatabase();

    if (!database) {
      return null;
    }

    return database[collectionName];
  }

  set(collectionName, value) {
    const database = this.getDatabase();

    if (!database) {
      return;
    }

    database[collectionName] = value;

    this.save(database);
  }

  update(callback) {
    const database = this.getDatabase();

    if (!database) {
      return;
    }

    callback(database);

    this.save(database);
  }

  export() {
    return JSON.stringify(this.getDatabase(), null, 2);
  }

  import(json) {
    const database = JSON.parse(json);

    this.save(database);
  }

  clear() {
    localStorage.removeItem(this.storageKey);
  }
}
export class ThemeService {
  constructor(storage) {
    this.storage = storage;
  }

  getTheme() {
    const settings = this.storage.get("settings") || {};
    return settings.theme === "light" ? "light" : "dark";
  }

  applySavedTheme() {
    document.body.dataset.theme = this.getTheme();
  }

  setTheme(theme) {
    const nextTheme = theme === "light" ? "light" : "dark";

    this.storage.update((database) => {
      if (!database.settings) {
        database.settings = {};
      }

      database.settings.theme = nextTheme;
    });

    document.body.dataset.theme = nextTheme;

    return nextTheme;
  }

  toggleTheme() {
    const nextTheme = this.getTheme() === "dark" ? "light" : "dark";
    return this.setTheme(nextTheme);
  }
}